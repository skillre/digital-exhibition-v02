// src/ui.js — HTML 叠加层 UI 管理
// 文档弹窗、海报弹窗、导航菜单、Pointer Hint

/**
 * 设置 UI 系统
 * @param {Object} content - 来自 content-loader.js
 * @param {Object} exhibits - 来自 exhibits.js
 * @param {Object} cameraCtrl - 来自 camera.js
 * @returns {{ showDocPanel, showPosterPanel, hideOverlay, createNavMenu }}
 */
export function setupUI(content, exhibits, cameraCtrl) {
  const overlayContainer = document.getElementById('overlay-container');

  // ── 文档弹窗 ──
  function showDocPanel(item) {
    const isImage = item.type === 'image';
    const contentHtml = isImage
      ? `<img src="${item.src}" alt="${item.title}" class="poster-large" style="max-height:60vh;" />`
      : `<iframe src="${item.src}" class="doc-iframe" title="${item.title}"></iframe>`;

    overlayContainer.style.display = 'flex';
    overlayContainer.innerHTML = `
      <div class="doc-panel">
        <div class="panel-header">
          <h2>📄 ${item.title}</h2>
          <button class="panel-close" id="panel-close-btn">&times;</button>
        </div>
        <p class="panel-desc">${item.description || ''}</p>
        <div class="doc-content">${contentHtml}</div>
        <a href="${item.src}" download class="doc-download">
          📥 下载文档
        </a>
      </div>
    `;
    bindCloseButton();
    if (cameraCtrl) cameraCtrl.unlock();
  }

  // ── 海报弹窗 ──
  function showPosterPanel(item) {
    overlayContainer.style.display = 'flex';
    overlayContainer.innerHTML = `
      <div class="poster-panel">
        <div class="panel-header">
          <h2>🖼 ${item.title}</h2>
          <button class="panel-close" id="panel-close-btn">&times;</button>
        </div>
        <img src="${item.image}" alt="${item.title}" class="poster-large" />
        <p class="panel-desc">${item.description || ''}</p>
        ${item.notes ? `<div class="panel-notes">${item.notes}</div>` : ''}
      </div>
    `;
    bindCloseButton();
    if (cameraCtrl) cameraCtrl.unlock();
  }

  // ── 关闭弹窗 ──
  function hideOverlay() {
    overlayContainer.style.display = 'none';
    overlayContainer.innerHTML = '';
  }

  // 绑定关闭按钮
  function bindCloseButton() {
    const btn = document.getElementById('panel-close-btn');
    if (btn) {
      btn.addEventListener('click', hideOverlay);
    }
  }

  // ESC 关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayContainer.style.display !== 'none') {
      hideOverlay();
    }
  });

  // ── 导航菜单 ──
  function createNavMenu(hallInfo) {
    const nav = document.getElementById('nav-menu');
    if (!nav) return;

    // 过滤掉入口大厅和总结大厅（不需要跳转）
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
      if (!btn) return;
      const zoneId = btn.dataset.zone;
      if (hallInfo && hallInfo.zones.has(zoneId)) {
        const zone = hallInfo.zones.get(zoneId);
        if (cameraCtrl) {
          cameraCtrl.teleportTo(zone.entry);
          // 短暂显示传送提示
          showToast(`已传送到：${zone.label || zoneId}`);
        }
      }
    });
  }

  // ── 传送提示 ──
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
    const icons = { poster: '🖼', video: '🎬', document: '📄' };
    return icons[type] || '📍';
  }

  return { showDocPanel, showPosterPanel, hideOverlay, createNavMenu };
}
