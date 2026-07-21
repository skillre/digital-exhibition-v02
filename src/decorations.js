// src/decorations.js — 企业展厅装饰系统（简约、专业、高端）

export function addDecorations(scene, hallInfo) {
  const meshes = [];
  const W = 24, D = 18, H = 4.0;

  // ── 材质 ──
  // 香槟金拉丝金属（立柱/装饰）
  const colMat = new BABYLON.PBRMaterial('col-pbr', scene);
  colMat.albedoColor = new BABYLON.Color3(0.72, 0.65, 0.52);  // 香槟金
  colMat.metallic = 0.85; colMat.roughness = 0.25; colMat.environmentIntensity = 0.8;

  // 哑光不锈钢（边框/踢脚线）
  const steelMat = new BABYLON.PBRMaterial('steel-pbr', scene);
  steelMat.albedoColor = new BABYLON.Color3(0.75, 0.75, 0.73);
  steelMat.metallic = 0.9; steelMat.roughness = 0.3; steelMat.environmentIntensity = 0.7;

  // 品牌蓝色（Logo/重点墙）
  const brandBlue = new BABYLON.StandardMaterial('brand-blue', scene);
  brandBlue.diffuseColor = new BABYLON.Color3(0.10, 0.32, 0.47);
  brandBlue.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.25);

  // 品牌蓝发光
  const brandGlow = new BABYLON.StandardMaterial('brand-glow', scene);
  brandGlow.emissiveColor = new BABYLON.Color3(0.10, 0.32, 0.47);

  // ═══════════════════════════════════════
  // 1. 立柱（4根，香槟金拉丝金属）
  // ═══════════════════════════════════════
  const colPos = [[-8, 0, 5], [8, 0, 5], [-8, 0, -3], [8, 0, -3]];
  for (const [x, _, z] of colPos) {
    const col = BABYLON.MeshBuilder.CreateCylinder(`col-${x}-${z}`, {
      diameter: 0.45, height: H, tessellation: 20
    }, scene);
    col.position = new BABYLON.Vector3(x, H / 2, z);
    col.material = colMat;
    col.checkCollisions = true;

    // 柱头不锈钢环
    const ringTop = BABYLON.MeshBuilder.CreateTorus(`rt-${x}`, {
      diameter: 0.55, thickness: 0.04, tessellation: 24
    }, scene);
    ringTop.position = new BABYLON.Vector3(x, H - 0.08, z);
    ringTop.material = steelMat;

    // 柱底不锈钢环
    const ringBot = BABYLON.MeshBuilder.CreateTorus(`rb-${x}`, {
      diameter: 0.58, thickness: 0.04, tessellation: 24
    }, scene);
    ringBot.position = new BABYLON.Vector3(x, 0.08, z);
    ringBot.material = steelMat;

    meshes.push(col, ringTop, ringBot);
  }

  // ═══════════════════════════════════════
  // 2. 天花板嵌入式灯盘（均匀分布）
  // ═══════════════════════════════════════
  const lightPanelMat = new BABYLON.StandardMaterial('light-panel', scene);
  lightPanelMat.diffuseColor = new BABYLON.Color3(1.0, 0.98, 0.95);
  lightPanelMat.emissiveColor = new BABYLON.Color3(0.85, 0.83, 0.78);

  // 灯盘布局：5x4 网格
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = -8 + col * 4;
      const z = -6 + row * 4;
      const panel = BABYLON.MeshBuilder.CreatePlane(`light-panel-${row}-${col}`, {
        width: 1.8, height: 1.8
      }, scene);
      panel.position = new BABYLON.Vector3(x, H - 0.005, z);
      panel.rotation.x = Math.PI / 2;
      panel.material = lightPanelMat;
      meshes.push(panel);
    }
  }

  // ═══════════════════════════════════════
  // 3. 品牌 Logo 背光墙（西墙标语牌旁）
  // ═══════════════════════════════════════
  const logoBg = BABYLON.MeshBuilder.CreatePlane('logo-bg', {
    width: 4, height: 2.5
  }, scene);
  logoBg.position = new BABYLON.Vector3(-W/2 + 0.12, 2.2, 5);
  logoBg.rotation.y = -Math.PI / 2;
  logoBg.material = brandBlue;

  // Logo 发光边框
  const logoBorderMat = new BABYLON.StandardMaterial('logo-border', scene);
  logoBorderMat.emissiveColor = new BABYLON.Color3(0.10, 0.32, 0.47);
  const lbw = 0.06;
  [
    { w: 4 + lbw*2, h: lbw, x: 0, y: 1.25 + lbw/2 },
    { w: 4 + lbw*2, h: lbw, x: 0, y: -(1.25 + lbw/2) },
    { w: lbw, h: 2.5, x: -(2 + lbw/2), y: 0 },
    { w: lbw, h: 2.5, x: 2 + lbw/2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`logo-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, 0.01);
    b.parent = logoBg;
    b.material = logoBorderMat;
  });
  meshes.push(logoBg);

  // ═══════════════════════════════════════
  // 4. 墙面装饰面板（简约凹入式）
  // ═══════════════════════════════════════
  const panelMat = new BABYLON.PBRMaterial('wall-panel', scene);
  panelMat.albedoColor = new BABYLON.Color3(0.88, 0.86, 0.82);  // 浅米色面板
  panelMat.metallic = 0; panelMat.roughness = 0.8; panelMat.environmentIntensity = 0.4;

  // 北墙海报两侧装饰板
  [[-9, 2.0, D/2-0.10], [9, 2.0, D/2-0.10]].forEach(([x, y, z], i) => {
    const dp = BABYLON.MeshBuilder.CreateBox(`wall-panel-n-${i}`, {
      width: 3.0, height: 2.5, depth: 0.06
    }, scene);
    dp.position = new BABYLON.Vector3(x, y, z);
    dp.rotation.y = Math.PI;
    dp.material = panelMat;
    meshes.push(dp);
  });

  // 东墙视频屏上下装饰板
  [[W/2-0.10, 1.0, 0], [W/2-0.10, 3.5, 0]].forEach(([x, y, z], i) => {
    const dp = BABYLON.MeshBuilder.CreateBox(`wall-panel-e-${i}`, {
      width: 0.06, height: 1.0, depth: 5
    }, scene);
    dp.position = new BABYLON.Vector3(x, y, z);
    dp.rotation.y = Math.PI/2;
    dp.material = panelMat;
    meshes.push(dp);
  });

  // ═══════════════════════════════════════
  // 5. 导视标识牌（展区名称）
  // ═══════════════════════════════════════
  const signMat = new BABYLON.StandardMaterial('sign-mat', scene);
  signMat.diffuseColor = new BABYLON.Color3(0.95, 0.94, 0.92);
  signMat.emissiveColor = new BABYLON.Color3(0.08, 0.08, 0.08);

  // 北墙展区标识
  const signNorth = BABYLON.MeshBuilder.CreatePlane('sign-poster', {
    width: 3, height: 0.5
  }, scene);
  signNorth.position = new BABYLON.Vector3(0, 3.2, D/2-0.10);
  signNorth.rotation.y = Math.PI;
  signNorth.material = signMat;
  meshes.push(signNorth);

  // 东墙展区标识
  const signEast = BABYLON.MeshBuilder.CreatePlane('sign-video', {
    width: 2, height: 0.5
  }, scene);
  signEast.position = new BABYLON.Vector3(W/2-0.10, 3.2, 0);
  signEast.rotation.y = Math.PI/2;
  signEast.material = signMat;
  meshes.push(signEast);

  // ═══════════════════════════════════════
  // 6. 入口欢迎标识
  // ═══════════════════════════════════════
  const welcomeMat = new BABYLON.StandardMaterial('welcome-mat', scene);
  welcomeMat.diffuseColor = new BABYLON.Color3(0.95, 0.94, 0.92);
  welcomeMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const welcomeSign = BABYLON.MeshBuilder.CreatePlane('welcome-sign', {
    width: 5, height: 1.2
  }, scene);
  welcomeSign.position = new BABYLON.Vector3(0, 2.8, -D/2+0.12);
  welcomeSign.material = welcomeMat;
  meshes.push(welcomeSign);

  // ═══════════════════════════════════════
  // 7. 海报灯架（不锈钢）
  // ═══════════════════════════════════════
  if (hallInfo.zones.get('poster-zone')?.boards) {
    for (const board of hallInfo.zones.get('poster-zone').boards) {
      const bar = BABYLON.MeshBuilder.CreateBox('poster-lightbar', {
        width: 1.6, height: 0.05, depth: 0.12
      }, scene);
      bar.position = new BABYLON.Vector3(
        board.position.x,
        board.position.y + 0.7,
        board.position.z - 0.08
      );
      bar.material = steelMat;
      meshes.push(bar);
    }
  }

  // ═══════════════════════════════════════
  // 8. 全息屏底座（不锈钢环）
  // ═══════════════════════════════════════
  if (hallInfo.zones.get('doc-zone')?.holoScreens) {
    for (const screen of hallInfo.zones.get('doc-zone').holoScreens) {
      const baseRing = BABYLON.MeshBuilder.CreateTorus(`holo-base-ring`, {
        diameter: 1.0, thickness: 0.04, tessellation: 32
      }, scene);
      baseRing.position = new BABYLON.Vector3(screen.position.x, 0.01, screen.position.z);
      baseRing.material = steelMat;
      meshes.push(baseRing);
    }
  }

  return meshes;
}
