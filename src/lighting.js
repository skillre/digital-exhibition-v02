// src/lighting.js — 企业展厅灯光系统（明亮、均匀、专业）

export function setupLighting(scene, zones) {

  // ── 环境光：模拟自然天光 ──
  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 1.2;
  ambient.diffuse = new BABYLON.Color3(1.0, 0.98, 0.95);   // 暖白天光 4000K
  ambient.groundColor = new BABYLON.Color3(0.7, 0.68, 0.65); // 暖色地面反射

  // ── 中央基础照明（均匀分布）──
  const centerPositions = [
    [0, 3.8, 0, 1.8],   // 核心区域
    [0, 3.8, 6, 1.2],   // 北墙区域
    [0, 3.8, -4, 1.2],  // 南墙区域
    [-7, 3.8, 0, 1.2],  // 西侧
    [7, 3.8, 0, 1.2],   // 东侧
  ];
  centerPositions.forEach(([x, y, z, intensity], i) => {
    const pl = new BABYLON.PointLight(`center-${i}`, new BABYLON.Vector3(x, y, z), scene);
    pl.intensity = intensity;
    pl.diffuse = new BABYLON.Color3(1.0, 0.97, 0.93);  // 3500K 暖白
    pl.range = 20;
  });

  // ── 海报展区射灯（重点照明 4000K）──
  const posterZone = zones.get('poster-zone');
  if (posterZone?.boards) {
    for (let i = 0; i < posterZone.boards.length; i++) {
      const board = posterZone.boards[i];
      const spot = new BABYLON.SpotLight(`poster-spot-${i}`,
        new BABYLON.Vector3(board.position.x, 3.6, board.position.z - 1.0),
        new BABYLON.Vector3(0, -0.85, 0.3),
        Math.PI / 4, 2, scene
      );
      spot.intensity = 3.0;
      spot.diffuse = new BABYLON.Color3(1.0, 0.97, 0.93);  // 4000K
      spot.range = 6;
    }
  }

  // ── 视频屏上方灯光（避免反光）──
  const screenSpot = new BABYLON.SpotLight('screen-spot',
    new BABYLON.Vector3(10, 3.6, 0),
    new BABYLON.Vector3(-0.2, -0.85, 0),
    Math.PI / 4, 2, scene
  );
  screenSpot.intensity = 2.0;
  screenSpot.diffuse = new BABYLON.Color3(1.0, 0.97, 0.93);
  screenSpot.range = 8;

  // ── 全息屏上方灯光 ──
  const docZone = zones.get('doc-zone');
  if (docZone?.holoScreens) {
    docZone.holoScreens.forEach((screen, i) => {
      const pl = new BABYLON.PointLight(`doc-light-${i}`,
        new BABYLON.Vector3(screen.position.x, 3.2, screen.position.z),
        scene
      );
      pl.intensity = 1.0;
      pl.diffuse = new BABYLON.Color3(1.0, 0.95, 0.90);  // 暖白
      pl.range = 5;
    });
  }

  // ── 标语牌灯光 ──
  const bannerLight = new BABYLON.PointLight('banner-light',
    new BABYLON.Vector3(-10, 3.2, 0), scene
  );
  bannerLight.intensity = 1.2;
  bannerLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.90);
  bannerLight.range = 8;

  // ── 走廊补充灯光 ──
  const corridorDefs = [
    { name: 'north', pos: [0, 3.5, 6] },
    { name: 'south', pos: [0, 3.5, -6.5] },
    { name: 'west',  pos: [-6.5, 3.5, 0] },
    { name: 'east',  pos: [6.5, 3.5, 0] },
  ];
  for (const cp of corridorDefs) {
    const corridorLight = new BABYLON.PointLight(`corridor-${cp.name}`,
      new BABYLON.Vector3(...cp.pos), scene
    );
    corridorLight.intensity = 0.8;
    corridorLight.diffuse = new BABYLON.Color3(1.0, 0.97, 0.93);
    corridorLight.range = 10;
  }

  return { ambient };
}
