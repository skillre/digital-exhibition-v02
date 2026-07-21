// src/decorations.js — 单间展厅装饰系统

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

  for (let r = 0; r < 2; r++) {
    const s = BABYLON.MeshBuilder.CreateBox(`cs-${r}`, { width: 0.25, height: 0.04, depth: D * 0.65 }, scene);
    s.position = new BABYLON.Vector3(0, H - 0.01, 0); s.rotation.y = r * Math.PI / 2; s.material = lightMat;
    meshes.push(s);
  }
  const fS = 14;
  [[0, fS / 2, true], [0, -fS / 2, true], [fS / 2, 0, false], [-fS / 2, 0, false]].forEach(([x, z, h], i) => {
    const f = BABYLON.MeshBuilder.CreateBox(`cf-${i}`, { width: h ? fS : 0.2, height: 0.04, depth: h ? 0.2 : fS }, scene);
    f.position = new BABYLON.Vector3(x, H - 0.01, z); f.material = lightMat; meshes.push(f);
  });
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
  [{ l: W, p: [0, 0.2, D/2-.02], r: 0 }, { l: W, p: [0, 0.2, -D/2+.02], r: 0 },
   { l: D, p: [W/2-.02, 0.2, 0], r: Math.PI/2 }, { l: D, p: [-W/2+.02, 0.2, 0], r: Math.PI/2 }
  ].forEach((c, i) => {
    const s = BABYLON.MeshBuilder.CreateBox(`led-${i}`, { width: c.l, height: 0.05, depth: 0.03 }, scene);
    s.position = new BABYLON.Vector3(...c.p); s.rotation.y = c.r; s.material = i % 2 ? ledC : ledB; meshes.push(s);
  });
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
  // 6. 海报灯架
  // ═══════════════════════════════════════
  if (hallInfo.zones.get('poster-zone')?.boards) {
    for (const board of hallInfo.zones.get('poster-zone').boards) {
      const bar = BABYLON.MeshBuilder.CreateBox('plb', { width: 2.2, height: 0.06, depth: 0.15 }, scene);
      bar.position = new BABYLON.Vector3(board.position.x, board.position.y + 0.85, board.position.z - 0.1);
      bar.material = lightBarMat; meshes.push(bar);
    }
  }

  // ═══════════════════════════════════════
  // 7. 展柜台灯
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
  // 8. 浮动粒子
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
