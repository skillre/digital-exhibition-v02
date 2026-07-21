// src/utils.js — 共享工具函数 + PBR 物理材质系统（真实感版）

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

// ═══════════════════════════════════════════════════
// 法线贴图生成器（Sobel 滤波）
// ═══════════════════════════════════════════════════

/**
 * 从灰度图生成法线贴图
 * @param {BABYLON.DynamicTexture} sourceTex - 源纹理
 * @param {BABYLON.Scene} scene
 * @param {number} strength - 法线强度 (0.5~3.0)
 * @returns {BABYLON.DynamicTexture}
 */
function generateNormalMap(sourceTex, scene, strength = 1.5) {
  const size = sourceTex.getSize().width;
  const normalTex = new BABYLON.DynamicTexture(sourceTex.name + '-normal', size, scene, false);
  const srcCtx = sourceTex.getContext();
  const dstCtx = normalTex.getContext();

  const srcData = srcCtx.getImageData(0, 0, size, size);
  const dstData = dstCtx.createImageData(size, size);

  // 灰度转换
  function gray(x, y) {
    const i = (y * size + x) * 4;
    return (srcData.data[i] + srcData.data[i + 1] + srcData.data[i + 2]) / 3;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sobel 算子
      const tl = gray(Math.max(0, x - 1), Math.max(0, y - 1));
      const t  = gray(x, Math.max(0, y - 1));
      const tr = gray(Math.min(size - 1, x + 1), Math.max(0, y - 1));
      const l  = gray(Math.max(0, x - 1), y);
      const r  = gray(Math.min(size - 1, x + 1), y);
      const bl = gray(Math.max(0, x - 1), Math.min(size - 1, y + 1));
      const b  = gray(x, Math.min(size - 1, y + 1));
      const br = gray(Math.min(size - 1, x + 1), Math.min(size - 1, y + 1));

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      // 法线向量
      const nx = -dX * strength / 255;
      const ny = -dY * strength / 255;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const i = (y * size + x) * 4;
      dstData.data[i]     = Math.round((nx / len * 0.5 + 0.5) * 255);     // R
      dstData.data[i + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);     // G
      dstData.data[i + 2] = Math.round((nz / len * 0.5 + 0.5) * 255);     // B
      dstData.data[i + 3] = 255;
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  normalTex.update();
  return normalTex;
}

// ═══════════════════════════════════════════════════
// 高细节程序化纹理
// ═══════════════════════════════════════════════════

/**
 * 地板纹理（2048分辨率，抛光瓷砖+接缝+微划痕+色差）
 */
function createFloorTexture(scene) {
  const S = 2048;
  const tex = new BABYLON.DynamicTexture('floor-dtex', S, scene, true);
  const ctx = tex.getContext();
  const ts = S / 8; // 256px 每块瓷砖

  // 基底色
  ctx.fillStyle = '#b8bcc8';
  ctx.fillRect(0, 0, S, S);

  // 每块瓷砖微妙色差 + 抛光高光
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      const b = 0.93 + Math.random() * 0.14;
      ctx.fillStyle = `rgba(${Math.round(184*b)}, ${Math.round(188*b)}, ${Math.round(200*b)}, 0.35)`;
      ctx.fillRect(tx * ts + 4, ty * ts + 4, ts - 8, ts - 8);

      // 抛光随机高光
      for (let h = 0; h < 3; h++) {
        const hx = tx * ts + Math.random() * ts;
        const hy = ty * ts + Math.random() * ts;
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 20 + Math.random() * 30);
        grad.addColorStop(0, 'rgba(255,255,255,0.1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(hx - 50, hy - 50, 100, 100);
      }
    }
  }

  // 瓷砖接缝（深色凹槽）
  for (let i = 0; i <= S; i += ts) {
    // 深色阴影
    ctx.strokeStyle = 'rgba(60, 65, 80, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    // 浅色高光边缘
    ctx.strokeStyle = 'rgba(200, 205, 220, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i + 2, 0); ctx.lineTo(i + 2, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i + 2); ctx.lineTo(S, i + 2); ctx.stroke();
  }

  // 微划痕（散布在表面）
  ctx.strokeStyle = 'rgba(180, 185, 200, 0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 80; i++) {
    const sx = Math.random() * S;
    const sy = Math.random() * S;
    const angle = Math.random() * Math.PI;
    const len = 20 + Math.random() * 60;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
  }

  // 表面噪点
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const a = Math.random() * 0.04;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 220 : 100}, ${Math.random() > 0.5 ? 225 : 105}, ${Math.random() > 0.5 ? 235 : 115}, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  tex.update();
  tex.uScale = 3; tex.vScale = 2;
  return tex;
}

/**
 * 墙壁纹理（1024分辨率，乳胶漆+滚筒痕迹+微瑕疵）
 */
function createWallTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('wall-dtex', S, scene, true);
  const ctx = tex.getContext();

  // 基底色
  ctx.fillStyle = '#d5d8e2';
  ctx.fillRect(0, 0, S, S);

  // 滚筒痕迹（竖向微条纹）
  for (let x = 0; x < S; x += 4) {
    const a = 0.015 + Math.random() * 0.025;
    const bright = Math.random() > 0.5;
    ctx.fillStyle = `rgba(${bright ? 240 : 180}, ${bright ? 242 : 185}, ${bright ? 250 : 195}, ${a})`;
    ctx.fillRect(x, 0, 2 + Math.random() * 2, S);
  }

  // 表面噪点（涂料质感）
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const v = Math.random() * 0.03;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 230 : 160}, ${Math.random() > 0.5 ? 232 : 165}, ${Math.random() > 0.5 ? 240 : 175}, ${v})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // 偶尔的小瑕疵点
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    ctx.fillStyle = 'rgba(140, 145, 160, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.update();
  tex.uScale = 3; tex.vScale = 2;
  return tex;
}

/**
 * 天花板纹理（1024分辨率，石膏板吊顶+接缝）
 */
function createCeilingTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('ceil-dtex', S, scene, true);
  const ctx = tex.getContext();

  ctx.fillStyle = '#dde0ea';
  ctx.fillRect(0, 0, S, S);

  // 方格吊顶接缝
  const grid = S / 4;
  for (let i = 0; i <= S; i += grid) {
    ctx.strokeStyle = 'rgba(170, 175, 190, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    // 凹槽阴影
    ctx.strokeStyle = 'rgba(120, 125, 140, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i + 1, 0); ctx.lineTo(i + 1, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i + 1); ctx.lineTo(S, i + 1); ctx.stroke();
  }

  // 面板色差
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const b = 0.97 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(${Math.round(221*b)}, ${Math.round(224*b)}, ${Math.round(234*b)}, 0.2)`;
      ctx.fillRect(tx * grid + 3, ty * grid + 3, grid - 6, grid - 6);
    }
  }

  tex.update();
  tex.uScale = 4; tex.vScale = 3;
  return tex;
}

/**
 * 金属拉丝纹理（512分辨率，定向拉丝+微划痕）
 */
function createMetalTexture(scene) {
  const S = 512;
  const tex = new BABYLON.DynamicTexture('metal-dtex', S, scene, false);
  const ctx = tex.getContext();

  ctx.fillStyle = '#b0b5c2';
  ctx.fillRect(0, 0, S, S);

  // 拉丝纹理（水平方向）
  for (let y = 0; y < S; y++) {
    const a = 0.02 + Math.random() * 0.05;
    const bright = Math.random() > 0.4;
    ctx.strokeStyle = `rgba(${bright ? 200 : 140}, ${bright ? 205 : 145}, ${bright ? 220 : 160}, ${a})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
  }

  // 微划痕
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * S;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y + (Math.random() - 0.5) * 5); ctx.stroke();
  }

  tex.update();
  return tex;
}

// ═══════════════════════════════════════════════════
// PBR 材质工厂（带法线贴图）
// ═══════════════════════════════════════════════════

export function createFloorMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('floor-pbr', scene);
  const colorTex = createFloorTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 2.0);
  mat.bumpTexture.level = 0.8;
  mat.metallic = 0.05;
  mat.roughness = 0.15;
  mat.environmentIntensity = 0.7;
  return mat;
}

export function createWallMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'wall-pbr', scene);
  const colorTex = createWallTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 1.0);
  mat.bumpTexture.level = 0.4;
  mat.metallic = 0;
  mat.roughness = 0.72;
  mat.environmentIntensity = 0.35;
  return mat;
}

export function createMetalMaterial(scene, name, color) {
  const mat = new BABYLON.PBRMaterial(name || 'metal-pbr', scene);
  const colorTex = createMetalTexture(scene);
  if (color) {
    mat.albedoColor = color;
  } else {
    mat.albedoTexture = colorTex;
  }
  mat.bumpTexture = generateNormalMap(colorTex, scene, 1.2);
  mat.bumpTexture.level = 0.5;
  mat.metallic = 0.85;
  mat.roughness = 0.25;
  mat.environmentIntensity = 0.85;
  return mat;
}

export function createBoardMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'board-pbr', scene);
  mat.albedoColor = new BABYLON.Color3(0.88, 0.90, 0.94);
  mat.metallic = 0.05;
  mat.roughness = 0.45;
  mat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.07);
  mat.environmentIntensity = 0.45;
  return mat;
}

export function createCeilingMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('ceil-pbr', scene);
  const colorTex = createCeilingTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 0.8);
  mat.bumpTexture.level = 0.3;
  mat.metallic = 0;
  mat.roughness = 0.85;
  mat.environmentIntensity = 0.25;
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
