// src/lighting.js — 展厅灯光系统（烘焙模型专用：极简补光）

export function setupLighting(scene, zones) {

  // ── 仅保留极弱环境光，避免纯黑区域 ──
  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.15;  // 极低强度，让烘焙纹理主导
  ambient.diffuse = new BABYLON.Color3(1, 1, 1);
  ambient.groundColor = new BABYLON.Color3(0.1, 0.1, 0.12);

  // ── 不添加任何射灯/点灯，完全依赖烘焙光照 ──

  return { ambient };
}
