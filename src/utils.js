// src/utils.js — 共享工具函数 + PBR 物理材质系统（深色科技风）

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
// 深色科技风纹理
// ═══════════════════════════════════════════════════

/**
 * 地板：深色抛光石材 + 微弱网格线 + 反射高光
 */
function createFloorTexture(scene) {
  const S = 2048;
  const tex = new BABYLON.DynamicTexture('floor-dtex', S, scene, true);
  const ctx = tex.getContext();

  // 深色基底
  ctx.fillStyle = '#2A3040';
  ctx.fillRect(0, 0, S, S);

  // 大块瓷砖网格（浅色凹槽）
  const ts = S / 6;
  for (let i = 0; i <= S; i += ts) {
    ctx.strokeStyle = 'rgba(60, 70, 90, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    // 高光边缘
    ctx.strokeStyle = 'rgba(80, 90, 110, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i+2, 0); ctx.lineTo(i+2, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i+2); ctx.lineTo(S, i+2); ctx.stroke();
  }

  // 每块瓷砖色差 + 抛光高光
  for (let ty = 0; ty < 6; ty++) {
    for (let tx = 0; tx < 6; tx++) {
      const b = 0.9 + Math.random() * 0.2;
      ctx.fillStyle = `rgba(${Math.round(42*b)}, ${Math.round(48*b)}, ${Math.round(64*b)}, 0.3)`;
      ctx.fillRect(tx*ts+4, ty*ts+4, ts-8, ts-8);
      // 抛光高光斑
      for (let h = 0; h < 2; h++) {
        const hx = tx*ts + Math.random()*ts, hy = ty*ts + Math.random()*ts;
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 15+Math.random()*20);
        grad.addColorStop(0, 'rgba(100, 120, 160, 0.12)');
        grad.addColorStop(1, 'rgba(100, 120, 160, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(hx-35, hy-35, 70, 70);
      }
    }
  }

  // 微划痕
  ctx.strokeStyle = 'rgba(70, 80, 100, 0.1)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 60; i++) {
    const sx = Math.random()*S, sy = Math.random()*S;
    const angle = Math.random()*Math.PI, len = 15+Math.random()*40;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx+Math.cos(angle)*len, sy+Math.sin(angle)*len); ctx.stroke();
  }

  // 噪点
  for (let i = 0; i < 5000; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    ctx.fillStyle = `rgba(${60+Math.random()*30}, ${70+Math.random()*30}, ${90+Math.random()*30}, ${Math.random()*0.06})`;
    ctx.fillRect(x, y, 1, 1);
  }

  tex.update();
  tex.uScale = 3; tex.vScale = 2;
  return tex;
}

/**
 * 墙壁：深色面板系统 + 可见接缝 + LED凹槽
 */
function createWallTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('wall-dtex', S, scene, true);
  const ctx = tex.getContext();

  // 深色基底
  ctx.fillStyle = '#1E2430';
  ctx.fillRect(0, 0, S, S);

  // 面板网格（2列×4行面板）
  const cols = 2, rows = 4;
  const pw = S / cols, ph = S / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * pw, y = r * ph;
      // 面板主体（微弱色差）
      const b = 0.95 + Math.random() * 0.1;
      ctx.fillStyle = `rgba(${Math.round(42*b)}, ${Math.round(46*b)}, ${Math.round(58*b)}, 0.5)`;
      ctx.fillRect(x+3, y+3, pw-6, ph-6);
      // 面板磨砂纹理 + 微弱木纹
      for (let i = 0; i < 300; i++) {
        const px = x + 3 + Math.random()*(pw-6), py = y + 3 + Math.random()*(ph-6);
        ctx.fillStyle = `rgba(50, 55, 70, ${Math.random()*0.05})`;
        ctx.fillRect(px, py, 1, 1);
      }
      // 木纹条纹
      for (let ly = y+3; ly < y+ph-3; ly += 3) {
        const a = 0.02 + Math.random()*0.03;
        ctx.strokeStyle = `rgba(60, 55, 50, ${a})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x+3, ly); ctx.lineTo(x+pw-3, ly + (Math.random()-0.5)*2); ctx.stroke();
      }
    }
  }

  // 接缝凹槽（深色线）
  for (let c = 1; c < cols; c++) {
    const x = c * pw;
    ctx.fillStyle = 'rgba(15, 18, 25, 0.8)';
    ctx.fillRect(x-2, 0, 4, S);
  }
  for (let r = 1; r < rows; r++) {
    const y = r * ph;
    ctx.fillStyle = 'rgba(15, 18, 25, 0.8)';
    ctx.fillRect(0, y-2, S, 4);
  }

  // 接缝内LED灯带（微弱蓝光）
  for (let c = 1; c < cols; c++) {
    const x = c * pw;
    ctx.fillStyle = 'rgba(0, 80, 180, 0.15)';
    ctx.fillRect(x-1, 0, 2, S);
  }
  for (let r = 1; r < rows; r++) {
    const y = r * ph;
    ctx.fillStyle = 'rgba(0, 80, 180, 0.15)';
    ctx.fillRect(0, y-1, S, 2);
  }

  // 面板边缘细金属边框
  ctx.strokeStyle = 'rgba(80, 90, 110, 0.3)';
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.strokeRect(c*pw+3, r*ph+3, pw-6, ph-6);
    }
  }

  tex.update();
  tex.uScale = 3; tex.vScale = 2;
  return tex;
}

/**
 * 天花板：深灰网格吊顶 + 集成灯盘
 */
function createCeilingTexture(scene) {
  const S = 1024;
  const tex = new BABYLON.DynamicTexture('ceil-dtex', S, scene, true);
  const ctx = tex.getContext();

  // 深灰基底
  ctx.fillStyle = '#161A24';
  ctx.fillRect(0, 0, S, S);

  // 方形网格骨架（金属条）
  const grid = S / 4;
  for (let i = 0; i <= S; i += grid) {
    // 金属骨架阴影
    ctx.fillStyle = 'rgba(10, 12, 18, 0.6)';
    ctx.fillRect(i-3, 0, 6, S);
    ctx.fillRect(0, i-3, S, 6);
    // 金属骨架高光
    ctx.fillStyle = 'rgba(60, 65, 80, 0.4)';
    ctx.fillRect(i-1, 0, 2, S);
    ctx.fillRect(0, i-1, S, 2);
  }

  // 网格交叉点灯盘
  for (let y = 0; y <= 4; y++) {
    for (let x = 0; x <= 4; x++) {
      const cx = x * grid, cy = y * grid;
      // 灯盘背景
      ctx.fillStyle = 'rgba(40, 45, 60, 0.5)';
      ctx.fillRect(cx-20, cy-20, 40, 40);
      // 灯盘发光
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      grad.addColorStop(0, 'rgba(200, 210, 230, 0.2)');
      grad.addColorStop(1, 'rgba(200, 210, 230, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx-20, cy-20, 40, 40);
    }
  }

  // 面板色差
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const b = 0.95 + Math.random() * 0.1;
      ctx.fillStyle = `rgba(${Math.round(30*b)}, ${Math.round(34*b)}, ${Math.round(48*b)}, 0.2)`;
      ctx.fillRect(tx*grid+6, ty*grid+6, grid-12, grid-12);
    }
  }

  tex.update();
  tex.uScale = 4; tex.vScale = 3;
  return tex;
}

/**
 * 金属：深灰拉丝金属
 */
function createMetalTexture(scene) {
  const S = 512;
  const tex = new BABYLON.DynamicTexture('metal-dtex', S, scene, false);
  const ctx = tex.getContext();

  ctx.fillStyle = '#808590';
  ctx.fillRect(0, 0, S, S);

  // 拉丝纹理（水平方向）
  for (let y = 0; y < S; y++) {
    const a = 0.02 + Math.random() * 0.04;
    const bright = Math.random() > 0.4;
    ctx.strokeStyle = `rgba(${bright ? 90 : 50}, ${bright ? 100 : 55}, ${bright ? 120 : 70}, ${a})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
  }

  tex.update();
  return tex;
}

// ═══════════════════════════════════════════════════
// PBR 材质工厂
// ═══════════════════════════════════════════════════

export function createFloorMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('floor-pbr', scene);
  const colorTex = createFloorTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 2.0);
  mat.bumpTexture.level = 0.8;
  mat.metallic = 0.08;
  mat.roughness = 0.10;  // 镜面抛光
  mat.environmentIntensity = 0.85;
  return mat;
}

export function createWallMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'wall-pbr', scene);
  const colorTex = createWallTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 1.2);
  mat.bumpTexture.level = 0.5;
  mat.metallic = 0.1;
  mat.roughness = 0.6;
  mat.environmentIntensity = 0.6;
  return mat;
}

export function createMetalMaterial(scene, name, color) {
  const mat = new BABYLON.PBRMaterial(name || 'metal-pbr', scene);
  if (color) {
    mat.albedoColor = color;
  } else {
    mat.albedoTexture = createMetalTexture(scene);
  }
  mat.metallic = 0.92;
  mat.roughness = 0.22;
  mat.environmentIntensity = 0.8;
  return mat;
}

export function createBoardMaterial(scene, name) {
  const mat = new BABYLON.PBRMaterial(name || 'board-pbr', scene);
  mat.albedoColor = new BABYLON.Color3(0.85, 0.87, 0.92);
  mat.metallic = 0.05;
  mat.roughness = 0.45;
  mat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.07);
  mat.environmentIntensity = 0.65;
  return mat;
}

export function createCeilingMaterial(scene) {
  const mat = new BABYLON.PBRMaterial('ceil-pbr', scene);
  const colorTex = createCeilingTexture(scene);
  mat.albedoTexture = colorTex;
  mat.bumpTexture = generateNormalMap(colorTex, scene, 0.8);
  mat.bumpTexture.level = 0.3;
  mat.metallic = 0.0;
  mat.roughness = 0.9;  // 完全哑光
  mat.environmentIntensity = 0.4;
  return mat;
}

// ── 发光边框 ──

export function createGlowBorder(scene, parentMesh, color) {
  const { width, height } = getMeshSize(parentMesh);
  const bt = 0.08;
  const bc = color || new BABYLON.Color3(0, 0.5, 1.0);
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

// ── 实体相框（在面板边缘向外伸出，类似真实相框）──
// 用 4 根带厚度(depth)的 Box 木条围住面板外缘，向四边外伸 + 向前凸出板表面，
// 形成立体相框；不遮挡画面。框条作为面板的子节点，跟随面板旋转/移动。
//
// 参数:
//   scene, frameMesh(面板), { frameW(框条宽度/厚度), depth(向前凸出), margin(额外外伸),
//     color(木材底色), mat(自定义材质; 不传则自动用深色哑光木纹) }
// 返回: { frame: TransformNode(框组根), bars: [上/下/左/右 4根] }
export function createPictureFrame(scene, frameMesh, opts = {}) {
  const { width, height } = getMeshSize(frameMesh);
  const frameW = opts.frameW ?? 0.10;      // 框条截面宽度(厚度)
  const depth = opts.depth ?? 0.06;        // 向前凸出板表面的距离
  const margin = opts.margin ?? 0.04;      // 在面板外缘再向外伸出
  const color = opts.color || new BABYLON.Color3(0.15, 0.10, 0.07);  // 深棕木色

  // 框组根节点，挂到面板上(随板旋转/移动)，z 轴略向前推
  const frame = new BABYLON.TransformNode(`${frameMesh.name}-frame`, scene);
  frame.parent = frameMesh;
  frame.position = new BABYLON.Vector3(0, 0, depth / 2);

  // 木材材质: 哑光 PBR，细微程序纹理增加质感
  const woodMat = opts.mat || (() => {
    const m = new BABYLON.PBRMaterial(`${frameMesh.name}-wood-mat`, scene);
    m.albedoColor = color;
    m.metallic = 0.0;
    m.roughness = 0.85;
    m.environmentIntensity = 0.5;
    return m;
  })();

  // 整体外尺寸 = 面板 + margin + 框宽 (框条中心位于边缘外 frameW/2)
  const outerW = width + margin * 2 + frameW;
  const outerH = height + margin * 2 + frameW;
  // 各条长度(水平条跨满外宽; 竖条夹在两根水平条之间)
  const hBarLen = outerW;
  const vBarLen = outerH - frameW * 2;

  // 框条截面: frameW × depth (宽 × 前凸)，轴对齐: box 的 width(X)=frameW, height(Y)=depth
  const bars = [];
  const mkBar = (name, sx, sy, len, w /*沿len方向的尺寸X*/, axis /*'h'|'v'*/) => {
    // Babylon Box 尺寸: width(X) height(Y) depth(Z)
    let box;
    if (axis === 'h') {
      box = BABYLON.MeshBuilder.CreateBox(name, { width: len, height: depth, depth: frameW }, scene);
      box.position = new BABYLON.Vector3(0, sy, 0);
    } else {
      box = BABYLON.MeshBuilder.CreateBox(name, { width: frameW, height: len, depth: depth }, scene);
      box.position = new BABYLON.Vector3(sx, 0, 0);
    }
    box.parent = frame;
    box.material = woodMat;
    box.isPickable = false;
    box.checkCollisions = false;
    bars.push(box);
    return box;
  };

  // 上下水平条: 宽度=outerW, 位于上/下边缘外(frameW 外伸)，y = ±(height/2 + margin + frameW/2)
  mkBar(`${frameMesh.name}-frame-top`,    0,  (height / 2 + margin + frameW / 2), hBarLen, frameW, 'h');
  mkBar(`${frameMesh.name}-frame-bottom`, 0, -(height / 2 + margin + frameW / 2), hBarLen, frameW, 'h');
  // 左右竖条: 高度=vBarLen, 位于左/右边缘外，x = ±(width/2 + margin + frameW/2)
  mkBar(`${frameMesh.name}-frame-left`,  -(width / 2 + margin + frameW / 2), 0, vBarLen, frameW, 'v');
  mkBar(`${frameMesh.name}-frame-right`,   (width / 2 + margin + frameW / 2), 0, vBarLen, frameW, 'v');

  return { frame, bars };
}
