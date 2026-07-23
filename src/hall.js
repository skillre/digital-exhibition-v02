// src/hall.js — 加载 GLB 房间模型 + 创建展品挂载点
// 用下载的 VR-Art-Gallery-Lobby-Baked.glb 替代程序化建模

import {
  createMetalMaterial,
} from './utils.js';

const MODEL_PATH = 'assets/models/';
const MODEL_FILE = 'VR-Art-Gallery-Lobby-Baked.glb';

// ── 展品位置（在浏览器中用 M 键标记后，归一化填入这里）──
// 每个展品: { type, itemId, x, y, z, yaw(度), width, height }
//   yaw: 板子面朝方向(度) = M键输出的“朝向”；板法线指向该方向
//   width/height: 板子尺寸(米)；按图片比例设，避免拉伸变形
//   itemId: 对应 contents.json 里 items[].id，exhibits.js 据此贴图
//
// poster-002 横图(1.78比例)：4点归一化后墙 X=8.47，矩形1.81×1.59，
// 按宽度1.81保持比例 → 1.81×1.02 居中(上下留~0.29m白边)
//
// poster-001 竖图(0.55比例, 2880×5210)：东墙 X≈8.47 北侧开口 ~1.92×1.59
//   按高度1.59保持比例 → 0.88×1.59，左右留约0.52m白边
//
// video-001/video-002：北/南斜墙开口 ~3.00×1.11，视频均为 16:9(1.78)
//   按高度1.10保持比例 → 1.96×1.10，左右留约0.52m边框
const EXHIBIT_SPOTS = [
  {
    type: 'poster',
    itemId: 'poster-002',
    x: 8.44, y: 1.475, z: 5.385,
    yaw: -90,          // 面朝 -X（室内/相机方向）
    width: 1.81,
    height: 1.02,      // =1.81/1.78，保持横图比例不变形
  },
  {
    type: 'poster',
    itemId: 'poster-001',
    x: 8.47, y: 1.56, z: -5.08,
    yaw: -90,          // 面朝 -X（室内/相机方向）
    width: 0.88,       // =1.59*0.553，按高度适配竖图比例不变形
    height: 1.59,
  },
  {
    type: 'video',
    itemId: 'video-001',
    x: -0.06, y: 1.56, z: 8.18,
    yaw: 128,          // 北斜墙，面朝西南偏南（室内）
    width: 1.96,       // =1.10*1.78，按高度适配16:9不变形
    height: 1.10,
  },
  {
    type: 'video',
    itemId: 'video-002',
    x: -0.06, y: 1.48, z: -8.19,
    yaw: 47,           // 南斜墙，面朝东北偏北（室内）
    width: 1.96,
    height: 1.10,
  },
];

// ── 模型方向调整（弧度）──
// 如果模型朝向不对，修改这里的旋转值
// 0 = 不旋转, Math.PI/2 = 90°, Math.PI = 180°, -Math.PI/2 = -90°
// X轴顺时针旋转 -90°（修正上下颠倒）
const MODEL_ROTATION_X = -Math.PI / 2;  // -90° 顺时针旋转
const MODEL_ROTATION_Y = 0;
const MODEL_ROTATION_Z = 0;

// ── 调试模式：显示坐标轴和边界框 ──
const DEBUG_AXES = true;



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

    // GLB 法线错误会导致椭球碰撞卡顿 → 关闭GLB碰撞，改用不可见代理盒
    mesh.checkCollisions = false;
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
  // 4. 展品位置将在后续由用户标记后添加
  // ═══════════════════════════════════════
  // 旧的程序化展品（海报板/视频屏/全息屏）已清除
  // 展品位置将由用户在模型内标记后配置

  // ── 计算地板 Y 坐标 ──
  const floorY = 0;
  const eyeHeight = 1.6;
  console.log(`[展厅] 地板 Y 坐标: ${floorY}`);

  // ═══════════════════════════════════════
  // 5. 定义展区 zones（基础占位）
  // ═══════════════════════════════════════
  zones.set('entrance', {
    id: 'entrance', label: '入口',
    center: new BABYLON.Vector3(centerX, 0, bounds.minZ + 2),
    size: { width: 6, depth: 4 },
    entry: new BABYLON.Vector3(centerX, 1.7, bounds.minZ + 2),
  });

  // ═══════════════════════════════════════
  // 7. 加载前台模型
  // ═══════════════════════════════════════
  await loadReceptionDesk(scene, hallMeshes);

  // ── 创建不可见墙体碰撞代理盒（配合椭球碰撞，挡住边界）──
  createWallColliders(scene, bounds, hallMeshes);

  // ── 按 EXHIBIT_SPOTS 创建展品板并注册到 zones ──
  createExhibitSpots(scene, hallMeshes, zones);

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
 * 创建不可见墙体碰撞代理盒（4面墙，法线正确的BOX，配合椭球碰撞）
 * GLB墙体法线错误会让椭球卡顿，故用规则BOX代理。
 */
function createWallColliders(scene, bounds, hallMeshes) {
  const wallH = Math.max(2.0, bounds.maxY);        // 墙高: 至少2m 或到天花板
  const thin = 0.5;                                 // 墙厚
  const roomW = bounds.maxX - bounds.minX;
  const roomD = bounds.maxZ - bounds.minZ;
  const cx = (bounds.maxX + bounds.minX) / 2;
  const cz = (bounds.maxZ + bounds.minZ) / 2;

  const defs = [
    { name: 'collider-wall-south', w: roomW + thin, d: thin,        x: cx,          z: bounds.minZ },
    { name: 'collider-wall-north', w: roomW + thin, d: thin,        x: cx,          z: bounds.maxZ },
    { name: 'collider-wall-east',  w: thin,         d: roomD + thin, x: bounds.maxX, z: cz },
    { name: 'collider-wall-west',  w: thin,         d: roomD + thin, x: bounds.minX, z: cz },
  ];

  for (const d of defs) {
    const wall = BABYLON.MeshBuilder.CreateBox(d.name, {
      width: d.w, height: wallH, depth: d.d,
    }, scene);
    wall.position = new BABYLON.Vector3(d.x, wallH / 2, d.z);
    wall.checkCollisions = true;
    wall.isPickable = false;
    wall.isVisible = false;       // 不可见，仅碰撞
    hallMeshes.push(wall);
  }
  console.log(`[碰撞] 墙体代理盒×4 已创建 (墙高${wallH.toFixed(1)}m, 房间${roomW.toFixed(1)}×${roomD.toFixed(1)})`);
}

/**
 * 按 EXHIBIT_SPOTS 创建展品板（海报/视频屏/文档屏），注册到对应 zone
 * 板子通过 metadata.itemId 与 contents.json 里的 item.id 关联（不依赖顺序，支持稀疏放置）
 */
function createExhibitSpots(scene, hallMeshes, zones) {
  const posterBoards = [];
  const videoScreens = [];
  const docScreens = [];

  for (const spot of EXHIBIT_SPOTS) {
    const board = BABYLON.MeshBuilder.CreatePlane(
      `${spot.type}-board-${spot.itemId}`,
      { width: spot.width, height: spot.height, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
      scene
    );
    board.position = new BABYLON.Vector3(spot.x, spot.y, spot.z);
    board.rotation.y = spot.yaw * Math.PI / 180;
    board.isPickable = false;          // exhibits.js 贴图后会设 true
    board.metadata = { itemId: spot.itemId };
    hallMeshes.push(board);

    if (spot.type === 'poster') posterBoards.push(board);
    else if (spot.type === 'video') videoScreens.push(board);
    else if (spot.type === 'document') docScreens.push(board);

    console.log(`[展品] ${spot.type}板 ${spot.itemId} @ (${spot.x},${spot.y},${spot.z}) ${spot.width}×${spot.height} 朝向${spot.yaw}°`);
  }

  // ── 注册 zone 并补 entry/label/center 让导航菜单可用 ──
  // 视点位置 = 板子前方 1.6m（沿板法线方向，板法线已指向室内/相机侧）
  // 即 viewer = boardPos + (sin(yaw), 0, cos(yaw)) * VIEW_DIST
  const EYE_Y = 1.7;
  const VIEW_DIST = 1.6;

  if (posterBoards.length) {
    // 海报全部在东墙 X≈8.47，取最靠南的板前方作为该 zone 视点
    const main = posterBoards.reduce((a, b) => (b.position.z > a.position.z ? b : a));
    const yawRad = main.rotation.y;
    const entry = new BABYLON.Vector3(
      main.position.x + Math.sin(yawRad) * VIEW_DIST,
      EYE_Y,
      main.position.z + Math.cos(yawRad) * VIEW_DIST
    );
    zones.set('poster-zone', {
      id: 'poster-zone', label: '安全知识展板',
      boards: posterBoards,
      center: new BABYLON.Vector3(main.position.x, 0, main.position.z),
      entry,
    });
    console.log(`[展区] poster-zone 视点: (${entry.x.toFixed(2)}, ${entry.z.toFixed(2)})`);
  }
  if (videoScreens.length) {
    const main = videoScreens[0];
    const yawRad = main.rotation.y;
    const entry = new BABYLON.Vector3(
      main.position.x + Math.sin(yawRad) * VIEW_DIST,
      EYE_Y,
      main.position.z + Math.cos(yawRad) * VIEW_DIST
    );
    zones.set('video-zone', {
      id: 'video-zone', label: '评估成果视频',
      screens: videoScreens,
      center: new BABYLON.Vector3(main.position.x, 0, main.position.z),
      entry,
    });
    console.log(`[展区] video-zone 视点: (${entry.x.toFixed(2)}, ${entry.z.toFixed(2)})`);
  }
  if (docScreens.length) {
    const main = docScreens[0];
    const yawRad = main.rotation.y;
    const entry = new BABYLON.Vector3(
      main.position.x + Math.sin(yawRad) * VIEW_DIST,
      EYE_Y,
      main.position.z + Math.cos(yawRad) * VIEW_DIST
    );
    zones.set('doc-zone', {
      id: 'doc-zone', label: '文档资料库',
      holoScreens: docScreens,
      center: new BABYLON.Vector3(main.position.x, 0, main.position.z),
      entry,
    });
    console.log(`[展区] doc-zone 视点: (${entry.x.toFixed(2)}, ${entry.z.toFixed(2)})`);
  }
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

/**
 * 加载前台模型
 */
async function loadReceptionDesk(scene, hallMeshes) {
  const DESK_FILE = 'reception-desk.glb';
  // 用户定位的位置和朝向
  const DESK_X = 5.88;
  const DESK_Y = 0;      // 地板高度
  const DESK_Z = -0.04;
  const DESK_YAW = 270.2;  // 朝向（度）

  console.log('[前台] 开始加载前台模型...');
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      '', 'assets/models/', DESK_FILE, scene
    );
    console.log(`[前台] 加载成功, mesh 数量: ${result.meshes.length}`);

    // 创建父节点用于定位
    const deskRoot = new BABYLON.TransformNode('desk-root', scene);
    deskRoot.position = new BABYLON.Vector3(DESK_X, DESK_Y, DESK_Z);
    deskRoot.rotation.y = DESK_YAW * Math.PI / 180;

    const deskMeshes = [];
    for (const mesh of result.meshes) {
      if (mesh.name === '__root__') continue;
      mesh.parent = deskRoot;
      mesh.checkCollisions = false;   // GLB关闭碰撞，用全身代理盒
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      deskMeshes.push(mesh);
      hallMeshes.push(mesh);
    }

    // 强制更新世界矩阵
    deskRoot.computeWorldMatrix(true);
    deskMeshes.forEach(m => m.computeWorldMatrix(true));

    // 检测前台模型尺寸并自动缩放
    const deskBounds = computeSceneBounds(deskMeshes);
    const deskW = deskBounds.maxX - deskBounds.minX;
    const deskH = deskBounds.maxY - deskBounds.minY;
    const deskD = deskBounds.maxZ - deskBounds.minZ;
    const deskMaxDim = Math.max(deskW, deskH, deskD);
    console.log(`[前台] 原始尺寸: W=${deskW.toFixed(3)} H=${deskH.toFixed(3)} D=${deskD.toFixed(3)}`);

    // 前台目标尺寸约 2m 宽
    const TARGET_DESK_SIZE = 2.0;
    if (deskMaxDim > 0) {
      const deskScale = TARGET_DESK_SIZE / deskMaxDim;
      // 使用用户调试后的缩放值
      const USER_SCALE = 0.0061;
      console.log(`[前台] 使用用户缩放: ${USER_SCALE}x`);
      deskRoot.scaling = new BABYLON.Vector3(USER_SCALE, USER_SCALE, USER_SCALE);
      deskRoot.computeWorldMatrix(true);
      deskMeshes.forEach(m => m.computeWorldMatrix(true));
    }

    // ── 覆盖前台材质颜色 + 添加纹理 ──
    // #dcdad7 = RGB(0.863, 0.855, 0.843)
    const DESK_COLOR = new BABYLON.Color3(0.863, 0.855, 0.843);
    const deskMat = new BABYLON.PBRMaterial('desk-mat', scene);
    deskMat.albedoColor = DESK_COLOR;
    deskMat.metallic = 0.2;
    deskMat.roughness = 0.7;
    deskMat.environmentIntensity = 0.5;

    // 添加程序化纹理（细微凹凸 + 划痕）
    const deskTex = new BABYLON.DynamicTexture('desk-tex', 512, scene, false);
    const texCtx = deskTex.getContext();
    // 基础色
    texCtx.fillStyle = '#dcdad7';
    texCtx.fillRect(0, 0, 512, 512);
    // 细密颗粒纹理
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512, y = Math.random() * 512;
      const v = Math.random() * 20 - 10;
      texCtx.fillStyle = `rgba(${220+v}, ${218+v}, ${215+v}, ${Math.random()*0.15})`;
      texCtx.fillRect(x, y, 1, 1);
    }
    // 水平划痕
    for (let i = 0; i < 200; i++) {
      const y = Math.random() * 512;
      const x = Math.random() * 256;
      const len = 20 + Math.random() * 80;
      texCtx.strokeStyle = `rgba(180, 178, 175, ${Math.random()*0.1})`;
      texCtx.lineWidth = 0.5;
      texCtx.beginPath(); texCtx.moveTo(x, y); texCtx.lineTo(x + len, y + (Math.random()-0.5)*2); texCtx.stroke();
    }
    // 大理石纹路
    for (let i = 0; i < 15; i++) {
      texCtx.strokeStyle = `rgba(200, 198, 195, ${Math.random()*0.2})`;
      texCtx.lineWidth = 1 + Math.random() * 2;
      texCtx.beginPath();
      const sx = Math.random() * 512, sy = Math.random() * 512;
      texCtx.moveTo(sx, sy);
      for (let j = 0; j < 5; j++) {
        texCtx.lineTo(sx + (Math.random()-0.5)*200, sy + (Math.random()-0.5)*200);
      }
      texCtx.stroke();
    }
    deskTex.update();
    deskMat.albedoTexture = deskTex;

    // 添加法线贴图用于凹凸感
    const normalTex = new BABYLON.DynamicTexture('desk-normal', 512, scene, false);
    const normCtx = normalTex.getContext();
    const normData = normCtx.createImageData(512, 512);
    for (let i = 0; i < normData.data.length; i += 4) {
      const v = 128 + (Math.random()-0.5) * 20;
      normData.data[i] = v;     // R
      normData.data[i+1] = v;   // G
      normData.data[i+2] = 255; // B
      normData.data[i+3] = 255; // A
    }
    normCtx.putImageData(normData, 0, 0);
    normalTex.update();
    deskMat.bumpTexture = normalTex;
    deskMat.bumpTexture.level = 0.3;

    deskMeshes.forEach(m => { m.material = deskMat; });
    console.log(`[前台] 材质颜色: #dcdad7 + 纹理(颗粒/划痕/大理石纹)`, 'color:#dcdad7');

    // ── 前台全身高碰撞代理盒（地板→1.8m，挡住椭球顶部1.7m）──
    // 不挂到 deskRoot（会被0.0061缩放），用世界坐标直接定位
    // 关键: 高度1.8m > 椭球顶1.7m，确保椭球无法从前台顶部翻过
    const db = computeSceneBounds(deskMeshes);  // 缩放后的世界bounds
    const PAD = 0.15;
    const deskCollider = BABYLON.MeshBuilder.CreateBox('desk-collider', {
      width: (db.maxX - db.minX) + PAD * 2,
      height: 1.8,                      // 地板到1.8m
      depth: (db.maxZ - db.minZ) + PAD * 2,
    }, scene);
    deskCollider.position = new BABYLON.Vector3(
      (db.maxX + db.minX) / 2,
      0.9,                              // 1.8 / 2
      (db.maxZ + db.minZ) / 2
    );
    deskCollider.checkCollisions = true;
    deskCollider.isPickable = false;
    deskCollider.isVisible = false;     // 不可见，仅碰撞
    hallMeshes.push(deskCollider);
    console.log(`[前台] 全身碰撞盒 ${(db.maxX-db.minX).toFixed(2)}x${(db.maxZ-db.minZ).toFixed(2)} 高1.8m @ (${deskCollider.position.x.toFixed(2)}, ${deskCollider.position.z.toFixed(2)})`);

    // 调试：在前台位置添加标记球
    const marker = BABYLON.MeshBuilder.CreateSphere('desk-marker', { diameter: 0.3 }, scene);
    marker.position = new BABYLON.Vector3(DESK_X, DESK_Y + 1, DESK_Z);
    const markerMat = new BABYLON.StandardMaterial('desk-marker-mat', scene);
    markerMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    markerMat.disableLighting = true;
    marker.material = markerMat;
    marker.isPickable = false;

    console.log(`[前台] 位置: (${DESK_X}, ${DESK_Y}, ${DESK_Z}), 朝向: ${DESK_YAW}°`);
    console.log(`[前台] 调试控制: [+/-] 缩放 | [↑↓←→] 移动 | [1/3] 左右旋转 | [P] 输出当前数值`);

    // ── 前台调试控制 ──
    document.addEventListener('keydown', (e) => {
      if (e.key === '+' || e.key === '=') {
        deskRoot.scaling.scaleInPlace(1.1);
        console.log(`[前台] 缩放: ${deskRoot.scaling.x.toFixed(4)}x`);
      }
      if (e.key === '-' || e.key === '_') {
        deskRoot.scaling.scaleInPlace(0.9);
        console.log(`[前台] 缩放: ${deskRoot.scaling.x.toFixed(4)}x`);
      }
      if (e.key === 'ArrowUp') { deskRoot.position.z += 0.2; marker.position.z += 0.2; console.log(`[前台] Z=${deskRoot.position.z.toFixed(2)}`); e.preventDefault(); }
      if (e.key === 'ArrowDown') { deskRoot.position.z -= 0.2; marker.position.z -= 0.2; console.log(`[前台] Z=${deskRoot.position.z.toFixed(2)}`); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { deskRoot.position.x -= 0.2; marker.position.x -= 0.2; console.log(`[前台] X=${deskRoot.position.x.toFixed(2)}`); e.preventDefault(); }
      if (e.key === 'ArrowRight') { deskRoot.position.x += 0.2; marker.position.x += 0.2; console.log(`[前台] X=${deskRoot.position.x.toFixed(2)}`); e.preventDefault(); }
      if (e.key === '1') { deskRoot.rotation.y -= 0.1; console.log(`[前台] 朝向: ${(deskRoot.rotation.y * 180 / Math.PI).toFixed(1)}°`); }
      if (e.key === '3') { deskRoot.rotation.y += 0.1; console.log(`[前台] 朝向: ${(deskRoot.rotation.y * 180 / Math.PI).toFixed(1)}°`); }
      if (e.key === '0') {
        console.log(`%c[前台最终数值] X=${deskRoot.position.x.toFixed(2)} Y=${deskRoot.position.y.toFixed(2)} Z=${deskRoot.position.z.toFixed(2)} 朝向=${(deskRoot.rotation.y * 180 / Math.PI).toFixed(1)}° 缩放=${deskRoot.scaling.x.toFixed(4)}`, 'color:#00ff88;font-size:14px;font-weight:bold');
      }
    });
  } catch (err) {
    console.error('[前台] 加载失败:', err);
  }
}

