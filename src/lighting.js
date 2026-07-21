// src/lighting.js — 单间展厅灯光系统

export function setupLighting(scene, zones) {

  // ── 环境光 ──
  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.38;
  ambient.diffuse = new BABYLON.Color3(0.95, 0.96, 1.0);
  ambient.groundColor = new BABYLON.Color3(0.12, 0.13, 0.18);

  // ── 中央大厅多个点光源（均匀照亮整个房间）──
  [[0, 3.5, 0], [0, 3.5, 6], [0, 3.5, -4], [-7, 3.5, 0], [7, 3.5, 0]].forEach(([x, y, z], i) => {
    const pl = new BABYLON.PointLight(`center-${i}`, new BABYLON.Vector3(x, y, z), scene);
    pl.intensity = i === 0 ? 1.6 : 1.0;
    pl.diffuse = new BABYLON.Color3(0.95, 0.96, 1.0);
    pl.range = 18;
  });

  // ── 北墙海报：展板射灯 ──
  const posterZone = zones.get('poster-zone');
  if (posterZone?.boards) {
    for (let i = 0; i < posterZone.boards.length; i++) {
      const board = posterZone.boards[i];
      const spot = new BABYLON.SpotLight(`poster-spot-${i}`,
        new BABYLON.Vector3(board.position.x, 3.7, board.position.z - 0.8),
        new BABYLON.Vector3(0, -1, 0.3),
        Math.PI / 4, 2, scene
      );
      spot.intensity = 4.0;  // 强聚光
      spot.exponent = 3;      // 更聚焦的光束
      spot.diffuse = new BABYLON.Color3(1.0, 0.92, 0.78);  // 3000K 暖白
      spot.range = 6;
    }
  }

  // ── 东墙视频屏：上方灯光（暗一点避免反光）──
  const screenSpot = new BABYLON.SpotLight('screen-spot',
    new BABYLON.Vector3(10, 3.6, 0),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI / 3, 1.5, scene
  );
  screenSpot.intensity = 1.2;
  screenSpot.diffuse = new BABYLON.Color3(0.96, 0.97, 1.0);
  screenSpot.diffuse = new BABYLON.Color3(0.9, 0.93, 1.0);
  screenSpot.range = 10;

  // ── 中央展柜：上方暖光 ──
  const docZone = zones.get('doc-zone');
  if (docZone?.showcases) {
    for (let i = 0; i < docZone.showcases.length; i++) {
      const sc = docZone.showcases[i];
      const pl = new BABYLON.PointLight(`doc-light-${i}`,
        new BABYLON.Vector3(sc.position.x, 3.0, sc.position.z),
        scene
      );
      pl.intensity = 1.2;
      pl.diffuse = new BABYLON.Color3(1.0, 0.97, 0.92);
      pl.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
      pl.range = 5;
    }
  }

  // ── 西墙标语牌：暖光 ──
  const bannerLight = new BABYLON.PointLight('banner-light',
    new BABYLON.Vector3(-10, 3.0, 0), scene
  );
  bannerLight.intensity = 1.6;
  bannerLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.88);
  bannerLight.diffuse = new BABYLON.Color3(1.0, 0.92, 0.75);
  bannerLight.range = 8;

  return { ambient };
}
