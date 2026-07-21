// src/utils.js — 共享工具函数 + PBR 物理材质系统（亮色调版）

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function lerp(a, b, t) { return a + (b - a) * t; }

export function createLoadingTracker() {
  const bar = document.getElementById('loading-progress');
  const text = document.getElementById('loading-text');
  let progress = 0;
  return {
    setProgress(pct, msg) {
      progress = Math.min(100, Math.max(0, pct));
      if (bar) bar.style.width = progress + '%';
      if (text) text.textContent = msg || `加载中... ${Math.round(progress)}%`;
    },
    complete() {
      this.setProgress(100, '加载完成');
      const s = document.getElementById('loading-screen');
      if (s) { s.classList.add('hidden'); setTimeout(() => s.style.display = 'none', 900); }
    }
  };
}

// ── 程序化纹理（亮色版）──

function createFloorTexture(scene) {
  const tex = new BABYLON.DynamicTexture('floor-dtex', 1024, scene, true);
  const ctx = tex.getContext();
  const ts = 128;

  // 浅灰白色基底
  ctx.fillStyle = '#c8ccd6';
  ctx.fillRect(0, 0, 1024, 1024);

  // 瓷砖接缝
  for (let i = 0; i <= 1024; i += ts) {
    ctx.strokeStyle = 'rgba(160, 165, 180, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
    // 高光边缘
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i + 1, 0); ctx.lineTo(i + 1, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i + 1); ctx.lineTo(1024, i + 1); ctx.stroke();
  }

  // 每块瓷砖微妙色差
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const b = 0.95 + Math.random() * 0.1;
      ctx.fillStyle = `rgba(${Math.round(200 * b)}, ${Math.round(204 * b)}, ${Math.round(214 * b)}, 0.25)`;
      ctx.fillRect(x * ts + 3, y * ts + 3, ts - 6, ts - 6);
    }
  }

  // 抛光高光
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * 1024, ry = Math.random() * 1024;
    const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, 25 + Math.random() * 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx - 40, ry - 40, 80, 80);
  }

  tex.update();
  tex.uScale = 4;
  tex.vScale = 3;
  return tex;
}

function createWallTexture(scene) {
  const tex = new BABYLON.DynamicTexture('wall-dtex', 512, scene, true);
  const ctx = tex.getContext();

  // 浅灰白基底
  ctx.fillStyle = '#dde0e8';
  ctx.fillRect(0, 0, 512, 512);

  // 微弱竖条纹
  for (let x = 0; x < 512; x += 6) {
    const alpha = 0.01 + Math.random() * 0.03;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(x, 0, 1, 512);
  }

  // 微弱噪点
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() * 0.04})`;
    ctx.fillRect(x, y, 1, 1);
  }

  tex.update();
  tex.uScale = 3;
  tex.vScale = 2;
  return tex;
}

function createCeilingTexture(scene) {
  const tex = new BABYLON.DynamicTexture('ceil-dtex', 512, scene, true);
  const ctx = tex.getContext();

  ctx.fillStyle = '#e2e5ec';
  ctx.fillRect(0, 0, 512, 512);

  // 方格吊顶
  for (let i = 0; i <= 512; i += 64) {
    ctx.strokeStyle = 'rgba(190, 195, 210, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }

  tex.update();
  tex.uScale = 4;
  tex.vScale = 3;
  return tex;
}

// ── PBR 材质工厂（亮色调版）──

export function createFloorMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('floor-pbr', scene);
  mat.albedoTexture = createFloorTexture(scene);
  mat.metallic = 0.05;
  mat.roughness = 0.12;  // 高抛光 → 灯光反射高光
  mat.environmentIntensity = 0.7;
  return mat;
}

export function createWallMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'wall-pbr', scene);
  mat.albedoTexture = createWallTexture(scene);
  mat.metallic = 0;
  mat.roughness = 0.7;
  mat.environmentIntensity = 0.4;
  return mat;
}

export function createMetalMaterial(scene, name, color) {
  const mat = new BABYLON.PBRMaterial(name || 'metal-pbr', scene);
  mat.albedoColor = color || new BABYLON.Color3(0.7, 0.72, 0.78);
  mat.metallic = 0.85;
  mat.roughness = 0.25;
  mat.environmentIntensity = 0.9;
  return mat;
}

export function createBoardMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'board-pbr', scene);
  mat.albedoColor = new BABYLON.Color3(0.85, 0.87, 0.92);
  mat.metallic = 0.05;
  mat.roughness = 0.5;
  mat.emissiveColor = new BABYLON.Color3(0.06, 0.06, 0.08);
  mat.environmentIntensity = 0.5;
  return mat;
}

export function createCeilingMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('ceil-pbr', scene);
  mat.albedoTexture = createCeilingTexture(scene);
  mat.metallic = 0;
  mat.roughness = 0.85;
  mat.environmentIntensity = 0.3;
  return mat;
}

// ── 发光边框 ──

export function createGlowBorder(scene, parentMesh, color) {
  const { width, height } = getMeshSize(parentMesh);
  const bt = 0.08;
  const bc = color || new BABYLON.Color3(0, 0.6, 1.0);
  const borders = [];
  [
    { w: width + bt * 2, h: bt, x: 0, y: height / 2 + bt / 2 },
    { w: width + bt * 2, h: bt, x: 0, y: -(height / 2 + bt / 2) },
    { w: bt, h: height, x: -(width / 2 + bt / 2), y: 0 },
    { w: bt, h: height, x: width / 2 + bt / 2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`${parentMesh.name}-bdr-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.01);
    b.parent = parentMesh;
    const m = new BABYLON.StandardMaterial(`bdr-mat-${parentMesh.name}-${i}`, scene);
    m.emissiveColor = bc.scale(0.9);
    m.diffuseColor = bc.scale(0.3);
    b.material = m;
    borders.push(b);
  });
  return borders;
}

function getMeshSize(mesh) {
  const bb = mesh.getBoundingInfo().boundingBox;
  const s = bb.maximumWorld.subtract(bb.minimumWorld);
  return { width: Math.abs(s.x), height: Math.abs(s.y) };
}
