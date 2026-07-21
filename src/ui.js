// src/ui.js — 焦点交互系统：十字准星 + 高亮 + 详情面板

/**
 * 设置 UI 系统
 * @param {Object} content - 来自 content-loader.js
 * @param {Object} exhibits - 来自 exhibits.js
 * @param {Object} cameraCtrl - 来自 camera.js
 * @returns {{ setupCrosshair, showDetail, hideDetail, createNavMenu }}
 */
export function setupUI(content, exhibits, cameraCtrl) {
  const crosshair = document.getElementById('crosshair');
  const crosshairHint = document.getElementById('crosshair-hint');
  const detailPanel = document.getElementById('detail-panel');
  const detailBody = document.getElementById('detail-body');
  const detailClose = document.getElementById('detail-close');

  let currentHighlight = null;
  let highlightOriginalEmissive = null;
  let hitExhibit = null;  // 存储准星命中的展品

  // ═══════════════════════════════════════
  // 十字准星系统
  // ═══════════════════════════════════════

  function setupCrosshair(scene) {
    // 监听 Pointer Lock 状态
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === document.getElementById('renderCanvas');
      if (crosshair) crosshair.style.display = isLocked ? 'block' : 'none';
      if (!isLocked && crosshairHint) crosshairHint.style.display = 'none';
    });

    // 每帧 raycast 检测准星对准的展品
    scene.onBeforeRenderObservable.add(() => {
      if (!document.pointerLockElement) return;
      if (detailPanel.style.display !== 'none') return;

      // 从相机中心发射射线
      const ray = scene.createPickingRay(
        scene.getEngine().getRenderWidth() / 2,
        scene.getEngine().getRenderHeight() / 2,
        BABYLON.Matrix.Identity(),
        scene.activeCamera
      );

      const hit = scene.pickWithRay(ray, (mesh) => {
        return mesh.isPickable && mesh.metadata;
      });

      if (hit.hit && hit.pickedMesh) {
        const mesh = hit.pickedMesh;
        const meta = mesh.metadata;

        // 存储命中结果供点击使用
        hitExhibit = meta;

        // 高亮效果
        if (currentHighlight !== mesh) {
          clearHighlight(scene);
          currentHighlight = mesh;
          highlightOriginalEmissive = mesh.material?.emissiveColor?.clone();
          applyHighlight(mesh);
        }

        // 准星提示文字
        if (crosshairHint) {
          crosshairHint.style.display = 'block';
          if (meta.type === 'poster') {
            crosshairHint.textContent = '点击查看海报';
          } else if (meta.type === 'video') {
            crosshairHint.textContent = '点击播放视频';
          } else if (meta.type === 'document') {
            crosshairHint.textContent = '点击查看文档';
          }
        }
      } else {
        hitExhibit = null;
        clearHighlight(scene);
        if (crosshairHint) crosshairHint.style.display = 'none';
      }
    });

    // 点击交互：使用准星 raycast 已存储的命中结果
    scene.onPointerDown = (evt) => {
      if (!document.pointerLockElement) return;
      if (detailPanel.style.display !== 'none') return;
      if (!hitExhibit || !hitExhibit.item) return;

      const meta = hitExhibit;
      if (meta.type === 'poster') {
        showPosterDetail(meta.item);
      } else if (meta.type === 'video') {
        showVideoDetail(meta.item);
      } else if (meta.type === 'document') {
        showDocDetail(meta.item);
      }
    };
  }

  function applyHighlight(mesh) {
    if (!mesh.material) return;
    // 保存原始 emissive 并设置高亮
    if (mesh.material.emissiveColor) {
      mesh.material.emissiveColor = new BABYLON.Color3(0.15, 0.5, 0.9);
    }
  }

  function clearHighlight(scene) {
    if (currentHighlight && highlightOriginalEmissive) {
      if (currentHighlight.material) {
        currentHighlight.material.emissiveColor = highlightOriginalEmissive;
      }
    }
    currentHighlight = null;
    highlightOriginalEmissive = null;
  }

  // ═══════════════════════════════════════
  // 详情面板
  // ═══════════════════════════════════════

  function showPosterDetail(item) {
    detailBody.innerHTML = `
      <h2 class="detail-title">🖼 ${item.title || '海报'}</h2>
      <img src="${item.image}" alt="${item.title}" class="detail-image" />
      ${item.description ? `<p class="detail-desc">${item.description}</p>` : ''}
      ${item.notes ? `<div class="detail-notes">${item.notes}</div>` : ''}
    `;
    showPanel();
  }

  function showVideoDetail(item) {
    detailBody.innerHTML = `
      <h2 class="detail-title">🎬 ${item.title || '视频'}</h2>
      <video class="detail-video" controls autoplay>
        <source src="${item.src}" type="video/mp4">
        您的浏览器不支持视频播放
      </video>
      ${item.description ? `<p class="detail-desc">${item.description}</p>` : ''}
    `;
    showPanel();
  }

  function showDocDetail(item) {
    const isImage = item.type === 'image';
    const contentHtml = isImage
      ? `<img src="${item.src}" alt="${item.title}" class="detail-image" />`
      : `<iframe src="${item.src}" class="detail-pdf" title="${item.title}"></iframe>`;

    detailBody.innerHTML = `
      <h2 class="detail-title">📄 ${item.title || '文档'}</h2>
      ${contentHtml}
      ${item.description ? `<p class="detail-desc">${item.description}</p>` : ''}
      <a href="${item.src}" download class="detail-download">📥 下载文档</a>
    `;
    showPanel();
  }

  function showPanel() {
    detailPanel.style.display = 'flex';
    // 退出 Pointer Lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function hideDetail() {
    detailPanel.style.display = 'none';
    detailBody.innerHTML = '';
    // 停止视频播放
    const video = detailBody.querySelector('video');
    if (video) video.pause();
  }

  // 关闭按钮
  if (detailClose) {
    detailClose.addEventListener('click', hideDetail);
  }

  // 点击遮罩关闭
  const overlay = detailPanel?.querySelector('.detail-overlay');
  if (overlay) {
    overlay.addEventListener('click', hideDetail);
  }

  // Q 键关闭
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'q' || e.key === 'Q') && detailPanel.style.display !== 'none') {
      hideDetail();
    }
  });

  // ═══════════════════════════════════════
  // 导航菜单
  // ═══════════════════════════════════════

  function createNavMenu(hallInfo) {
    const nav = document.getElementById('nav-menu');
    if (!nav || !content) return;

    const navZones = content.zones.filter(z =>
      z.type === 'poster' || z.type === 'video' || z.type === 'document'
    );

    nav.style.display = 'flex';
    nav.innerHTML = `
      <div class="nav-menu-title">📍 展区导航</div>
      ${navZones.map(z => `
        <button class="nav-btn" data-zone="${z.id}">${getZoneIcon(z.type)} ${z.name}</button>
      `).join('')}
      <button class="nav-btn" data-zone="entrance" style="margin-top:6px;border-color:rgba(0,229,255,0.3);">
        🏠 回到入口
      </button>
    `;

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn || !hallInfo) return;
      const zoneId = btn.dataset.zone;
      if (hallInfo.zones.has(zoneId)) {
        const zone = hallInfo.zones.get(zoneId);
        if (cameraCtrl) {
          cameraCtrl.teleportTo(zone.entry);
          showToast(`已传送到：${zone.label || zoneId}`);
        }
      }
    });
  }

  function showToast(message) {
    const existing = document.getElementById('toast-message');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.className = 'pointer-hint';
    toast.textContent = message;
    toast.style.bottom = '60px';
    toast.style.opacity = '1';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  function getZoneIcon(type) {
    return { poster: '🖼', video: '🎬', document: '📄' }[type] || '📍';
  }

  return { setupCrosshair, showDetail: showPosterDetail, hideDetail, createNavMenu };
}
