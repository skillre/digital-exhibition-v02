// src/main.js — 数字展厅应用入口
// 使用 GLB 模型作为展厅空间

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

  tracker.setProgress(25, '正在创建场景...');

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.05, 0.06, 0.08, 1);  // 深色背景
  scene.ambientColor = new BABYLON.Color3(0.15, 0.15, 0.18);

  // ── 环境贴图：降低强度，让烘焙纹理主导 ──
  const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('lib/environment.env', scene);
  scene.environmentTexture = envTexture;
  scene.environmentIntensity = 0.3;  // 大幅降低，避免影响烘焙效果

  // 发光层：极低强度
  const glowLayer = new BABYLON.GlowLayer('glow', scene, { mainTextureFixedSize: 512 });
  glowLayer.intensity = 0.15;

  // ── 临时灯光（GLB 加载后替换）──
  const tempLight = new BABYLON.HemisphericLight('temp-light', new BABYLON.Vector3(0, 1, 0), scene);
  tempLight.intensity = 0.6;

  tracker.setProgress(40, '正在加载展厅模型...');

  // ── 加载 GLB 展厅模型 + 创建展品挂载点 ──
  console.log('[main] 准备加载 hall.js...');
  const { createHall } = await import('./hall.js');
  console.log('[main] hall.js 已加载, 开始 createHall...');

  let hallInfo;
  try {
    hallInfo = await createHall(scene);
    console.log('[main] createHall 完成, zones:', hallInfo.zones.size, '个');
  } catch (err) {
    console.error('[main] createHall 失败:', err);
    console.error('[main] 错误堆栈:', err.stack);
    throw err;
  }

  // 移除临时灯光
  scene.getLightByName('temp-light')?.dispose();

  tracker.setProgress(60, '正在配置灯光...');

  // ── 灯光系统（针对烘焙模型调低强度）──
  const { setupLighting } = await import('./lighting.js');
  setupLighting(scene, hallInfo.zones);

  tracker.setProgress(65, '正在配置漫游相机...');

  // ── 第一人称相机 ──
  const { setupCamera } = await import('./camera.js');
  const cameraCtrl = setupCamera(scene, canvas, hallInfo);

  // ── 后期处理：仅保留抗锯齿，关闭其他效果以还原烘焙模型原始外观 ──
  const pipeline = new BABYLON.DefaultRenderingPipeline('pipeline', true, scene, [cameraCtrl.camera]);
  pipeline.samples = 4;
  pipeline.fxaaEnabled = true;

  // 关闭 Bloom
  pipeline.bloomEnabled = false;

  // 关闭色调映射和曝光调整，保持原始颜色
  pipeline.imageProcessing.toneMappingEnabled = false;
  pipeline.imageProcessing.exposure = 1.0;   // 不调整曝光
  pipeline.imageProcessing.contrast = 1.0;   // 不调整对比度
  pipeline.imageProcessing.vignetteEnabled = false;

  // 关闭锐化
  if (pipeline.sharpenEnabled !== undefined) {
    pipeline.sharpenEnabled = false;
  }

  // 关闭 SSAO
  // （不创建 SSAO 管线，完全依赖烘焙光照）

  tracker.setProgress(75, '正在加载展品内容...');

  // ── 内容加载 + 展品创建 ──
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

  // ── UI 系统 ──
  const { setupUI } = await import('./ui.js');
  const ui = setupUI(content, exhibits, cameraCtrl);
  ui.setupCrosshair(scene);
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
