// src/decorations.js — 单间展厅装饰系统（充实版）

export function addDecorations(scene, hallInfo) {
  const meshes = [];
  const W = 24, D = 18, H = 4.0;

  // ── 材质 ──
  const colMat = new BABYLON.PBRMaterial('col-pbr', scene);
  colMat.albedoColor = new BABYLON.Color3(0.78, 0.80, 0.85);
  colMat.metallic = 0.25; colMat.roughness = 0.3; colMat.environmentIntensity = 0.8;

  const accentMat = new BABYLON.StandardMaterial('accent', scene);
  accentMat.diffuseColor = new BABYLON.Color3(0.25, 0.4, 0.65);
  accentMat.emissiveColor = new BABYLON.Color3(0.15, 0.5, 0.9);

  const lightBarMat = new BABYLON.PBRMaterial('lightbar-pbr', scene);
  lightBarMat.albedoColor = new BABYLON.Color3(0.75, 0.78, 0.85);
  lightBarMat.metallic = 0.5; lightBarMat.roughness = 0.3;

  const panelMat = new BABYLON.PBRMaterial('wall-panel', scene);
  panelMat.albedoColor = new BABYLON.Color3(0.7, 0.73, 0.80);
  panelMat.metallic = 0.1; panelMat.roughness = 0.5; panelMat.environmentIntensity = 0.5;

  const darkPanelMat = new BABYLON.PBRMaterial('dark-panel', scene);
  darkPanelMat.albedoColor = new BABYLON.Color3(0.15, 0.18, 0.28);
  darkPanelMat.metallic = 0.2; darkPanelMat.roughness = 0.4;

  const benchMat = new BABYLON.PBRMaterial('bench', scene);
  benchMat.albedoColor = new BABYLON.Color3(0.25, 0.22, 0.20);
  benchMat.metallic = 0; benchMat.roughness = 0.7;

  const benchLegMat = new BABYLON.PBRMaterial('bench-leg', scene);
  benchLegMat.albedoColor = new BABYLON.Color3(0.6, 0.62, 0.68);
  benchLegMat.metallic = 0.7; benchLegMat.roughness = 0.3;

  // ═══════════════════════════════════════
  // 1. 立柱（4根）
  // ═══════════════════════════════════════
  const colPos = [[-8, 0, 5], [8, 0, 5], [-8, 0, -3], [8, 0, -3]];
  for (const [x, _, z] of colPos) {
    const col = BABYLON.MeshBuilder.CreateCylinder(`col-${x}-${z}`, { diameter: 0.5, height: H, tessellation: 16 }, scene);
    col.position = new BABYLON.Vector3(x, H / 2, z); col.material = colMat; col.checkCollisions = true;
    const rt = BABYLON.MeshBuilder.CreateTorus(`rt-${x}`, { diameter: 0.7, thickness: 0.06, tessellation: 24 }, scene);
    rt.position = new BABYLON.Vector3(x, H - 0.1, z); rt.material = accentMat;
    const rb = BABYLON.MeshBuilder.CreateTorus(`rb-${x}`, { diameter: 0.72, thickness: 0.06, tessellation: 24 }, scene);
    rb.position = new BABYLON.Vector3(x, 0.1, z); rb.material = accentMat;
    const st = BABYLON.MeshBuilder.CreateCylinder(`st-${x}`, { diameter: 0.54, height: 0.08, tessellation: 16 }, scene);
    st.position = new BABYLON.Vector3(x, H * 0.55, z); st.material = accentMat;
    meshes.push(col, rt, rb, st);
  }

  // ═══════════════════════════════════════
  // 2. 天花板装饰
  // ═══════════════════════════════════════
  const lightMat = new BABYLON.StandardMaterial('ceil-light', scene);
  lightMat.diffuseColor = new BABYLON.Color3(0.92, 0.95, 1.0);
  lightMat.emissiveColor = new BABYLON.Color3(0.7, 0.75, 0.85);

  // 十字灯带
  for (let r = 0; r < 2; r++) {
    const s = BABYLON.MeshBuilder.CreateBox(`cs-${r}`, { width: 0.25, height: 0.04, depth: D * 0.65 }, scene);
    s.position = new BABYLON.Vector3(0, H - 0.01, 0); s.rotation.y = r * Math.PI / 2; s.material = lightMat;
    meshes.push(s);
  }
  // 方形灯框
  const fS = 14;
  [[0, fS / 2, true], [0, -fS / 2, true], [fS / 2, 0, false], [-fS / 2, 0, false]].forEach(([x, z, h], i) => {
    const f = BABYLON.MeshBuilder.CreateBox(`cf-${i}`, { width: h ? fS : 0.2, height: 0.04, depth: h ? 0.2 : fS }, scene);
    f.position = new BABYLON.Vector3(x, H - 0.01, z); f.material = lightMat; meshes.push(f);
  });
  // 嵌入灯盘
  const cpMat = new BABYLON.StandardMaterial('cp', scene);
  cpMat.diffuseColor = new BABYLON.Color3(0.93, 0.95, 1.0); cpMat.emissiveColor = new BABYLON.Color3(0.75, 0.8, 0.9);
  [[-5, 4], [0, 4], [5, 4], [-5, -2], [0, -2], [5, -2], [-5, 8], [5, 8]].forEach(([x, z], i) => {
    const p = BABYLON.MeshBuilder.CreatePlane(`cp-${i}`, { width: 2.0, height: 2.0 }, scene);
    p.position = new BABYLON.Vector3(x, H - 0.005, z); p.rotation.x = Math.PI / 2; p.material = cpMat; meshes.push(p);
  });

  // ═══════════════════════════════════════
  // 3. LED 灯带
  // ═══════════════════════════════════════
  const ledB = new BABYLON.StandardMaterial('led-b', scene); ledB.emissiveColor = new BABYLON.Color3(0.1, 0.6, 1.0);
  const ledC = new BABYLON.StandardMaterial('led-c', scene); ledC.emissiveColor = new BABYLON.Color3(0.1, 0.75, 0.9);
  // 底部
  [{ l: W, p: [0, 0.2, D/2-.02], r: 0 }, { l: W, p: [0, 0.2, -D/2+.02], r: 0 },
   { l: D, p: [W/2-.02, 0.2, 0], r: Math.PI/2 }, { l: D, p: [-W/2+.02, 0.2, 0], r: Math.PI/2 }
  ].forEach((c, i) => {
    const s = BABYLON.MeshBuilder.CreateBox(`led-${i}`, { width: c.l, height: 0.05, depth: 0.03 }, scene);
    s.position = new BABYLON.Vector3(...c.p); s.rotation.y = c.r; s.material = i % 2 ? ledC : ledB; meshes.push(s);
  });
  // 中段
  [{ l: W, p: [0, 2.6, D/2-.02], r: 0 }, { l: W, p: [0, 2.6, -D/2+.02], r: 0 },
   { l: D, p: [W/2-.02, 2.6, 0], r: Math.PI/2 }, { l: D, p: [-W/2+.02, 2.6, 0], r: Math.PI/2 }
  ].forEach((c, i) => {
    const s = BABYLON.MeshBuilder.CreateBox(`ledm-${i}`, { width: c.l, height: 0.04, depth: 0.02 }, scene);
    s.position = new BABYLON.Vector3(...c.p); s.rotation.y = c.r; s.material = ledB; meshes.push(s);
  });

  // ═══════════════════════════════════════
  // 4. 地板网格
  // ═══════════════════════════════════════
  const gridMat = new BABYLON.StandardMaterial('grid', scene);
  gridMat.diffuseColor = new BABYLON.Color3(0.55, 0.6, 0.7); gridMat.emissiveColor = new BABYLON.Color3(0.15, 0.2, 0.3);
  for (let x = -W/2+2; x <= W/2-2; x += 2) {
    const l = BABYLON.MeshBuilder.CreateBox(`gx-${x}`, { width: 0.02, height: 0.005, depth: D-4 }, scene);
    l.position = new BABYLON.Vector3(x, 0.003, 0); l.material = gridMat; meshes.push(l);
  }
  for (let z = -D/2+2; z <= D/2-2; z += 2) {
    const l = BABYLON.MeshBuilder.CreateBox(`gz-${z}`, { width: W-4, height: 0.005, depth: 0.02 }, scene);
    l.position = new BABYLON.Vector3(0, 0.003, z); l.material = gridMat; meshes.push(l);
  }

  // ═══════════════════════════════════════
  // 5. 中央全息装饰
  // ═══════════════════════════════════════
  const holoBaseMat = new BABYLON.StandardMaterial('hb', scene);
  holoBaseMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.5); holoBaseMat.emissiveColor = new BABYLON.Color3(0.12, 0.25, 0.5);
  const base = BABYLON.MeshBuilder.CreateCylinder('hbase', { diameter: 2.5, height: 0.1, tessellation: 32 }, scene);
  base.position = new BABYLON.Vector3(0, 0.05, 2); base.material = holoBaseMat;

  const oRing = BABYLON.MeshBuilder.CreateTorus('hor', { diameter: 3.0, thickness: 0.07, tessellation: 48 }, scene);
  oRing.position = new BABYLON.Vector3(0, 0.01, 2);
  const orM = new BABYLON.StandardMaterial('orm', scene); orM.emissiveColor = new BABYLON.Color3(0.1, 0.65, 1.0); oRing.material = orM;

  const iRing = BABYLON.MeshBuilder.CreateTorus('hir', { diameter: 1.8, thickness: 0.05, tessellation: 48 }, scene);
  iRing.position = new BABYLON.Vector3(0, 0.01, 2);
  const irM = new BABYLON.StandardMaterial('irm', scene); irM.emissiveColor = new BABYLON.Color3(0.1, 0.8, 0.95); iRing.material = irM;

  const pillar = BABYLON.MeshBuilder.CreateCylinder('hp', { diameter: 1.2, height: 2.5, tessellation: 24 }, scene);
  pillar.position = new BABYLON.Vector3(0, 1.25, 2);
  const pM = new BABYLON.StandardMaterial('hpm', scene);
  pM.diffuseColor = new BABYLON.Color3(0.15, 0.45, 0.75); pM.emissiveColor = new BABYLON.Color3(0.1, 0.35, 0.65);
  pM.alpha = 0.25; pM.backFaceCulling = false; pillar.material = pM;

  const s1 = BABYLON.MeshBuilder.CreateTorus('hs1', { diameter: 1.6, thickness: 0.04, tessellation: 48 }, scene);
  s1.position = new BABYLON.Vector3(0, 2.0, 2); s1.rotation.x = Math.PI / 6;
  const s1m = new BABYLON.StandardMaterial('s1m', scene); s1m.emissiveColor = new BABYLON.Color3(0.15, 0.9, 1.0); s1.material = s1m;

  const s2 = BABYLON.MeshBuilder.CreateTorus('hs2', { diameter: 1.9, thickness: 0.03, tessellation: 48 }, scene);
  s2.position = new BABYLON.Vector3(0, 0.8, 2); s2.rotation.x = -Math.PI / 5;
  const s2m = new BABYLON.StandardMaterial('s2m', scene); s2m.emissiveColor = new BABYLON.Color3(0.35, 0.65, 1.0); s2.material = s2m;

  scene.onBeforeRenderObservable.add(() => { s1.rotation.y += 0.008; s2.rotation.y -= 0.005; oRing.rotation.y += 0.002; iRing.rotation.y -= 0.003; });
  meshes.push(base, oRing, iRing, pillar, s1, s2);

  // ═══════════════════════════════════════
  // 6. 墙面装饰板（四面墙都有）
  // ═══════════════════════════════════════
  // 北墙（海报墙两侧）装饰板
  [[-9.5, 2.0, D/2-0.12], [9.5, 2.0, D/2-0.12]].forEach(([x, y, z], i) => {
    const dp = BABYLON.MeshBuilder.CreateBox(`dp-n-${i}`, { width: 3.5, height: 2.5, depth: 0.08 }, scene);
    dp.position = new BABYLON.Vector3(x, y, z); dp.rotation.y = Math.PI; dp.material = panelMat; dp.checkCollisions = true;
    meshes.push(dp);
  });

  // 东墙（视频屏上下）装饰板
  [[W/2-0.12, 1.0, 0], [W/2-0.12, 3.5, 0]].forEach(([x, y, z], i) => {
    const dp = BABYLON.MeshBuilder.CreateBox(`dp-e-${i}`, { width: 0.08, height: 1.2, depth: 5 }, scene);
    dp.position = new BABYLON.Vector3(x, y, z); dp.rotation.y = Math.PI/2; dp.material = panelMat; meshes.push(dp);
  });

  // 西墙（标语牌两侧）装饰板
  [[-W/2+0.12, 2.0, -5], [-W/2+0.12, 2.0, 5]].forEach(([x, y, z], i) => {
    const dp = BABYLON.MeshBuilder.CreateBox(`dp-w-${i}`, { width: 0.08, height: 2.5, depth: 3 }, scene);
    dp.position = new BABYLON.Vector3(x, y, z); dp.rotation.y = -Math.PI/2; dp.material = panelMat; meshes.push(dp);
  });

  // ═══════════════════════════════════════
  // 7. 壁灯（四面墙各2个）
  // ═══════════════════════════════════════
  const wallLightMat = new BABYLON.StandardMaterial('wl', scene);
  wallLightMat.diffuseColor = new BABYLON.Color3(0.9, 0.92, 1.0); wallLightMat.emissiveColor = new BABYLON.Color3(0.7, 0.75, 0.85);
  const wallLightBaseMat = new BABYLON.PBRMaterial('wlb', scene);
  wallLightBaseMat.albedoColor = new BABYLON.Color3(0.7, 0.72, 0.78); wallLightBaseMat.metallic = 0.6; wallLightBaseMat.roughness = 0.3;

  [
    { p: [-5, 3.0, D/2-0.15], r: 0 }, { p: [5, 3.0, D/2-0.15], r: 0 },
    { p: [-5, 3.0, -D/2+0.15], r: Math.PI }, { p: [5, 3.0, -D/2+0.15], r: Math.PI },
    { p: [W/2-0.15, 3.0, -4], r: Math.PI/2 }, { p: [W/2-0.15, 3.0, 4], r: Math.PI/2 },
    { p: [-W/2+0.15, 3.0, -4], r: -Math.PI/2 }, { p: [-W/2+0.15, 3.0, 4], r: -Math.PI/2 },
  ].forEach((cfg, i) => {
    // 壁灯底座
    const lb = BABYLON.MeshBuilder.CreateBox(`wlb-${i}`, { width: 0.4, height: 0.15, depth: 0.1 }, scene);
    lb.position = new BABYLON.Vector3(...cfg.p); lb.rotation.y = cfg.r; lb.material = wallLightBaseMat;
    // 灯罩
    const ls = BABYLON.MeshBuilder.CreateBox(`wls-${i}`, { width: 0.3, height: 0.25, depth: 0.08 }, scene);
    ls.position = new BABYLON.Vector3(cfg.p[0], cfg.p[1] + 0.2, cfg.p[2]); ls.rotation.y = cfg.r; ls.material = wallLightMat;
    meshes.push(lb, ls);
  });

  // ═══════════════════════════════════════
  // 8. 视频区座椅（3排）
  // ═══════════════════════════════════════
  for (let row = 0; row < 3; row++) {
    for (let seat = 0; seat < 3; seat++) {
      const x = 3 + seat * 2.0;
      const z = -2 + row * 2.2;
      // 座面
      const seatMesh = BABYLON.MeshBuilder.CreateBox(`seat-${row}-${seat}`, { width: 1.6, height: 0.08, depth: 0.8 }, scene);
      seatMesh.position = new BABYLON.Vector3(x, 0.55, z); seatMesh.material = benchMat;
      // 靠背
      const back = BABYLON.MeshBuilder.CreateBox(`back-${row}-${seat}`, { width: 1.6, height: 0.6, depth: 0.08 }, scene);
      back.position = new BABYLON.Vector3(x, 0.85, z + 0.35); back.material = benchMat;
      // 椅腿
      [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(([dx, dz], li) => {
        const leg = BABYLON.MeshBuilder.CreateCylinder(`leg-${row}-${seat}-${li}`, { diameter: 0.05, height: 0.5, tessellation: 8 }, scene);
        leg.position = new BABYLON.Vector3(x + dx, 0.25, z + dz); leg.material = benchLegMat;
        meshes.push(leg);
      });
      meshes.push(seatMesh, back);
    }
  }

  // ═══════════════════════════════════════
  // 9. 入口信息亭
  // ═══════════════════════════════════════
  // 信息亭底座
  const kioskBase = BABYLON.MeshBuilder.CreateBox('kiosk-base', { width: 1.2, height: 1.0, depth: 0.6 }, scene);
  kioskBase.position = new BABYLON.Vector3(-4, 0.5, -6); kioskBase.material = darkPanelMat; kioskBase.checkCollisions = true;
  // 信息亭屏幕
  const kioskScreen = BABYLON.MeshBuilder.CreatePlane('kiosk-screen', { width: 1.0, height: 0.7 }, scene);
  kioskScreen.position = new BABYLON.Vector3(-4, 1.2, -6.25); kioskScreen.material = wallLightMat;
  // 信息亭柱子
  const kioskPole = BABYLON.MeshBuilder.CreateCylinder('kiosk-pole', { diameter: 0.08, height: 0.5, tessellation: 8 }, scene);
  kioskPole.position = new BABYLON.Vector3(-4, 0.75, -6); kioskPole.material = benchLegMat;
  meshes.push(kioskBase, kioskScreen, kioskPole);

  // ═══════════════════════════════════════
  // 10. 海报灯架
  // ═══════════════════════════════════════
  if (hallInfo.zones.get('poster-zone')?.boards) {
    for (const board of hallInfo.zones.get('poster-zone').boards) {
      const bar = BABYLON.MeshBuilder.CreateBox('plb', { width: 2.2, height: 0.06, depth: 0.15 }, scene);
      bar.position = new BABYLON.Vector3(board.position.x, board.position.y + 0.85, board.position.z - 0.1);
      bar.material = lightBarMat; meshes.push(bar);
    }
  }

  // ═══════════════════════════════════════
  // 11. 展柜台灯
  // ═══════════════════════════════════════
  const lampMat = new BABYLON.StandardMaterial('lamp', scene);
  lampMat.diffuseColor = new BABYLON.Color3(0.9, 0.85, 0.7); lampMat.emissiveColor = new BABYLON.Color3(0.5, 0.45, 0.35);
  if (hallInfo.zones.get('doc-zone')?.showcases) {
    for (const sc of hallInfo.zones.get('doc-zone').showcases) {
      const shade = BABYLON.MeshBuilder.CreateCylinder('ls', { diameterTop: 0.12, diameterBottom: 0.3, height: 0.18, tessellation: 12 }, scene);
      shade.position = new BABYLON.Vector3(sc.position.x, sc.getBoundingInfo().boundingBox.maximumWorld.y + 0.55, sc.position.z);
      shade.material = lampMat;
      const pole = BABYLON.MeshBuilder.CreateCylinder('lp', { diameter: 0.03, height: 0.45, tessellation: 8 }, scene);
      pole.position = new BABYLON.Vector3(sc.position.x, sc.getBoundingInfo().boundingBox.maximumWorld.y + 0.28, sc.position.z);
      pole.material = lightBarMat;
      meshes.push(shade, pole);
    }
  }

  // ═══════════════════════════════════════
  // 12. 浮动粒子
  // ═══════════════════════════════════════
  const ps = new BABYLON.ParticleSystem('particles', 200, scene);
  const pTex = new BABYLON.DynamicTexture('pt', 64, scene, false);
  const ctx = pTex.getContext();
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.4, 'rgba(200,230,255,0.5)'); grad.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64); pTex.update();
  ps.particleTexture = pTex;
  ps.emitter = new BABYLON.Vector3(0, 2.0, 2);
  ps.minEmitBox = new BABYLON.Vector3(-10, 0.3, -7); ps.maxEmitBox = new BABYLON.Vector3(10, 3.5, 10);
  ps.color1 = new BABYLON.Color4(0.5, 0.7, 1.0, 0.15); ps.color2 = new BABYLON.Color4(0.3, 0.85, 1.0, 0.10);
  ps.colorDead = new BABYLON.Color4(0.2, 0.5, 0.8, 0);
  ps.minSize = 0.02; ps.maxSize = 0.06; ps.minLifeTime = 8; ps.maxLifeTime = 15; ps.emitRate = 15;
  ps.direction1 = new BABYLON.Vector3(-0.01, 0.03, -0.01); ps.direction2 = new BABYLON.Vector3(0.01, 0.05, 0.01);
  ps.gravity = new BABYLON.Vector3(0, 0.005, 0); ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; ps.start();

  return meshes;
}
