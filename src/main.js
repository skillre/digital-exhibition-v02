// src/main.js — 数字展厅应用入口
// Phase 1: 引擎初始化 + 基础场景
// Phase 2+: 导入 hall/camera/content/exhibits/ui 模块

import { isMobile, createLoadingTracker } from './utils.js';

async function init() {
  const tracker = createLoadingTracker();
  tracker.setProgress(5, '正在检测设备...');

  // ── 移动端检测 ──
  if (isMobile()) {
    document.getElementById('mobile-notice').style.display = 'flex';
    document.getElementById('loading-screen').style.display = 'none';
    return;
  }

  tracker.setProgress(15, '正在初始化渲染引擎...');

  // ── Babylon.js 引擎初始化 ──
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
  });

  tracker.setProgress(30, '正在创建场景...');

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.10, 0.12, 0.16, 1);  // 深色背景匹配暗墙
  scene.ambientColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  // ── 环境贴图（PBR 反射的核心）──
  const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('lib/environment.env', scene);
  scene.environmentTexture = envTexture;
  scene.environmentIntensity = 0.5;  // 中等反射强度，不洗掉颜色

  // 发光层
  const glowLayer = new BABYLON.GlowLayer('glow', scene, { mainTextureFixedSize: 512 });
  glowLayer.intensity = 0.5;

  // ── Phase 1 临时灯光（Phase 2 替换）──
  const light = new BABYLON.HemisphericLight('temp-light', new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.6;

  // Phase 2 创建展厅后，Phase 3 替换相机
  let cameraCtrl = null;

  // 临时地板占位（Phase 2 构建展厅后移除）
  const tempGround = BABYLON.MeshBuilder.CreateGround('temp-ground', { width: 50, height: 50 }, scene);
  tempGround.material = new BABYLON.StandardMaterial('temp-ground-mat', scene);
  tempGround.material.diffuseColor = new BABYLON.Color3(0.08, 0.09, 0.12);

  tracker.setProgress(50, '正在构建展厅空间...');

  // ── Phase 2: 展厅几何体 + 灯光 ──
  const { createHall } = await import('./hall.js');
  const { setupLighting } = await import('./lighting.js');
  const hallInfo = createHall(scene);
  setupLighting(scene, hallInfo.zones);

  // 移除临时地板和灯光
  scene.getMeshByName('temp-ground')?.dispose();
  scene.getLightByName('temp-light')?.dispose();

  // ── 装饰系统（立柱/灯带/地板标记/拱门/全息/粒子）──
  const { addDecorations } = await import('./decorations.js');
  const decoMeshes = addDecorations(scene, hallInfo);
  // 冻结装饰 mesh 的世界矩阵
  decoMeshes.forEach(m => { m.freezeWorldMatrix(); m.isPickable = false; });

  tracker.setProgress(65, '正在配置漫游相机...');

  // ── Phase 3: 第一人称相机 ──
  const { setupCamera } = await import('./camera.js');
  cameraCtrl = setupCamera(scene, canvas, hallInfo);

  // 移除临时相机
  scene.getCameraByName('temp-cam')?.dispose();

  // ── 后期处理管线 ──
  const pipeline = new BABYLON.DefaultRenderingPipeline('pipeline', true, scene, [cameraCtrl.camera]);
  pipeline.samples = 4;
  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.35;
  pipeline.bloomWeight = 0.3;
  pipeline.bloomKernel = 64;
  pipeline.bloomScale = 0.5;
  // 色调映射
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  pipeline.imageProcessing.exposure = 1.25;
  pipeline.imageProcessing.contrast = 1.12;    // 适度对比度 → 层次感
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 1.0;
  pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
  pipeline.imageProcessing.vignetteStretch = 0.5;

  // ── 锐化（通过 DefaultRenderingPipeline 内置）──
  if (pipeline.sharpenEnabled !== undefined) {
    pipeline.sharpenEnabled = true;
    pipeline.sharpen.edgeAmount = 0.3;
    pipeline.sharpen.colorAmount = 1.0;
  }

  // ── SSAO2（屏幕空间环境光遮蔽 → 接触阴影）──
  const ssao = new BABYLON.SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 });
  ssao.radius = 2.5;
  ssao.totalStrength = 1.2;
  ssao.base = 0.1;
  ssao.samples = 16;
  ssao.maxZ = 100;
  ssao.minZAspect = 0.5;
  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', cameraCtrl.camera);

  // ── 多光源阴影 ──
  const floor = scene.getMeshByName('floor');
  const shadowLights = ['poster-spot-0', 'poster-spot-1', 'poster-spot-2'];
  for (const lightName of shadowLights) {
    const light = scene.getLightByName(lightName);
    if (!light) continue;
    const sg = new BABYLON.ShadowGenerator(512, light);
    sg.usePercentageCloserFiltering = true;
    sg.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
    sg.darkness = 0.5;
    scene.meshes.forEach(m => {
      if (m.name.includes('poster-board') || m.name.includes('poster-lightbar') || m.name.includes('showcase-') || m.name.includes('col-')) {
        sg.addShadowCaster(m);
      }
    });
  }
  if (floor) floor.receiveShadows = true;

  // ── 地板平面反射（MirrorTexture）──
  if (floor) {
    const mirror = new BABYLON.MirrorTexture('floor-mirror', 512, scene, true);
    mirror.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
    mirror.renderList = scene.meshes.filter(m =>
      m.name.includes('col-') || m.name.includes('poster-board') || m.name.includes('holo-screen') || m.name.includes('holo-base') || m.name.includes('hp') || m.name.includes('icon-')
    );
    mirror.level = 0.15; // 反射强度（0=无，1=全反射）
    mirror.adaptiveBlurKernel = 32;
    floor.material.reflectionTexture = mirror;
  }

  tracker.setProgress(75, '正在加载展品内容...');

  // ── Phase 4: 内容加载 + 展品创建 ──
  const { loadContent } = await import('./content-loader.js');
  const { createExhibits } = await import('./exhibits.js');
  let content, exhibits;
  try {
    content = await loadContent();
    exhibits = await createExhibits(scene, content, hallInfo);
  } catch (e) {
    console.warn('内容加载失败:', e.message);
    content = { meta: {}, zones: [], getZone: () => null };
    exhibits = { posterExhibits: [], videoExhibits: [], docExhibits: [] };
  }

  tracker.setProgress(85, '正在初始化交互界面...');

  // ── Phase 5: UI 系统 + 视频播放器 + 拾取 ──
  const { setupUI } = await import('./ui.js');
  const { createVideoPlayer } = await import('./video-player.js');
  const ui = setupUI(content, exhibits, cameraCtrl);

  // 为每个视频展品创建播放器并绑定到屏幕
  if (exhibits && exhibits.videoExhibits) {
    for (const ve of exhibits.videoExhibits) {
      const player = createVideoPlayer(scene, ve.mesh, ve.data.src, ve.data.poster);
      // 更新 metadata.toggle 为实际的播放/暂停函数
      ve.mesh.metadata.toggle = player.togglePlayback;
    }
  }

  // 设置拾取系统（点击展品交互）
  scene.onPointerDown = (evt, pickResult) => {
    if (!pickResult.hit || !pickResult.pickedMesh || !pickResult.pickedMesh.metadata) return;
    const meta = pickResult.pickedMesh.metadata;
    if (meta.type === 'poster') {
      ui.showPosterPanel(meta.item);
    } else if (meta.type === 'video' && meta.toggle) {
      meta.toggle();
    } else if (meta.type === 'document') {
      ui.showDocPanel(meta.item);
    }
  };

  // ── Phase 6: 导航菜单 ──
  ui.createNavMenu(hallInfo);

  tracker.setProgress(95, '准备就绪...');

  // ── 渲染循环 ──
  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());

  // ── 加载完成 ──
  tracker.complete();

  // 暴露到全局供调试
  window.__exhibition = { engine, scene, hallInfo, cameraCtrl };
}



// ── 启动 ──
init().catch(err => {
  console.error('展厅初始化失败:', err);
  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = '加载失败，请刷新页面重试';
});
