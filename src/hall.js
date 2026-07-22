// src/hall.js — 加载 GLB 房间模型 + 创建展品挂载点
// 用下载的 VR-Art-Gallery-Lobby-Baked.glb 替代程序化建模

import {
  createBoardMaterial,
  createMetalMaterial,
} from './utils.js';

const MODEL_PATH = 'assets/models/';
const MODEL_FILE = 'VR-Art-Gallery-Lobby-Baked.glb';

// ── 模型方向调整（弧度）──
// 如果模型朝向不对，修改这里的旋转值
// 0 = 不旋转, Math.PI/2 = 90°, Math.PI = 180°, -Math.PI/2 = -90°
// X轴逆时针旋转 90°
const MODEL_ROTATION_X = Math.PI / 2;  // +90° 逆时针旋转
const MODEL_ROTATION_Y = 0;
const MODEL_ROTATION_Z = 0;

// ── 调试模式：显示坐标轴和边界框 ──
const DEBUG_AXES = true;

// ── 展品挂载点配置（根据 GLB 房间布局微调）──
// 这些位置在模型加载后会根据实际包围盒自动调整
const EXHIBIT_CONFIG = {
  // 海报展板：挂在北墙（Z 正方向墙面）
  posterBoards: {
    count: 2,
    boardW: 1.8,
    boardH: 1.2,
    gap: 0.3,
    wallOffset: 0.15,   // 离墙距离
    baseY: 1.5,         // 展板底部高度
  },
  // 视频屏幕：挂在东墙
  videoScreen: {
    width: 5.0,
    height: 2.8,
    wallOffset: 0.15,
    centerY: 2.0,
  },
  // 副视频屏：南墙右侧
  videoSubScreen: {
    width: 3.0,
    height: 1.8,
    wallOffset: 0.15,
    centerY: 2.0,
  },
  // 文档全息屏：房间中部
  holoScreens: {
    count: 2,
    width: 1.5,
    height: 1.0,
    gap: 3.5,
    baseY: 1.5,
    zOffset: 2,
  },
};

/**
 * 加载 GLB 房间模型并创建展品挂载点
 * @param {BABYLON.Scene} scene
 * @returns {Promise<{ zones: Map, hallMeshes: BABYLON.Mesh[] }>}
 */
export async function createHall(scene) {
  const zones = new Map();
  const hallMeshes = [];

  // ═══════════════════════════════════════
  // 1. 加载 GLB 模型
  // ═══════════════════════════════════════
  console.log('[展厅] 开始加载 GLB 模型...');
  console.log('[展厅] 模型路径:', MODEL_PATH + MODEL_FILE);

  let result;
  try {
    result = await BABYLON.SceneLoader.ImportMeshAsync(
      '', MODEL_PATH, MODEL_FILE, scene,
      (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          console.log(`[展厅] 模型加载进度: ${pct}%`);
        }
      }
    );
    console.log(`[展厅] GLB 加载成功! mesh 数量: ${result.meshes.length}`);
  } catch (err) {
    console.error('[展厅] GLB 加载失败:', err);
    console.error('[展厅] 请检查文件路径和格式是否正确');
    throw err;
  }

  // ═══════════════════════════════════════
  // 2. 处理加载的 mesh（手动创建父节点并重新挂载）
  // ═══════════════════════════════════════
  // 创建新的父节点用于控制旋转
  const roomRoot = new BABYLON.TransformNode('room-root', scene);
  console.log('[展厅] 创建父节点: room-root');

  const roomMeshes = [];

  for (const mesh of result.meshes) {
    // 跳过 __root__ TransformNode
    if (mesh.name === '__root__') continue;

    // 设置碰撞
    mesh.checkCollisions = true;
    mesh.isPickable = false;
    mesh.receiveShadows = true;

    // 重新挂载到 roomRoot
    mesh.parent = roomRoot;

    roomMeshes.push(mesh);
    hallMeshes.push(mesh);
  }
  console.log(`[展厅] 重新挂载 ${roomMeshes.length} 个 mesh 到 roomRoot`);

  // ── 应用模型旋转（旋转新的父节点）──
  if (MODEL_ROTATION_X !== 0) {
    roomRoot.rotation.x = MODEL_ROTATION_X;
    console.log(`[展厅] 模型X轴旋转: ${(MODEL_ROTATION_X * 180 / Math.PI).toFixed(0)}°`);
  }
  if (MODEL_ROTATION_Y !== 0) {
    roomRoot.rotation.y = MODEL_ROTATION_Y;
    console.log(`[展厅] 模型Y轴旋转: ${(MODEL_ROTATION_Y * 180 / Math.PI).toFixed(0)}°`);
  }
  if (MODEL_ROTATION_Z !== 0) {
    roomRoot.rotation.z = MODEL_ROTATION_Z;
    console.log(`[展厅] 模型Z轴旋转: ${(MODEL_ROTATION_Z * 180 / Math.PI).toFixed(0)}°`);
  }

  // ── 强制更新世界矩阵（确保旋转生效后再计算 bounds）──
  roomRoot.computeWorldMatrix(true);
  roomMeshes.forEach(m => m.computeWorldMatrix(true));
  console.log('[展厅] 世界矩阵已更新');

  // ── 调试：显示坐标轴 ──
  if (DEBUG_AXES) {
    createDebugAxes(scene, roomMeshes);
  }

  // ═══════════════════════════════════════
  // 3. 计算房间包围盒，自动缩放到合适尺寸
  // ═══════════════════════════════════════
  console.log(`[展厅] roomRoot 旋转后位置: (${roomRoot.position.x.toFixed(2)}, ${roomRoot.position.y.toFixed(2)}, ${roomRoot.position.z.toFixed(2)})`);
  console.log(`[展厅] roomRoot 旋转: (${(roomRoot.rotation.x * 180 / Math.PI).toFixed(0)}°, ${(roomRoot.rotation.y * 180 / Math.PI).toFixed(0)}°, ${(roomRoot.rotation.z * 180 / Math.PI).toFixed(0)}°)`);

  let bounds = computeSceneBounds(roomMeshes);
  console.log('[展厅] 旋转后包围盒:', JSON.stringify(bounds));

  let roomW = bounds.maxX - bounds.minX;
  let roomD = bounds.maxZ - bounds.minZ;
  let roomH = bounds.maxY - bounds.minY;

  console.log(`[展厅] 旋转后尺寸: W=${roomW.toFixed(1)} D=${roomD.toFixed(1)} H=${roomH.toFixed(1)}`);
  console.log(`[展厅] X轴范围: ${bounds.minX.toFixed(2)} ~ ${bounds.maxX.toFixed(2)}`);
  console.log(`[展厅] Y轴范围: ${bounds.minY.toFixed(2)} ~ ${bounds.maxY.toFixed(2)}`);
  console.log(`[展厅] Z轴范围: ${bounds.minZ.toFixed(2)} ~ ${bounds.maxZ.toFixed(2)}`);

  // 自动缩放：使最大维度约为 25m（匹配展品尺寸）
  const TARGET_SIZE = 25;
  const maxDim = Math.max(roomW, roomD, roomH);
  if (maxDim > 0) {
    const scale = TARGET_SIZE / maxDim;
    // 只在偏差较大时缩放（0.3x ~ 3x 范围外）
    if (scale < 0.3 || scale > 3.0) {
      console.log(`[展厅] 自动缩放: ${scale.toFixed(3)}x`);
      rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
      // 重新计算 bounds
      bounds = computeSceneBounds(roomMeshes);
      roomW = bounds.maxX - bounds.minX;
      roomD = bounds.maxZ - bounds.minZ;
      roomH = bounds.maxY - bounds.minY;
    }
  }

  const centerX = (bounds.maxX + bounds.minX) / 2;
  const centerZ = (bounds.maxZ + bounds.minZ) / 2;
  const halfW = roomW / 2;
  const halfD = roomD / 2;

  console.log(`[展厅] 最终尺寸: W=${roomW.toFixed(1)} D=${roomD.toFixed(1)} H=${roomH.toFixed(1)}`);

  // ═══════════════════════════════════════
  // 4. 创建展品挂载平面
  // ═══════════════════════════════════════

  // ── 海报展板（北墙，即 Z 正方向最大值一侧）──
  const posterCfg = EXHIBIT_CONFIG.posterBoards;
  const boards = [];
  const totalPosterW = posterCfg.count * posterCfg.boardW + (posterCfg.count - 1) * posterCfg.gap;
  const posterStartX = centerX - totalPosterW / 2 + posterCfg.boardW / 2;
  const northWallZ = bounds.maxZ - posterCfg.wallOffset;

  for (let i = 0; i < posterCfg.count; i++) {
    const board = BABYLON.MeshBuilder.CreatePlane(`poster-board-${i}`, {
      width: posterCfg.boardW, height: posterCfg.boardH
    }, scene);
    board.position = new BABYLON.Vector3(
      posterStartX + i * (posterCfg.boardW + posterCfg.gap),
      posterCfg.baseY,
      northWallZ
    );
    board.rotation.y = Math.PI; // 面向房间内部
    board.material = createBoardMaterial(scene, `board-mat-${i}`);
    board.isPickable = true;
    boards.push(board);
    hallMeshes.push(board);
  }

  // ── 主视频屏（东墙，X 正方向最大值一侧）──
  const vidCfg = EXHIBIT_CONFIG.videoScreen;
  const eastWallX = bounds.maxX - vidCfg.wallOffset;
  const screen = BABYLON.MeshBuilder.CreatePlane('video-screen', {
    width: vidCfg.width, height: vidCfg.height
  }, scene);
  screen.position = new BABYLON.Vector3(eastWallX, vidCfg.centerY, centerZ);
  screen.rotation.y = Math.PI / 2;
  const screenMat = new BABYLON.PBRMaterial('screen-pbr', scene);
  screenMat.albedoColor = new BABYLON.Color3(0.22, 0.26, 0.40);
  screenMat.metallic = 0.3;
  screenMat.roughness = 0.4;
  screenMat.emissiveColor = new BABYLON.Color3(0.12, 0.15, 0.25);
  screenMat.environmentIntensity = 0.6;
  screen.material = screenMat;
  screen.isPickable = true;
  hallMeshes.push(screen);

  // 主屏边框
  const borderMat = createMetalMaterial(scene, 'screen-border', new BABYLON.Color3(0.15, 0.18, 0.25));
  const bw = 0.1;
  [
    { w: vidCfg.width + bw * 2, h: bw, x: 0, y: vidCfg.height / 2 + bw / 2 },
    { w: vidCfg.width + bw * 2, h: bw, x: 0, y: -(vidCfg.height / 2 + bw / 2) },
    { w: bw, h: vidCfg.height, x: -(vidCfg.width / 2 + bw / 2), y: 0 },
    { w: bw, h: vidCfg.height, x: vidCfg.width / 2 + bw / 2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`screen-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.02);
    b.parent = screen;
    b.material = borderMat;
  });

  // ── 副视频屏（南墙右侧，Z 负方向最小值一侧）──
  const subCfg = EXHIBIT_CONFIG.videoSubScreen;
  const southWallZ = bounds.minZ + subCfg.wallOffset;
  const subScreen = BABYLON.MeshBuilder.CreatePlane('video-screen-sub', {
    width: subCfg.width, height: subCfg.height
  }, scene);
  subScreen.position = new BABYLON.Vector3(centerX + halfW * 0.35, subCfg.centerY, southWallZ);
  subScreen.rotation.y = 0;
  const subScreenMat = new BABYLON.PBRMaterial('screen-sub-pbr', scene);
  subScreenMat.albedoColor = new BABYLON.Color3(0.15, 0.18, 0.28);
  subScreenMat.metallic = 0.3;
  subScreenMat.roughness = 0.4;
  subScreenMat.emissiveColor = new BABYLON.Color3(0.08, 0.10, 0.18);
  subScreen.material = subScreenMat;
  subScreen.isPickable = true;
  hallMeshes.push(subScreen);

  // 副屏边框
  [
    { w: subCfg.width + bw * 2, h: bw, x: 0, y: subCfg.height / 2 + bw / 2 },
    { w: subCfg.width + bw * 2, h: bw, x: 0, y: -(subCfg.height / 2 + bw / 2) },
    { w: bw, h: subCfg.height, x: -(subCfg.width / 2 + bw / 2), y: 0 },
    { w: bw, h: subCfg.height, x: subCfg.width / 2 + bw / 2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`sub-screen-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.02);
    b.parent = subScreen;
    b.material = borderMat;
  });

  // ── 文档全息屏（房间中部）──
  const holoCfg = EXHIBIT_CONFIG.holoScreens;
  const holoScreens = [];
  const totalHoloW = holoCfg.count * holoCfg.width + (holoCfg.count - 1) * holoCfg.gap;
  const holoStartX = centerX - totalHoloW / 2 + holoCfg.width / 2;
  const holoZ = centerZ + holoCfg.zOffset;

  for (let i = 0; i < holoCfg.count; i++) {
    const x = holoStartX + i * (holoCfg.width + holoCfg.gap);

    // 全息屏
    const hs = BABYLON.MeshBuilder.CreatePlane(`holo-screen-${i}`, {
      width: holoCfg.width, height: holoCfg.height
    }, scene);
    hs.position = new BABYLON.Vector3(x, holoCfg.baseY, holoZ);
    const holoMat = new BABYLON.StandardMaterial(`holo-mat-${i}`, scene);
    holoMat.diffuseColor = new BABYLON.Color3(0, 0.35, 0.7);
    holoMat.emissiveColor = new BABYLON.Color3(0, 0.45, 0.85);
    holoMat.alpha = 0.85;
    holoMat.backFaceCulling = false;
    hs.material = holoMat;
    hs.isPickable = true;

    // 全息屏边框
    const frameMat = createMetalMaterial(scene, `holo-frame-${i}`, new BABYLON.Color3(0.4, 0.45, 0.55));
    const fw = 0.04;
    [
      { w: holoCfg.width + fw * 2, h: fw, x: 0, y: holoCfg.height / 2 + fw / 2 },
      { w: holoCfg.width + fw * 2, h: fw, x: 0, y: -(holoCfg.height / 2 + fw / 2) },
      { w: fw, h: holoCfg.height, x: -(holoCfg.width / 2 + fw / 2), y: 0 },
      { w: fw, h: holoCfg.height, x: holoCfg.width / 2 + fw / 2, y: 0 },
    ].forEach((s, j) => {
      const f = BABYLON.MeshBuilder.CreatePlane(`holo-frame-${i}-${j}`, { width: s.w, height: s.h }, scene);
      f.position = new BABYLON.Vector3(s.x, s.y, -0.005);
      f.parent = hs;
      f.material = frameMat;
    });

    // 角落发光节点
    const nodeMat = new BABYLON.StandardMaterial(`holo-node-${i}`, scene);
    nodeMat.emissiveColor = new BABYLON.Color3(0, 0.7, 1.0);
    [
      [-holoCfg.width / 2, holoCfg.height / 2],
      [holoCfg.width / 2, holoCfg.height / 2],
      [-holoCfg.width / 2, -holoCfg.height / 2],
      [holoCfg.width / 2, -holoCfg.height / 2],
    ].forEach(([dx, dy], ni) => {
      const node = BABYLON.MeshBuilder.CreateSphere(`holo-node-${i}-${ni}`, { diameter: 0.06, segments: 8 }, scene);
      node.position = new BABYLON.Vector3(dx, dy, -0.01);
      node.parent = hs;
      node.material = nodeMat;
    });

    // 底座
    const base = BABYLON.MeshBuilder.CreateCylinder(`holo-base-${i}`, {
      diameter: 1.0, height: 0.04, tessellation: 24
    }, scene);
    base.position = new BABYLON.Vector3(x, 0.02, holoZ);
    const baseMat = new BABYLON.StandardMaterial(`holo-base-mat-${i}`, scene);
    baseMat.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.35);
    baseMat.emissiveColor = new BABYLON.Color3(0, 0.35, 0.7);
    base.material = baseMat;

    // 底座外环
    const ring = BABYLON.MeshBuilder.CreateTorus(`holo-ring-${i}`, {
      diameter: 1.1, thickness: 0.04, tessellation: 32
    }, scene);
    ring.position = new BABYLON.Vector3(x, 0.01, holoZ);
    const ringMat = new BABYLON.StandardMaterial(`holo-ring-mat-${i}`, scene);
    ringMat.emissiveColor = new BABYLON.Color3(0, 0.6, 1.0);
    ring.material = ringMat;

    holoScreens.push({ screen: hs, base, ring });
    hallMeshes.push(hs, base, ring);
  }

  // 全息屏浮动动画
  scene.onBeforeRenderObservable.add(() => {
    const t = Date.now() * 0.001;
    holoScreens.forEach((h, i) => {
      h.screen.position.y = holoCfg.baseY + Math.sin(t + i * 2) * 0.04;
      h.ring.rotation.y += 0.003;
    });
  });

  // ═══════════════════════════════════════
  // 5. 定义展区 zones
  // ═══════════════════════════════════════
  zones.set('poster-zone', {
    id: 'poster-zone', label: '安全知识展板',
    center: new BABYLON.Vector3(centerX, 0, northWallZ - 2),
    size: { width: roomW, depth: 4 },
    boards,
    entry: new BABYLON.Vector3(centerX, 1.7, northWallZ - 4),
  });
  zones.set('video-zone', {
    id: 'video-zone', label: '评估成果视频',
    center: new BABYLON.Vector3(eastWallX - 2, 0, centerZ),
    size: { width: 4, depth: roomD },
    screens: [screen, subScreen],
    entry: new BABYLON.Vector3(eastWallX - 4, 1.7, centerZ),
  });
  zones.set('doc-zone', {
    id: 'doc-zone', label: '文档资料库',
    center: new BABYLON.Vector3(centerX, 0, holoZ),
    size: { width: 10, depth: 4 },
    holoScreens: holoScreens.map(h => h.screen),
    entry: new BABYLON.Vector3(centerX, 1.7, holoZ - 2),
  });
  zones.set('entrance', {
    id: 'entrance', label: '入口',
    center: new BABYLON.Vector3(centerX, 0, bounds.minZ + 2),
    size: { width: 6, depth: 4 },
    entry: new BABYLON.Vector3(centerX, 1.7, bounds.minZ + 2),
  });

  // ═══════════════════════════════════════
  // 6. 冻结静态 mesh（GLB mesh 不冻结，保留碰撞检测能力）
  // ═══════════════════════════════════════
  // 只冻结展品 mesh，不冻结 GLB 房间 mesh（冻结会导致碰撞失效）
  boards.forEach(b => { b.freezeWorldMatrix(); b.isPickable = true; });
  screen.freezeWorldMatrix(); screen.isPickable = true;
  subScreen.freezeWorldMatrix(); subScreen.isPickable = true;
  holoScreens.forEach(h => {
    h.screen.freezeWorldMatrix(); h.screen.isPickable = true;
    h.base.freezeWorldMatrix(); h.ring.freezeWorldMatrix();
  });

  // ── 计算地板 Y 坐标 ──
  // 尝试使用 Y=0 作为地板高度（模型可能以地面为原点）
  const floorY = 0;
  const eyeHeight = 1.6;
  console.log(`[展厅] 地板 Y 坐标: ${floorY} (尝试 Y=0)`);
  console.log(`[展厅] 相机起始 Y: ${floorY + eyeHeight}`);
  console.log(`[展厅] bounds Y 范围: ${bounds.minY.toFixed(2)} ~ ${bounds.maxY.toFixed(2)}`);

  console.log('[展厅] 展区创建完成');

  return { zones, hallMeshes, bounds, floorY };
}

/**
 * 计算 mesh 列表的世界包围盒
 */
function computeSceneBounds(meshes) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const mesh of meshes) {
    const bb = mesh.getBoundingInfo().boundingBox;
    const min = bb.minimumWorld;
    const max = bb.maximumWorld;
    if (min.x < minX) minX = min.x;
    if (min.y < minY) minY = min.y;
    if (min.z < minZ) minZ = min.z;
    if (max.x > maxX) maxX = max.x;
    if (max.y > maxY) maxY = max.y;
    if (max.z > maxZ) maxZ = max.z;
  }

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

/**
 * 创建调试坐标轴和边界框可视化
 */
function createDebugAxes(scene, roomMeshes) {
  const bounds = computeSceneBounds(roomMeshes);
  const centerX = (bounds.maxX + bounds.minX) / 2;
  const centerZ = (bounds.maxZ + bounds.minZ) / 2;
  const size = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxZ - bounds.minZ
  ) * 0.6;

  // X 轴（红色）- 东/西方向
  const xAxis = BABYLON.MeshBuilder.CreateBox('debug-x', { width: size, height: 0.05, depth: 0.05 }, scene);
  xAxis.position = new BABYLON.Vector3(centerX, 0.05, centerZ);
  const xMat = new BABYLON.StandardMaterial('debug-x-mat', scene);
  xMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  xMat.disableLighting = true;
  xAxis.material = xMat;
  xAxis.isPickable = false;

  // Z 轴（蓝色）- 南/北方向
  const zAxis = BABYLON.MeshBuilder.CreateBox('debug-z', { width: 0.05, height: 0.05, depth: size }, scene);
  zAxis.position = new BABYLON.Vector3(centerX, 0.05, centerZ);
  const zMat = new BABYLON.StandardMaterial('debug-z-mat', scene);
  zMat.emissiveColor = new BABYLON.Color3(0, 0, 1);
  zMat.disableLighting = true;
  zAxis.material = zMat;
  zAxis.isPickable = false;

  // 边界框（绿色线框）
  const boxW = bounds.maxX - bounds.minX;
  const boxD = bounds.maxZ - bounds.minZ;
  const box = BABYLON.MeshBuilder.CreateBox('debug-box', { width: boxW, height: 0.02, depth: boxD }, scene);
  box.position = new BABYLON.Vector3(centerX, 0.01, centerZ);
  const boxMat = new BABYLON.StandardMaterial('debug-box-mat', scene);
  boxMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
  boxMat.wireframe = true;
  boxMat.disableLighting = true;
  box.material = boxMat;
  box.isPickable = false;

  // 方向标记（4个角的标签位置）
  const markerPositions = [
    { pos: [bounds.maxX, 1, centerZ], label: 'X+ (东)', color: [1, 0.5, 0] },
    { pos: [bounds.minX, 1, centerZ], label: 'X- (西)', color: [1, 0.5, 0] },
    { pos: [centerX, 1, bounds.maxZ], label: 'Z+ (北)', color: [0, 0.5, 1] },
    { pos: [centerX, 1, bounds.minZ], label: 'Z- (南)', color: [0, 0.5, 1] },
  ];

  markerPositions.forEach(({ pos, label, color }, i) => {
    const marker = BABYLON.MeshBuilder.CreateSphere(`debug-marker-${i}`, { diameter: 0.3 }, scene);
    marker.position = new BABYLON.Vector3(...pos);
    const mat = new BABYLON.StandardMaterial(`debug-marker-mat-${i}`, scene);
    mat.emissiveColor = new BABYLON.Color3(...color);
    mat.disableLighting = true;
    marker.material = mat;
    marker.isPickable = false;
  });

  // 控制台输出方向说明
  console.log('\n════════════════════════════════════════');
  console.log('[调试] 展厅方向坐标系:');
  console.log(`  X+ (东墙): ${bounds.maxX.toFixed(1)}`);
  console.log(`  X- (西墙): ${bounds.minX.toFixed(1)}`);
  console.log(`  Z+ (北墙): ${bounds.maxZ.toFixed(1)}`);
  console.log(`  Z- (南墙/入口): ${bounds.minZ.toFixed(1)}`);
  console.log(`  房间中心: (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
  console.log('────────────────────────────────────────');
  console.log('[调试] 请观察:');
  console.log('  红色线 = X轴 (东/西)');
  console.log('  蓝色线 = Z轴 (南/北)');
  console.log('  绿色框 = 房间边界');
  console.log('  橙色球 = 东/西标记');
  console.log('  蓝色球 = 南/北标记');
  console.log('════════════════════════════════════════\n');
}

