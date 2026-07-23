// src/exhibits.js — 展品创建
// 根据 contents.json 在 3D 场景中创建海报、视频、文档展品

import { loadTexture } from './content-loader.js';
import { createGlowBorder } from './utils.js';

/**
 * 创建所有展品
 * @param {BABYLON.Scene} scene
 * @param {Object} content - 来自 content-loader.js
 * @param {Object} hallInfo - 来自 hall.js
 * @returns {{ posterExhibits, videoExhibits, docExhibits }}
 */
export async function createExhibits(scene, content, hallInfo) {
  const posterExhibits = [];
  const videoExhibits = [];
  const docExhibits = [];

  // ── 海报展品（按 itemId 匹配板子，不依赖顺序，支持稀疏放置）──
  const posterZone = content.getZone('poster-zone');
  if (posterZone && posterZone.items) {
    const zone = hallInfo.zones.get('poster-zone');
    const boards = (zone && zone.boards) || [];
    for (const item of posterZone.items) {
      // 按 contents 里 item.id 找到 hall.js 创建的对应板子
      const board = boards.find(b => b.metadata && b.metadata.itemId === item.id);
      if (!board) {
        console.log(`[海报] 跳过 ${item.id}（尚未在 EXHIBIT_SPOTS 配置位置）`);
        continue;
      }

      try {
        console.log(`[海报] 加载中: ${item.id} → ${item.image}`);
        const tex = await loadTexture(item.image, scene);
        const mat = new BABYLON.PBRMaterial(`poster-pbr-${item.id}`, scene);
        mat.albedoTexture = tex;
        mat.metallic = 0;
        mat.roughness = 0.45;
        mat.emissiveColor = new BABYLON.Color3(0.35, 0.35, 0.40);  // 更亮确保暗环境可见
        mat.environmentIntensity = 0.5;
        board.material = mat;
        createGlowBorder(scene, board, new BABYLON.Color3(0, 0.5, 1.0));
        console.log(`[海报] 加载成功: ${item.id}`);
      } catch (e) {
        console.error(`[海报] 加载失败: ${item.id}`, e.message);
        // 失败时显示红色边框提示
        const errMat = new BABYLON.StandardMaterial(`poster-err-${item.id}`, scene);
        errMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        errMat.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        board.material = errMat;
      }

      // 设置拾取元数据
      board.isPickable = true;
      board.metadata = { type: 'poster', item, itemId: item.id };

      posterExhibits.push({
        id: item.id,
        type: 'poster',
        mesh: board,
        zone: 'poster-zone',
        data: item,
      });
    }
  }

  // ── 视频展品（VideoTexture 在 Phase 5 实现）──
  const videoZone = content.getZone('video-zone');
  if (videoZone && videoZone.items) {
    const zone = hallInfo.zones.get('video-zone');
    if (zone && zone.screens) {
      for (let i = 0; i < videoZone.items.length && i < zone.screens.length; i++) {
        const item = videoZone.items[i];
        const screen = zone.screens[i];

        // 设置拾取元数据（视频播放由 video-player.js 处理）
        screen.isPickable = true;
        screen.metadata = { type: 'video', item, toggle: null };

        videoExhibits.push({
          id: item.id,
          type: 'video',
          mesh: screen,
          zone: 'video-zone',
          data: item,
        });
      }
    }
  }

  // ── 文档展品（全息屏）──
  const docZone = content.getZone('doc-zone');
  if (docZone && docZone.items) {
    const zone = hallInfo.zones.get('doc-zone');
    if (zone && zone.holoScreens) {
      for (let i = 0; i < docZone.items.length && i < zone.holoScreens.length; i++) {
        const item = docZone.items[i];
        const screen = zone.holoScreens[i];

        // 将文档内容作为纹理贴到全息屏上
        try {
          console.log(`[文档] 加载中: ${item.id} → ${item.src}`);
          const tex = new BABYLON.Texture(item.src, scene, false, true, undefined, () => {
            const mat = screen.material.clone(`holo-doc-mat-${item.id}`);
            mat.diffuseTexture = tex;
            mat.emissiveColor = new BABYLON.Color3(0.08, 0.20, 0.35);
            screen.material = mat;
            console.log(`[文档] 加载成功: ${item.id}`);
          }, (_, err) => {
            console.error(`[文档] 加载失败: ${item.id}`, err);
          });
        } catch (e) {
          console.error(`[文档] 加载异常: ${item.id}`, e.message);
        }

        screen.isPickable = true;
        screen.metadata = { type: 'document', item };

        docExhibits.push({
          id: item.id,
          type: 'document',
          mesh: screen,
          zone: 'doc-zone',
          data: item,
        });
      }
    }
  }

  return { posterExhibits, videoExhibits, docExhibits };
}
