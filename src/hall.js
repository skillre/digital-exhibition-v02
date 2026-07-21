// src/hall.js — 单间展厅几何体构建
// 一个大房间，海报在北墙，视频在东墙，文档展柜在中间，入口在南

import {
  createFloorMaterial,
  createWallMaterial,
  createMetalMaterial,
  createBoardMaterial,
  createCeilingMaterial,
} from './utils.js';

// ── 房间配置 ──
const ROOM_W = 24;       // 宽度（X 方向）
const ROOM_D = 18;       // 深度（Z 方向）
const WALL_H = 4.0;      // 层高
const WALL_THICK = 0.25;
const HALF_W = ROOM_W / 2;  // ±12
const HALF_D = ROOM_D / 2;  // ±9

/**
 * 构建单间展厅
 * @param {BABYLON.Scene} scene
 * @returns {{ zones: Map, hallMeshes: Mesh[] }}
 */
export function createHall(scene) {
  const zones = new Map();
  const hallMeshes = [];

  // ── 地板 ──
  const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: ROOM_W, height: ROOM_D }, scene);
  floor.material = createFloorMaterial(scene);
  floor.checkCollisions = true;
  floor.receiveShadows = true;
  hallMeshes.push(floor);

  // ── 天花板 ──
  const ceiling = BABYLON.MeshBuilder.CreateGround('ceiling', { width: ROOM_W, height: ROOM_D }, scene);
  ceiling.position.y = WALL_H;
  ceiling.rotation.x = Math.PI;
  ceiling.material = createCeilingMaterial(scene);
  hallMeshes.push(ceiling);

  // ── 四面墙壁 ──
  const wallMat = createWallMaterial(scene, 'room-wall');
  const walls = [
    // 北墙（海报墙）
    { name: 'north', w: ROOM_W, h: WALL_H, pos: [0, WALL_H / 2, HALF_D], rot: 0 },
    // 南墙（入口墙，中间留 4m 门洞）
    { name: 'south', w: ROOM_W, h: WALL_H, pos: [0, WALL_H / 2, -HALF_D], rot: Math.PI },
    // 东墙（视频墙）
    { name: 'east', w: ROOM_D, h: WALL_H, pos: [HALF_W, WALL_H / 2, 0], rot: Math.PI / 2 },
    // 西墙（总结墙）
    { name: 'west', w: ROOM_D, h: WALL_H, pos: [-HALF_W, WALL_H / 2, 0], rot: -Math.PI / 2 },
  ];

  for (const w of walls) {
    const isSouth = w.name === 'south';
    if (isSouth) {
      // 南墙留门洞：左右两段 + 门上横梁
      const doorW = 4;
      const sideLen = (ROOM_W - doorW) / 2;
      for (const side of ['L', 'R']) {
        const seg = BABYLON.MeshBuilder.CreateBox(`wall-south-${side}`, {
          width: sideLen, height: WALL_H, depth: WALL_THICK
        }, scene);
        seg.position = new BABYLON.Vector3(
          side === 'L' ? -HALF_W + sideLen / 2 : HALF_W - sideLen / 2,
          WALL_H / 2, -HALF_D
        );
        seg.material = wallMat;
        seg.checkCollisions = true;
        hallMeshes.push(seg);
      }
      // 门上横梁
      const lintel = BABYLON.MeshBuilder.CreateBox('wall-south-lintel', {
        width: doorW, height: WALL_H - 3.2, depth: WALL_THICK
      }, scene);
      lintel.position = new BABYLON.Vector3(0, 3.2 + (WALL_H - 3.2) / 2, -HALF_D);
      lintel.material = wallMat;
      hallMeshes.push(lintel);
    } else {
      const wall = BABYLON.MeshBuilder.CreateBox(`wall-${w.name}`, {
        width: w.w, height: w.h, depth: WALL_THICK
      }, scene);
      wall.position = new BABYLON.Vector3(...w.pos);
      wall.rotation.y = w.rot;
      wall.material = wallMat;
      wall.checkCollisions = true;
      hallMeshes.push(wall);
    }
  }

  // ── 踢脚线（金属窄条）──
  const baseMat = createMetalMaterial(scene, 'baseboard');
  const bbH = 0.12;
  const bbT = 0.04;
  const baseboards = [
    { len: ROOM_W, pos: [0, bbH / 2, HALF_D - bbT / 2] },
    { len: ROOM_W, pos: [0, bbH / 2, -HALF_D + bbT / 2] },
    { len: ROOM_D, pos: [HALF_W - bbT / 2, bbH / 2, 0], rotY: Math.PI / 2 },
    { len: ROOM_D, pos: [-HALF_W + bbT / 2, bbH / 2, 0], rotY: Math.PI / 2 },
  ];
  for (const bb of baseboards) {
    const m = BABYLON.MeshBuilder.CreateBox('bb', { width: bb.len, height: bbH, depth: bbT }, scene);
    m.position = new BABYLON.Vector3(...bb.pos);
    if (bb.rotY) m.rotation.y = bb.rotY;
    m.material = baseMat;
    hallMeshes.push(m);
  }

  // ── 北墙：海报展板（12 块，上下两排）──
  const boardW = 1.5, boardH_upper = 1.2, boardH_lower = 1.0, boardGap = 0.2;
  const boardsPerRow = 6;
  const totalBoardW = boardsPerRow * boardW + (boardsPerRow - 1) * boardGap;
  const boardStartX = -totalBoardW / 2 + boardW / 2;
  const boards = [];
  for (let row = 0; row < 2; row++) {
    const isUpper = row === 0;
    const bH = isUpper ? boardH_upper : boardH_lower;
    const bY = isUpper ? 2.8 : 1.4;
    for (let i = 0; i < boardsPerRow; i++) {
      const board = BABYLON.MeshBuilder.CreatePlane(`poster-board-${row}-${i}`, {
        width: boardW, height: bH
      }, scene);
      board.position = new BABYLON.Vector3(
        boardStartX + i * (boardW + boardGap),
        bY,
        HALF_D - 0.15
      );
      board.rotation.y = Math.PI;
      board.material = createBoardMaterial(scene, `board-mat-${row}-${i}`);
      board.isPickable = true;
      boards.push(board);
      hallMeshes.push(board);
    }
  }

  // ── 东墙：主视频大屏 ──
  const screenW = 6, screenH = 3.4;
  const screen = BABYLON.MeshBuilder.CreatePlane('video-screen', {
    width: screenW, height: screenH
  }, scene);
  screen.position = new BABYLON.Vector3(HALF_W - 0.15, 2.4, 0);
  screen.rotation.y = Math.PI / 2;
  const screenMat = new BABYLON.PBRMaterial('screen-pbr', scene);
  screenMat.albedoColor = new BABYLON.Color3(0.15, 0.18, 0.28);
  screenMat.metallic = 0.3;
  screenMat.roughness = 0.4;
  screenMat.emissiveColor = new BABYLON.Color3(0.08, 0.10, 0.18);
  screen.material = screenMat;
  screen.isPickable = true;
  hallMeshes.push(screen);

  // 东墙屏幕边框
  const borderMat = createMetalMaterial(scene, 'screen-border', new BABYLON.Color3(0.15, 0.18, 0.25));
  const bw = 0.1;
  [
    { w: screenW + bw * 2, h: bw, x: 0, y: screenH / 2 + bw / 2 },
    { w: screenW + bw * 2, h: bw, x: 0, y: -(screenH / 2 + bw / 2) },
    { w: bw, h: screenH, x: -(screenW / 2 + bw / 2), y: 0 },
    { w: bw, h: screenH, x: screenW / 2 + bw / 2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`screen-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.02);
    b.parent = screen;
    b.material = borderMat;
  });

  // ── 南墙右侧：副视频屏 ──
  const subScreenW = 3.5, subScreenH = 2.0;
  const subScreen = BABYLON.MeshBuilder.CreatePlane('video-screen-sub', {
    width: subScreenW, height: subScreenH
  }, scene);
  subScreen.position = new BABYLON.Vector3(7, 2.2, -HALF_D + 0.15);
  subScreen.rotation.y = 0;
  const subScreenMat = new BABYLON.PBRMaterial('screen-sub-pbr', scene);
  subScreenMat.albedoColor = new BABYLON.Color3(0.15, 0.18, 0.28);
  subScreenMat.metallic = 0.3;
  subScreenMat.roughness = 0.4;
  subScreenMat.emissiveColor = new BABYLON.Color3(0.08, 0.10, 0.18);
  subScreen.material = subScreenMat;
  subScreen.isPickable = true;
  hallMeshes.push(subScreen);

  // 副屏边框
  [
    { w: subScreenW + bw * 2, h: bw, x: 0, y: subScreenH / 2 + bw / 2 },
    { w: subScreenW + bw * 2, h: bw, x: 0, y: -(subScreenH / 2 + bw / 2) },
    { w: bw, h: subScreenH, x: -(subScreenW / 2 + bw / 2), y: 0 },
    { w: bw, h: subScreenH, x: subScreenW / 2 + bw / 2, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`sub-screen-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, -0.02);
    b.parent = subScreen;
    b.material = borderMat;
  });

  // ── 西墙：总结标语牌 ──
  const bannerW = 6, bannerH = 2.0;
  const banner = BABYLON.MeshBuilder.CreatePlane('summary-banner', {
    width: bannerW, height: bannerH
  }, scene);
  banner.position = new BABYLON.Vector3(-HALF_W + 0.15, 2.2, 0);
  banner.rotation.y = -Math.PI / 2;
  const bannerMat = new BABYLON.PBRMaterial('banner-pbr', scene);
  bannerMat.albedoColor = new BABYLON.Color3(0.2, 0.35, 0.6);
  bannerMat.metallic = 0.1;
  bannerMat.roughness = 0.45;
  bannerMat.emissiveColor = new BABYLON.Color3(0.1, 0.25, 0.55);
  banner.material = bannerMat;
  hallMeshes.push(banner);

  // 标语牌发光边框
  const bannerBorderMat = new BABYLON.StandardMaterial('banner-border', scene);
  bannerBorderMat.emissiveColor = new BABYLON.Color3(0, 0.55, 0.95);
  [
    { w: bannerW + 0.16, h: 0.08, x: 0, y: bannerH / 2 + 0.04 },
    { w: bannerW + 0.16, h: 0.08, x: 0, y: -(bannerH / 2 + 0.04) },
    { w: 0.08, h: bannerH, x: -(bannerW / 2 + 0.04), y: 0 },
    { w: 0.08, h: bannerH, x: bannerW / 2 + 0.04, y: 0 },
  ].forEach((s, i) => {
    const b = BABYLON.MeshBuilder.CreatePlane(`banner-border-${i}`, { width: s.w, height: s.h }, scene);
    b.position = new BABYLON.Vector3(s.x, s.y, 0.02);
    b.parent = banner;
    b.material = bannerBorderMat;
  });

  // ── 中央：文档展柜（5 个，一字排开）──
  const showcaseW = 1.2, showcaseH = 1.0, showcaseD = 0.9;
  const showcaseGap = 2.5;
  const showcases = [];
  for (let i = 0; i < 5; i++) {
    const sc = BABYLON.MeshBuilder.CreateBox(`showcase-${i}`, {
      width: showcaseW, height: showcaseH, depth: showcaseD
    }, scene);
    sc.position = new BABYLON.Vector3(
      -showcaseGap * 2 + i * showcaseGap,
      showcaseH / 2,
      -1.5
    );
    const mat = new BABYLON.PBRMaterial(`showcase-pbr-${i}`, scene);
    mat.albedoColor = new BABYLON.Color3(0.72, 0.75, 0.82);
    mat.metallic = 0.3;
    mat.roughness = 0.3;
    mat.environmentIntensity = 0.7;
    sc.material = mat;
    sc.isPickable = true;
    showcases.push(sc);
    hallMeshes.push(sc);

    // 展柜顶部发光面板
    const top = BABYLON.MeshBuilder.CreatePlane(`showcase-top-${i}`, {
      width: showcaseW - 0.2, height: showcaseD - 0.2
    }, scene);
    top.position = new BABYLON.Vector3(0, showcaseH / 2 + 0.01, 0);
    top.rotation.x = -Math.PI / 2;
    top.parent = sc;
    const topMat = new BABYLON.StandardMaterial(`showcase-top-mat-${i}`, scene);
    topMat.diffuseColor = new BABYLON.Color3(0.3, 0.45, 0.7);
    topMat.emissiveColor = new BABYLON.Color3(0.15, 0.28, 0.55);
    top.material = topMat;
  }

  // ── 虚拟展区信息（用于 UI 和拾取）──
  zones.set('poster-zone', {
    id: 'poster-zone', label: '安全知识展板',
    center: new BABYLON.Vector3(0, 0, HALF_D - 2),
    size: { width: ROOM_W, depth: 4 },
    boards,
    entry: new BABYLON.Vector3(0, 1.7, HALF_D - 4),
  });
  zones.set('video-zone', {
    id: 'video-zone', label: '评估成果视频',
    center: new BABYLON.Vector3(HALF_W - 2, 0, 0),
    size: { width: 4, depth: ROOM_D },
    screens: [screen, subScreen],
    entry: new BABYLON.Vector3(HALF_W - 4, 1.7, 0),
  });
  zones.set('doc-zone', {
    id: 'doc-zone', label: '文档资料库',
    center: new BABYLON.Vector3(0, 0, -1.5),
    size: { width: 10, depth: 4 },
    showcases,
    entry: new BABYLON.Vector3(0, 1.7, -4),
  });
  zones.set('entrance', {
    id: 'entrance', label: '入口',
    center: new BABYLON.Vector3(0, 0, -HALF_D + 2),
    size: { width: 6, depth: 4 },
    entry: new BABYLON.Vector3(0, 1.7, -HALF_D + 2),
  });

  // 冻结所有静态 mesh
  hallMeshes.forEach(m => { m.freezeWorldMatrix(); m.isPickable = false; });
  // 展品恢复可点击
  boards.forEach(b => b.isPickable = true);
  screen.isPickable = true;
  subScreen.isPickable = true;
  showcases.forEach(s => s.isPickable = true);

  return { zones, hallMeshes };
}
