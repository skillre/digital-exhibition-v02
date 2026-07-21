// src/camera.js — 第一人称自由漫游相机
// WASD 移动 + 鼠标转向 + Pointer Lock + 碰撞检测 + 重力 + 传送

/**
 * 设置第一人称相机
 * @param {BABYLON.Scene} scene
 * @param {HTMLCanvasElement} canvas
 * @param {Object} hallInfo - 来自 hall.js 的 { zones, hallMeshes }
 * @returns {{ camera, teleportTo, lock, unlock, isLocked }}
 */
export function setupCamera(scene, canvas, hallInfo) {
  // ── UniversalCamera（FPS 风格）──
  const startPos = new BABYLON.Vector3(0, 1.4, -6);

  const camera = new BABYLON.UniversalCamera('fps-cam', startPos, scene);

  // ── 视角参数（关键！）──
  camera.fov = 1.3;          // 75° 视场角（典型 FPS 视角，默认 0.8≈45°太窄）
  camera.minZ = 0.1;         // 近裁剪面（默认 1 会导致近距离物体消失）
  camera.maxZ = 200;         // 远裁剪面

  // 初始朝向：面向北方（海报区方向）
  camera.setTarget(new BABYLON.Vector3(startPos.x, 1.4, startPos.z + 5));

  // ── 碰撞检测 ──
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new BABYLON.Vector3(0.5, 0.7, 0.5);
  camera.ellipsoidOffset = new BABYLON.Vector3(0, -0.7, 0);

  // ── 移动参数 ──
  camera.speed = 0.45;              // 移动速度
  camera.inertia = 0.7;             // 惯性（停止后滑行）
  camera.angularSensibility = 2800; // 鼠标灵敏度（越小越快）

  // WASD 键位映射
  camera.keysUp = [87];     // W - 前进
  camera.keysDown = [83];   // S - 后退
  camera.keysLeft = [65];   // A - 左移
  camera.keysRight = [68];  // D - 右移

  // 额外键位
  camera.keysUpward = [32];     // Space - 上浮（调试用）
  camera.keysDownward = [16];   // Shift - 下沉（调试用）

  // ── 视角限制（防止头朝下/翻转）──
  camera.upperBetaLimit = Math.PI * 0.75;  // 向下看最大角度
  camera.lowerBetaLimit = Math.PI * 0.15;  // 向上看最大角度

  // 附加控制
  camera.attachControl(canvas, false); // false = 不自动捕获所有输入

  // ── Pointer Lock 系统 ──
  let isLocked = false;
  const pointerHint = document.getElementById('pointer-hint');

  // 点击 canvas 进入 Pointer Lock
  canvas.addEventListener('pointerdown', (evt) => {
    if (!isLocked && evt.button === 0) {
      canvas.requestPointerLock();
    }
  });

  // 监听 Pointer Lock 状态变化
  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    updatePointerHint();
  });

  function updatePointerHint() {
    if (!pointerHint) return;
    if (isLocked) {
      pointerHint.textContent = '按 ESC 退出自由视角';
      pointerHint.style.display = 'block';
    } else {
      pointerHint.textContent = '点击画面进入自由视角 · WASD 移动 · 鼠标转向';
      pointerHint.style.display = 'block';
    }
  }

  // 初始显示提示
  updatePointerHint();

  // ── 传送功能（展区跳转用）──
  function teleportTo(position) {
    // 短暂禁用碰撞避免卡墙
    camera.checkCollisions = false;
    camera.position = new BABYLON.Vector3(position.x, 1.4, position.z);

    // 延迟重新启用碰撞
    setTimeout(() => {
      camera.checkCollisions = true;
    }, 100);
  }

  // ── Pointer Lock 控制 ──
  function lock() {
    canvas.requestPointerLock();
  }

  function unlock() {
    if (isLocked) {
      document.exitPointerLock();
    }
  }

  // ── 键盘事件（ESC 关闭弹窗由 ui.js 处理）──
  // 防止 WASD 在输入框中触发
  document.addEventListener('keydown', (e) => {
    // 只在 Pointer Lock 状态下处理移动键
    if (!isLocked) return;
    // 不阻止其他模块的 ESC 处理
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
