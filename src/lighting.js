// src/lighting.js — 展厅灯光系统（适配烘焙模型，降低强度）

export function setupLighting(scene, zones) {

  // ── 环境光（烘焙模型已有基础光照，降低强度）──
  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.35;
  ambient.diffuse = new BABYLON.Color3(0.95, 0.96, 1.0);
  ambient.groundColor = new BABYLON.Color3(0.15, 0.16, 0.22);

  // ── 北墙海报：展板射灯 ──
  const posterZone = zones.get('poster-zone');
  if (posterZone?.boards) {
    for (let i = 0; i < posterZone.boards.length; i++) {
      const board = posterZone.boards[i];
      const spot = new BABYLON.SpotLight(`poster-spot-${i}`,
        new BABYLON.Vector3(board.position.x, board.position.y + 2, board.position.z - 0.8),
        new BABYLON.Vector3(0, -1, 0.3),
        Math.PI / 4, 2, scene
      );
      spot.intensity = 3.0;
      spot.exponent = 3;
      spot.diffuse = new BABYLON.Color3(1.0, 0.92, 0.78);
      spot.range = 6;
    }
  }

  // ── 东墙视频屏：上方灯光 ──
  const videoZone = zones.get('video-zone');
  if (videoZone?.screens?.[0]) {
    const screen = videoZone.screens[0];
    const screenSpot = new BABYLON.SpotLight('screen-spot',
      new BABYLON.Vector3(screen.position.x, screen.position.y + 2, screen.position.z),
      new BABYLON.Vector3(0, -1, 0),
      Math.PI / 3, 1.5, scene
    );
    screenSpot.intensity = 1.0;
    screenSpot.diffuse = new BABYLON.Color3(0.9, 0.93, 1.0);
    screenSpot.range = 10;
  }

  // ── 中央展柜：上方暖光 ──
  const docZone = zones.get('doc-zone');
  if (docZone?.holoScreens) {
    for (let i = 0; i < docZone.holoScreens.length; i++) {
      const hs = docZone.holoScreens[i];
      const pl = new BABYLON.PointLight(`doc-light-${i}`,
        new BABYLON.Vector3(hs.position.x, 3.0, hs.position.z),
        scene
      );
      pl.intensity = 0.8;
      pl.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85);
      pl.range = 5;
    }
  }

  return { ambient };
}
