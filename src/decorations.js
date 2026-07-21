// src/decorations.js — 单间展厅装饰系统
// 立柱 · 天花板灯带 · LED墙线 · 地板网格 · 中心装饰 · 粒子

export function addDecorations(scene, hallInfo) {
  const meshes = [];
  const W = 24, D = 18, H = 4.0;

  // ── 1. 四根立柱 ──
  const colMat = new BABYLON.PBRMaterial('col-pbr', scene);
  colMat.albedoColor = new BABYLON.Color3(0.78, 0.80, 0.85);
  colMat.metallic = 0.25;
  colMat.roughness = 0.3;
  colMat.environmentIntensity = 0.8;

  const accentMat = new BABYLON.StandardMaterial('col-accent', scene);
  accentMat.diffuseColor = new BABYLON.Color3(0.25, 0.4, 0.65);
  accentMat.emissiveColor = new BABYLON.Color3(0.15, 0.5, 0.9);

  const colPos = [[-8, 0, 6], [8, 0, 6], [-8, 0, -4], [8, 0, -4]];
  for (const [x, _, z] of colPos) {
    const col = BABYLON.MeshBuilder.CreateCylinder(`col-${x}-${z}`, {
      diameter: 0.5, height: H, tessellation: 16
    }, scene);
    col.position = new BABYLON.Vector3(x, H / 2, z);
    col.material = colMat;
    col.checkCollisions = true;

    const ringTop = BABYLON.MeshBuilder.CreateTorus(`ring-t-${x}-${z}`, {
      diameter: 0.7, thickness: 0.06, tessellation: 24
    }, scene);
    ringTop.position = new BABYLON.Vector3(x, H - 0.12, z);
    ringTop.material = accentMat;

    const ringBot = BABYLON.MeshBuilder.CreateTorus(`ring-b-${x}-${z}`, {
      diameter: 0.72, thickness: 0.06, tessellation: 24
    }, scene);
    ringBot.position = new BABYLON.Vector3(x, 0.12, z);
    ringBot.material = accentMat;

    const stripe = BABYLON.MeshBuilder.CreateCylinder(`stripe-${x}-${z}`, {
      diameter: 0.54, height: 0.08, tessellation: 16
    }, scene);
    stripe.position = new BABYLON.Vector3(x, H * 0.55, z);
    stripe.material = accentMat;

    meshes.push(col, ringTop, ringBot, stripe);
  }

  // ── 2. 天花板灯带 ──
  const lightMat = new BABYLON.StandardMaterial('ceil-light', scene);
  lightMat.diffuseColor = new BABYLON.Color3(0.9, 0.93, 1.0);
  lightMat.emissiveColor = new BABYLON.Color3(0.65, 0.7, 0.82);

  // 十字灯带
  for (let rot = 0; rot < 2; rot++) {
    const strip = BABYLON.MeshBuilder.CreateBox(`ceil-strip-${rot}`, {
      width: 0.25, height: 0.04, depth: D * 0.7
    }, scene);
    strip.position = new BABYLON.Vector3(0, H - 0.01, 0);
    strip.rotation.y = rot * Math.PI / 2;
    strip.material = lightMat;
    meshes.push(strip);
  }

  // 方形灯框
  const frameS = 16;
  [[0, frameS / 2], [0, -frameS / 2], [frameS / 2, 0], [-frameS / 2, 0]].forEach(([x, z], i) => {
    const horizontal = i < 2;
    const f = BABYLON.MeshBuilder.CreateBox(`ceil-frame-${i}`, {
      width: horizontal ? frameS : 0.2, height: 0.04, depth: horizontal ? 0.2 : frameS
    }, scene);
    f.position = new BABYLON.Vector3(x, H - 0.01, z);
    f.material = lightMat;
    meshes.push(f);
  });

  // 嵌入式灯盘（6 个均匀分布）
  const panelMat = new BABYLON.StandardMaterial('ceil-panel', scene);
  panelMat.diffuseColor = new BABYLON.Color3(0.92, 0.95, 1.0);
  panelMat.emissiveColor = new BABYLON.Color3(0.72, 0.78, 0.88);
  [[-6, 5], [0, 5], [6, 5], [-6, -3], [0, -3], [6, -3]].forEach(([x, z], i) => {
    const p = BABYLON.MeshBuilder.CreatePlane(`ceil-panel-${i}`, { width: 2.2, height: 2.2 }, scene);
    p.position = new BABYLON.Vector3(x, H - 0.005, z);
    p.rotation.x = Math.PI / 2;
    p.material = panelMat;
    meshes.push(p);
  });

  // ── 3. 墙壁 LED 灯带 ──
  const ledBlue = new BABYLON.StandardMaterial('led-blue', scene);
  ledBlue.emissiveColor = new BABYLON.Color3(0, 0.55, 0.95);
  const ledCyan = new BABYLON.StandardMaterial('led-cyan', scene);
  ledCyan.emissiveColor = new BABYLON.Color3(0, 0.7, 0.85);

  // 底部灯带（四面墙）
  [
    { len: W, pos: [0, 0.22, D / 2 - 0.02], rot: 0 },
    { len: W, pos: [0, 0.22, -D / 2 + 0.02], rot: 0 },
    { len: D, pos: [W / 2 - 0.02, 0.22, 0], rot: Math.PI / 2 },
    { len: D, pos: [-W / 2 + 0.02, 0.22, 0], rot: Math.PI / 2 },
  ].forEach((cfg, i) => {
    const strip = BABYLON.MeshBuilder.CreateBox(`wall-led-${i}`, {
      width: cfg.len, height: 0.05, depth: 0.03
    }, scene);
    strip.position = new BABYLON.Vector3(...cfg.pos);
    strip.rotation.y = cfg.rot;
    strip.material = i % 2 === 0 ? ledBlue : ledCyan;
    meshes.push(strip);
  });

  // 中段灯带（离地 2.8m）
  [
    { len: W, pos: [0, 2.8, D / 2 - 0.02], rot: 0 },
    { len: W, pos: [0, 2.8, -D / 2 + 0.02], rot: 0 },
    { len: D, pos: [W / 2 - 0.02, 2.8, 0], rot: Math.PI / 2 },
    { len: D, pos: [-W / 2 + 0.02, 2.8, 0], rot: Math.PI / 2 },
  ].forEach((cfg, i) => {
    const strip = BABYLON.MeshBuilder.CreateBox(`wall-led-mid-${i}`, {
      width: cfg.len, height: 0.04, depth: 0.02
    }, scene);
    strip.position = new BABYLON.Vector3(...cfg.pos);
    strip.rotation.y = cfg.rot;
    strip.material = ledBlue;
    meshes.push(strip);
  });

  // ── 4. 地板网格线 ──
  const gridMat = new BABYLON.StandardMaterial('grid', scene);
  gridMat.diffuseColor = new BABYLON.Color3(0.55, 0.6, 0.7);
  gridMat.emissiveColor = new BABYLON.Color3(0.15, 0.2, 0.3);
  for (let x = -W / 2 + 2; x <= W / 2 - 2; x += 2) {
    const l = BABYLON.MeshBuilder.CreateBox(`grid-x-${x}`, { width: 0.02, height: 0.005, depth: D - 4 }, scene);
    l.position = new BABYLON.Vector3(x, 0.003, 0);
    l.material = gridMat;
    meshes.push(l);
  }
  for (let z = -D / 2 + 2; z <= D / 2 - 2; z += 2) {
    const l = BABYLON.MeshBuilder.CreateBox(`grid-z-${z}`, { width: W - 4, height: 0.005, depth: 0.02 }, scene);
    l.position = new BABYLON.Vector3(0, 0.003, z);
    l.material = gridMat;
    meshes.push(l);
  }

  // ── 5. 中央全息装饰 ──
  const holoBaseMat = new BABYLON.StandardMaterial('holo-base', scene);
  holoBaseMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.5);
  holoBaseMat.emissiveColor = new BABYLON.Color3(0.12, 0.25, 0.5);

  const base = BABYLON.MeshBuilder.CreateCylinder('holo-base', {
    diameter: 2.5, height: 0.1, tessellation: 32
  }, scene);
  base.position = new BABYLON.Vector3(0, 0.05, 2);
  base.material = holoBaseMat;

  const outerRing = BABYLON.MeshBuilder.CreateTorus('holo-ring-outer', {
    diameter: 3.0, thickness: 0.07, tessellation: 48
  }, scene);
  outerRing.position = new BABYLON.Vector3(0, 0.01, 2);
  const orMat = new BABYLON.StandardMaterial('holo-or', scene);
  orMat.emissiveColor = new BABYLON.Color3(0.1, 0.65, 1.0);
  outerRing.material = orMat;

  const innerRing = BABYLON.MeshBuilder.CreateTorus('holo-ring-inner', {
    diameter: 1.8, thickness: 0.05, tessellation: 48
  }, scene);
  innerRing.position = new BABYLON.Vector3(0, 0.01, 2);
  const irMat = new BABYLON.StandardMaterial('holo-ir', scene);
  irMat.emissiveColor = new BABYLON.Color3(0.1, 0.8, 0.95);
  innerRing.material = irMat;

  const pillar = BABYLON.MeshBuilder.CreateCylinder('holo-pillar', {
    diameter: 1.2, height: 2.5, tessellation: 24
  }, scene);
  pillar.position = new BABYLON.Vector3(0, 1.25, 2);
  const pMat = new BABYLON.StandardMaterial('holo-pillar-mat', scene);
  pMat.diffuseColor = new BABYLON.Color3(0.15, 0.45, 0.75);
  pMat.emissiveColor = new BABYLON.Color3(0.1, 0.35, 0.65);
  pMat.alpha = 0.25;
  pMat.backFaceCulling = false;
  pillar.material = pMat;

  const spin1 = BABYLON.MeshBuilder.CreateTorus('holo-spin1', {
    diameter: 1.6, thickness: 0.04, tessellation: 48
  }, scene);
  spin1.position = new BABYLON.Vector3(0, 2.0, 2);
  spin1.rotation.x = Math.PI / 6;
  const s1Mat = new BABYLON.StandardMaterial('holo-s1', scene);
  s1Mat.emissiveColor = new BABYLON.Color3(0.15, 0.9, 1.0);
  spin1.material = s1Mat;

  const spin2 = BABYLON.MeshBuilder.CreateTorus('holo-spin2', {
    diameter: 1.9, thickness: 0.03, tessellation: 48
  }, scene);
  spin2.position = new BABYLON.Vector3(0, 0.8, 2);
  spin2.rotation.x = -Math.PI / 5;
  const s2Mat = new BABYLON.StandardMaterial('holo-s2', scene);
  s2Mat.emissiveColor = new BABYLON.Color3(0.35, 0.65, 1.0);
  spin2.material = s2Mat;

  scene.onBeforeRenderObservable.add(() => {
    spin1.rotation.y += 0.008;
    spin2.rotation.y -= 0.005;
    outerRing.rotation.y += 0.002;
    innerRing.rotation.y -= 0.003;
  });

  meshes.push(base, outerRing, innerRing, pillar, spin1, spin2);

  // ── 6. 浮动粒子 ──
  const ps = new BABYLON.ParticleSystem('particles', 200, scene);
  const pTex = new BABYLON.DynamicTexture('p-tex', 64, scene, false);
  const ctx = pTex.getContext();
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(200,230,255,0.5)');
  grad.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  pTex.update();
  ps.particleTexture = pTex;
  ps.emitter = new BABYLON.Vector3(0, 2.0, 2);
  ps.minEmitBox = new BABYLON.Vector3(-10, 0.3, -7);
  ps.maxEmitBox = new BABYLON.Vector3(10, 3.5, 10);
  ps.color1 = new BABYLON.Color4(0.5, 0.7, 1.0, 0.15);
  ps.color2 = new BABYLON.Color4(0.3, 0.85, 1.0, 0.10);
  ps.colorDead = new BABYLON.Color4(0.2, 0.5, 0.8, 0);
  ps.minSize = 0.02;
  ps.maxSize = 0.06;
  ps.minLifeTime = 8;
  ps.maxLifeTime = 15;
  ps.emitRate = 15;
  ps.direction1 = new BABYLON.Vector3(-0.01, 0.03, -0.01);
  ps.direction2 = new BABYLON.Vector3(0.01, 0.05, 0.01);
  ps.gravity = new BABYLON.Vector3(0, 0.005, 0);
  ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  ps.start();

  // ── 7. 海报灯架 + 展柜台灯 ──
  const lightBarMat = new BABYLON.PBRMaterial('lightbar-pbr', scene);
  lightBarMat.albedoColor = new BABYLON.Color3(0.75, 0.78, 0.85);
  lightBarMat.metallic = 0.5;
  lightBarMat.roughness = 0.3;
  if (hallInfo.zones.get('poster-zone')?.boards) {
    for (const board of hallInfo.zones.get('poster-zone').boards) {
      const bar = BABYLON.MeshBuilder.CreateBox('poster-lightbar', {
        width: 2.2, height: 0.06, depth: 0.15
      }, scene);
      bar.position = new BABYLON.Vector3(board.position.x, board.position.y + 0.85, board.position.z - 0.1);
      bar.material = lightBarMat;
      meshes.push(bar);
    }
  }

  const lampMat = new BABYLON.StandardMaterial('lamp', scene);
  lampMat.diffuseColor = new BABYLON.Color3(0.9, 0.85, 0.7);
  lampMat.emissiveColor = new BABYLON.Color3(0.5, 0.45, 0.35);
  if (hallInfo.zones.get('doc-zone')?.showcases) {
    for (const sc of hallInfo.zones.get('doc-zone').showcases) {
      const shade = BABYLON.MeshBuilder.CreateCylinder('lamp-shade', {
        diameterTop: 0.12, diameterBottom: 0.3, height: 0.18, tessellation: 12
      }, scene);
      shade.position = new BABYLON.Vector3(sc.position.x, sc.getBoundingInfo().boundingBox.maximumWorld.y + 0.55, sc.position.z);
      shade.material = lampMat;

      const pole = BABYLON.MeshBuilder.CreateCylinder('lamp-pole', {
        diameter: 0.03, height: 0.45, tessellation: 8
      }, scene);
      pole.position = new BABYLON.Vector3(sc.position.x, sc.getBoundingInfo().boundingBox.maximumWorld.y + 0.28, sc.position.z);
      pole.material = lightBarMat;

      meshes.push(shade, pole);
    }
  }

  return meshes;
}
