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

  // ── 海报展品 ──
  const posterZone = content.getZone('poster-zone');
  if (posterZone && posterZone.items) {
    const zone = hallInfo.zones.get('poster-zone');
    if (zone && zone.boards) {
      for (let i = 0; i < posterZone.items.length && i < zone.boards.length; i++) {
        const item = posterZone.items[i];
        const board = zone.boards[i];

        try {
          // 加载海报纹理并替换展板材质
          const tex = await loadTexture(item.image, scene);
          const mat = new BABYLON.PBRMaterial(`poster-pbr-${item.id}`, scene);
          mat.albedoTexture = tex;
          mat.metallic = 0;
          mat.roughness = 0.5;
          mat.emissiveColor = new BABYLON.Color3(0.25, 0.25, 0.30);
          mat.environmentIntensity = 0.4;
          board.material = mat;

          // 添加发光边框
          createGlowBorder(scene, board, new BABYLON.Color3(0, 0.47, 1.0));
        } catch (e) {
          console.warn(`海报加载失败: ${item.id}`, e.message);
        }

        // 设置拾取元数据
        board.isPickable = true;
        board.metadata = { type: 'poster', item };

        posterExhibits.push({
          id: item.id,
          type: 'poster',
          mesh: board,
          zone: 'poster-zone',
          data: item,
        });
      }
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

  // ── 文档展品 ──
  const docZone = content.getZone('doc-zone');
  if (docZone && docZone.items) {
    const zone = hallInfo.zones.get('doc-zone');
    if (zone && zone.showcases) {
      for (let i = 0; i < docZone.items.length && i < zone.showcases.length; i++) {
        const item = docZone.items[i];
        const showcase = zone.showcases[i];

        // 设置拾取元数据
        showcase.isPickable = true;
        showcase.metadata = { type: 'document', item };

        docExhibits.push({
          id: item.id,
          type: 'document',
          mesh: showcase,
          zone: 'doc-zone',
          data: item,
        });
      }
    }
  }

  return { posterExhibits, videoExhibits, docExhibits };
}
