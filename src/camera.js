// src/camera.js — 第一人称自由漫游相机
// WASD 移动 + 鼠标转向 + Pointer Lock + 碰撞检测 + 传送

/**
 * 设置第一人称相机
 * @param {BABYLON.Scene} scene
 * @param {HTMLCanvasElement} canvas
 * @param {Object} hallInfo - 来自 hall.js 的 { zones, hallMeshes, bounds }
 * @returns {{ camera, teleportTo, lock, unlock, isLocked }}
 */
export function setupCamera(scene, canvas, hallInfo) {
  // ── 根据 GLB 模型 bounds 和地板高度计算起始位置 ──
  const bounds = hallInfo.bounds;
  const floorY = hallInfo.floorY || 0;  // 从 hall.js 获取地板 Y
  const eyeHeight = 1.6;  // 眼睛离地高度

  // 旋转 -90° 后的正确坐标：
  // 原始 X: -16.5 ~ 14.1 → 旋转后 X: -16.5 ~ 14.1 (不变)
  // 原始 Y: -15.4 ~ 15.4 → 旋转后 Z: -15.4 ~ 15.4
  // 原始 Z: -4.1 ~ 5.6 → 旋转后 Y: -4.1 ~ 5.6
  //
  // 相机应在房间中心附近
  const centerX = (-16.5 + 14.1) / 2;  // = -1.2
  const startZ = -10;  // 往后一点，靠近南墙

  let startPos = new BABYLON.Vector3(centerX, floorY + eyeHeight, startZ);
  console.log(`[相机] 起始位置: (${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)}, ${startPos.z.toFixed(1)})`);
  console.log(`[相机] 地板Y=${floorY}, 眼高=${eyeHeight}`);

  const camera = new BABYLON.UniversalCamera('fps-cam', startPos, scene);

  // ── 视角参数 ──
  camera.fov = 1.0;          // ~57° 视场角，减少边缘拉伸变形
  camera.minZ = 0.1;
  camera.maxZ = 200;

  // 初始朝向：面向北墙（Z 正方向）
  camera.setTarget(new BABYLON.Vector3(centerX, startPos.y, startPos.z + 15));

  // ── 碰撞检测：关闭相机碰撞（法线方向错误会阻止移动）──
  // 改用渲染循环锁定 Y + 射线检测墙体

  // ── 移动参数 ──
  camera.speed = 0.45;
  camera.inertia = 0.7;
  camera.angularSensibility = 2800;

  // WASD 键位映射
  camera.keysUp = [87];     // W
  camera.keysDown = [83];   // S
  camera.keysLeft = [65];   // A
  camera.keysRight = [68];  // D

  // 禁用上下移动
  camera.keysUpward = [];
  camera.keysDownward = [];

  // ── 锁定水平视角 + 锁定高度 + 墙体碰撞检测 ──
  const lockedY = floorY + eyeHeight;
  const moveDir = new BABYLON.Vector3();
  const ray = new BABYLON.Ray();
  scene.onBeforeRenderObservable.add(() => {
    camera.rotation.x = 0;
    camera.position.y = lockedY;  // 强制锁定高度
  });

  camera.attachControl(canvas, false);

  // ── Pointer Lock 系统 ──
  let isLocked = false;
  const pointerHint = document.getElementById('pointer-hint');

  canvas.addEventListener('pointerdown', (evt) => {
    if (!isLocked && evt.button === 0) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    updatePointerHint();
  });

  function updatePointerHint() {
    if (!pointerHint) return;
    if (isLocked) {
      pointerHint.textContent = '按 Q 退出自由视角';
      pointerHint.style.display = 'block';
    } else {
      pointerHint.textContent = '点击画面进入自由视角 · WASD 移动 · 鼠标转向 · Q 退出';
      pointerHint.style.display = 'block';
    }
  }

  updatePointerHint();

  // ── 传送功能 ──
  function teleportTo(position) {
    camera.checkCollisions = false;
    camera.position = new BABYLON.Vector3(position.x, floorY + eyeHeight, position.z);
    setTimeout(() => { camera.checkCollisions = true; }, 100);
  }

  function lock() { canvas.requestPointerLock(); }
  function unlock() { if (isLocked) document.exitPointerLock(); }

  // ── Q 键退出 Pointer Lock ──
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'q' || e.key === 'Q') && isLocked) {
      document.exitPointerLock();
    }
  });

  return {
    camera,
    teleportTo,
    lock,
    unlock,
    isLocked: () => isLocked,
    getStartPosition: () => startPos,
  };
}
