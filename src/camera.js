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
  const centerX = 2.98;   // 用户定位的初始位置
  const startZ = -0.05;   // 用户定位的初始位置
  const startYaw = 90.2;  // 用户定位的初始朝向（度）

  let startPos = new BABYLON.Vector3(centerX, floorY + eyeHeight, startZ);
  console.log(`[相机] 起始位置: (${startPos.x.toFixed(2)}, ${startPos.y.toFixed(2)}, ${startPos.z.toFixed(2)})`);
  console.log(`[相机] 地板Y=${floorY}, 眼高=${eyeHeight}, 朝向=${startYaw}°`);

  const camera = new BABYLON.UniversalCamera('fps-cam', startPos, scene);

  // ── 视角参数 ──
  camera.fov = 1.0;          // ~57° 视场角，减少边缘拉伸变形
  camera.minZ = 0.1;
  camera.maxZ = 200;

  // 初始朝向：用户定位的 -92°
  camera.rotation.y = startYaw * Math.PI / 180;

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

  // ── 锁定高度 + 射线检测墙体/前台碰撞 ──
  const lockedY = floorY + eyeHeight;
  const CHECK_DIST = 0.6;  // 前方检测距离
  const lastValidPos = startPos.clone();

  // 碰撞过滤器：检测所有可碰撞的静态物体（墙 + 前台）
  const collisionFilter = (mesh) => {
    return mesh.checkCollisions && mesh.isPickable === false;
  };

  scene.onBeforeRenderObservable.add(() => {
    // 锁定高度
    camera.position.y = lockedY;

    // 多方向射线检测（前/后/左/右），防止穿过任何物体
    const dir = new BABYLON.Vector3();
    camera.getDirectionToRef(BABYLON.Vector3.Forward(), dir);
    dir.y = 0; dir.normalize();

    const rightDir = new BABYLON.Vector3();
    camera.getDirectionToRef(BABYLON.Vector3.Right(), rightDir);
    rightDir.y = 0; rightDir.normalize();

    let collided = false;
    const origin = camera.position.clone();

    // 检测4个方向
    for (const d of [dir, dir.scale(-1), rightDir, rightDir.scale(-1)]) {
      const ray = new BABYLON.Ray(origin, d, CHECK_DIST);
      const hit = scene.pickWithRay(ray, collisionFilter);
      if (hit.hit) {
        collided = true;
        break;
      }
    }

    if (collided) {
      camera.position.x = lastValidPos.x;
      camera.position.z = lastValidPos.z;
    } else {
      lastValidPos.x = camera.position.x;
      lastValidPos.z = camera.position.z;
    }
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

  // ── P 键输出当前位置和朝向（用于定位初始视角）──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      const pos = camera.position;
      const rot = camera.rotation;
      // 计算朝向向量
      const dir = camera.getForwardRay().direction;
      console.log(`%c[位置] X=${pos.x.toFixed(2)} Y=${pos.y.toFixed(2)} Z=${pos.z.toFixed(2)} | [旋转] X=${(rot.x*180/Math.PI).toFixed(1)}° Y=${(rot.y*180/Math.PI).toFixed(1)}° Z=${(rot.z*180/Math.PI).toFixed(1)}° | [朝向] dx=${dir.x.toFixed(2)} dy=${dir.y.toFixed(2)} dz=${dir.z.toFixed(2)}`, 'color:#00ff88;font-size:14px;font-weight:bold');
    }
  });

  // ── M 键标记展品位置（在视线前方墙面/柱子处放置标记球）──
  const markers = [];
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      // 从相机发射射线，检测前方物体
      const ray = scene.createPickingRay(
        scene.getEngine().getRenderWidth() / 2,
        scene.getEngine().getRenderHeight() / 2,
        BABYLON.Matrix.Identity(),
        camera
      );
      const hit = scene.pickWithRay(ray);
      if (hit.hit && hit.pickedPoint) {
        const p = hit.pickedPoint;
        const idx = markers.length + 1;
        // 放置标记球
        const marker = BABYLON.MeshBuilder.CreateSphere(`exhibit-marker-${idx}`, { diameter: 0.2 }, scene);
        marker.position = p.clone();
        const m = new BABYLON.StandardMaterial(`marker-mat-${idx}`, scene);
        m.emissiveColor = new BABYLON.Color3(0, 1, 0);  // 绿色
        m.disableLighting = true;
        marker.material = m;
        marker.isPickable = false;
        markers.push(marker);

        // 计算朝向（从标记点看向相机）
        const dx = camera.position.x - p.x;
        const dz = camera.position.z - p.z;
        const yaw = Math.atan2(dx, dz) * 180 / Math.PI;

        console.log(`%c[标记 #${idx}] X=${p.x.toFixed(2)} Y=${p.y.toFixed(2)} Z=${p.z.toFixed(2)} 朝向=${yaw.toFixed(1)}° (前方墙面/柱子)`, 'color:#00ff00;font-size:14px;font-weight:bold');
      } else {
        console.log('%c[标记] 前方没有检测到墙面，请对准墙面或柱子后按 M', 'color:#ff8800;font-weight:bold');
      }
    }

    // C 键清除所有标记
    if (e.key === 'c' || e.key === 'C') {
      markers.forEach(m => m.dispose());
      markers.length = 0;
      console.log('%c[标记] 已清除所有标记', 'color:#ff8800;font-weight:bold');
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
