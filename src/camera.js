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
  const floorY = hallInfo.floorY || 0;  // 从 hall.js 获取检测到的地板 Y
  const eyeHeight = 1.6;  // 眼睛离地高度

  let startPos;
  if (bounds) {
    const centerX = (bounds.maxX + bounds.minX) / 2;
    const startZ = bounds.minZ + 3;  // 靠近入口（南墙）
    startPos = new BABYLON.Vector3(centerX, floorY + eyeHeight, startZ);
    console.log(`[相机] 起始位置: Y=${startPos.y.toFixed(2)} (地板Y=${floorY.toFixed(2)} + 眼高${eyeHeight})`);
  } else {
    startPos = new BABYLON.Vector3(0, eyeHeight, -6);
  }

  const camera = new BABYLON.UniversalCamera('fps-cam', startPos, scene);

  // ── 视角参数 ──
  camera.fov = 1.0;          // ~57° 视场角，减少边缘拉伸变形
  camera.minZ = 0.1;
  camera.maxZ = 200;

  // 初始朝向：面向房间内部（北方向）
  if (bounds) {
    const centerX = (bounds.maxX + bounds.minX) / 2;
    camera.setTarget(new BABYLON.Vector3(centerX, startPos.y, startPos.z + 10));
  } else {
    camera.setTarget(new BABYLON.Vector3(startPos.x, startPos.y, startPos.z + 5));
  }

  // ── 碰撞检测 ──
  camera.checkCollisions = true;
  camera.applyGravity = false;
  camera.ellipsoid = new BABYLON.Vector3(0.5, 0.8, 0.5);
  camera.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);

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

  // ── 锁定水平视角 ──
  scene.onBeforeRenderObservable.add(() => {
    camera.rotation.x = 0;
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
