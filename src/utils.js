// src/utils.js — 企业展厅风格材质系统（明亮、专业、高端）

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
// 法线贴图生成器
// ═══════════════════════════════════════════════════

function generateNormalMap(sourceTex, scene, strength = 1.5) {
  const size = sourceTex.getSize().width;
  const normalTex = new BABYLON.DynamicTexture(sourceTex.name + '-normal', size, scene, false);
  const srcCtx = sourceTex.getContext();
  const dstCtx = normalTex.getContext();
  const srcData = srcCtx.getImageData(0, 0, size, size);
  const dstData = dstCtx.createImageData(size, size);

  function gray(x, y) {
    x = Math.max(0, Math.min(size - 1, x));
    y = Math.max(0, Math.min(size - 1, y));
    const i = (y * size + x) * 4;
    return (srcData.data[i] + srcData.data[i + 1] + srcData.data[i + 2]) / 3;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dX = (gray(x+1,y-1) + 2*gray(x+1,y) + gray(x+1,y+1)) - (gray(x-1,y-1) + 2*gray(x-1,y) + gray(x-1,y+1));
      const dY = (gray(x-1,y+1) + 2*gray(x,y+1) + gray(x+1,y+1)) - (gray(x-1,y-1) + 2*gray(x,y-1) + gray(x+1,y-1));
      const nx = -dX * strength / 255, ny = -dY * strength / 255, nz = 1;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      const i = (y * size + x) * 4;
      dstData.data[i]   = Math.round((nx/len*0.5+0.5)*255);
      dstData.data[i+1] = Math.round((ny/len*0.5+0.5)*255);
      dstData.data[i+2] = Math.round((nz/len*0.5+0.5)*255);
      dstData.data[i+3] = 255;
    }
  }
  dstCtx.putImageData(dstData, 0, 0);
  normalTex.update();
  return normalTex;
}

// ═══════════════════════════════════════════════════
// 企业展厅纹理（明亮版）
// ═══════════════════════════════════════════════════

/**
 * 地板：浅灰色抛光大理石
 */
function createFloorTexture(scene) {
  const S = 2048;
  const tex = new BABYLON.DynamicTexture('floor-dtex', S, scene, true);
  const ctx = tex.getContext();

  ctx.fillStyle = '#E0DDD8';
  ctx.fillRect(0, 0, S, S);

  // 瓷砖网格
  const ts = S / 4;
  for (let i = 0; i <= S; i += ts) {
    ctx.strokeStyle = 'rgba(200, 195, 185, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    // 高光边缘
    ctx.strokeStyle = 'rgba(255, 255, 250, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i+1, 0); ctx.lineTo(i+1, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i+1); ctx.lineTo(S, i+1); ctx.stroke();
  }

  // 每块瓷砖色差 + 柔和高光
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const b = 0.97 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(${Math.round(224*b)}, ${Math.round(221*b)}, ${Math.round(216*b)}, 0.2)`;
      ctx.fillRect(tx*ts+3, ty*ts+3, ts-6, ts-6);
      // 柔和高光
      for (let h = 0; h < 2; h++) {
        const hx = tx*ts + Math.random()*ts, hy = ty*ts + Math.random()*ts;
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 30);
        grad.addColorStop(0, 'rgba(255, 255, 252, 0.08)');
        grad.addColorStop(1, 'rgba(255, 255, 252, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(hx-35, hy-35, 70, 70);
      }
    }
  }

  // 微弱噪点
  for (let i = 0; i < 3000; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    ctx.fillStyle = `rgba(${220+Math.random()*20}, ${218+Math.random()*20}, ${212+Math.random()*20}, ${Math.random()*0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  tex.update();
  tex.uScale = 2; tex.vScale = 2;
  return tex;
}

/**
 * 墙壁：暖白色哑光涂料
 */
function createWallTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('wall-dtex', S, scene, true);
  const ctx = tex.getContext();

  // 暖白基底
  ctx.fillStyle = '#F0EDE8';
  ctx.fillRect(0, 0, S, S);

  // 涂料质感噪点
  for (let i = 0; i < 3000; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    ctx.fillStyle = `rgba(${235+Math.random()*15}, ${232+Math.random()*15}, ${226+Math.random()*15}, ${Math.random()*0.06})`;
    ctx.fillRect(x, y, 1+Math.random(), 1+Math.random());
  }

  // 微弱滚筒痕迹
  for (let x = 0; x < S; x += 5) {
    const a = 0.01 + Math.random() * 0.02;
    ctx.fillStyle = `rgba(225, 222, 216, ${a})`;
    ctx.fillRect(x, 0, 2, S);
  }

  tex.update();
  tex.uScale = 2; tex.vScale = 2;
  return tex;
}

/**
 * 天花板：纯白石膏板
 */
function createCeilingTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('ceil-dtex', S, scene, true);
  const ctx = tex.getContext();

  ctx.fillStyle = '#FAFAF8';
  ctx.fillRect(0, 0, S, S);

  // 微弱纹理
  for (let i = 0; i < 2000; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    ctx.fillStyle = `rgba(248, 248, 245, ${Math.random()*0.04})`;
    ctx.fillRect(x, y, 1, 1);
  }

  tex.update();
  tex.uScale = 3; tex.vScale = 3;
  return tex;
}

/**
 * 金属：香槟金拉丝
 */
function createMetalTexture(scene) {
  const S = 512;
  const tex = new BABYLON.DynamicTexture('metal-dtex', S, scene, false);
  const ctx = tex.getContext();

  ctx.fillStyle = '#C9B99A';
  ctx.fillRect(0, 0, S, S);

  // 拉丝纹理
  for (let y = 0; y < S; y++) {
    const a = 0.02 + Math.random() * 0.04;
    const bright = Math.random() > 0.4;
    ctx.strokeStyle = `rgba(${bright ? 220 : 180}, ${bright ? 200 : 160}, ${bright ? 170 : 130}, ${a})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
  }

  tex.update();
  return tex;
}

// ═══════════════════════════════════════════════════
// PBR 材质工厂（企业展厅版）
// ═══════════════════════════════════════════════════

export function createFloorMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('floor-pbr', scene);
  const colorTex = createFloorTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 1.0);
  mat.bumpTexture.level = 0.3;
  mat.metallic = 0.03;
  mat.roughness = 0.25;
  mat.environmentIntensity = 0.6;
  return mat;
}

export function createWallMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'wall-pbr', scene);
  const colorTex = createWallTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 0.5);
  mat.bumpTexture.level = 0.2;
  mat.metallic = 0;
  mat.roughness = 0.85;
  mat.environmentIntensity = 0.4;
  return mat;
}

export function createMetalMaterial(scene, name, color) {
  const mat = new BABYLON.PBRMaterial(name || 'metal-pbr', scene);
  if (color) {
    mat.albedoColor = color;
  } else {
    mat.albedoTexture = createMetalTexture(scene);
  }
  mat.metallic = 0.9;
  mat.roughness = 0.25;
  mat.environmentIntensity = 0.8;
  return mat;
}

export function createBoardMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'board-pbr', scene);
  mat.albedoColor = new BABYLON.Color3(0.95, 0.94, 0.92);
  mat.metallic = 0;
  mat.roughness = 0.7;
  mat.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.03);
  mat.environmentIntensity = 0.5;
  return mat;
}

export function createCeilingMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('ceil-pbr', scene);
  const colorTex = createCeilingTexture(scene);
  mat.albedoTexture = colorTex;
  mat.metallic = 0;
  mat.roughness = 0.95;
  mat.environmentIntensity = 0.3;
  return mat;
}

// ── 发光边框 ──

export function createGlowBorder(scene, parentMesh, color) {
  const { width, height } = getMeshSize(parentMesh);
  const bt = 0.06;
  const bc = color || new BABYLON.Color3(0.1, 0.32, 0.47); // 品牌蓝
  const borders = [];
  [
    { w: width+bt*2, h: bt, x: 0, y: height/2+bt/2 },
    { w: width+bt*2, h: bt, x: 0, y: -(height/2+bt/2) },
    { w: bt, h: height, x: -(width/2+bt/2), y: 0 },
    { w: bt, h: height, x: width/2+bt/2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`${parentMesh.name}-bdr-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.01);
    b.parent = parentMesh;
    const m = new BABYLON.StandardMaterial(`bdr-mat-${parentMesh.name}-${i}`, scene);
    m.emissiveColor = bc.scale(0.6);
    m.diffuseColor = bc.scale(0.2);
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
