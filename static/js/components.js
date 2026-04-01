// ===== TOAST =====
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '●'}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ===== MODAL =====
let _modalSaveCallback = null;

function showModal(title, bodyHTML, onSave, options = {}) {
  const overlay = document.getElementById('modal-overlay');
  const modal = overlay.querySelector('.modal');
  if (options.large) modal.classList.add('modal-lg'); else modal.classList.remove('modal-lg');
  if (options.small) modal.classList.add('modal-sm'); else modal.classList.remove('modal-sm');
  overlay.querySelector('.modal-title').textContent = title;
  overlay.querySelector('.modal-body').innerHTML = bodyHTML;
  const saveBtn = overlay.querySelector('#modal-save-btn');
  saveBtn.textContent = options.saveLabel || '저장';
  saveBtn.className = `btn ${options.saveBtnClass || 'btn-primary'}`;
  _modalSaveCallback = onSave;
  overlay.classList.add('visible');
  const firstInput = overlay.querySelector('input:not([type=hidden]), select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
  _modalSaveCallback = null;
}

function showConfirm(title, message, onConfirm, options = {}) {
  const bodyHTML = `
    <div class="confirm-icon">${options.icon || '⚠️'}</div>
    <p class="confirm-message">${escHtml(message)}</p>
  `;
  showModal(title, bodyHTML, onConfirm, {
    saveLabel: options.confirmLabel || '확인',
    saveBtnClass: options.saveBtnClass || 'btn-danger',
    small: true,
  });
}

// ===== SIDE PANEL =====
function showSidePanel(title, contentHTML) {
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');
  panel.querySelector('.side-panel-title').textContent = title;
  panel.querySelector('.side-panel-body').innerHTML = contentHTML;
  panel.classList.add('open');
  overlay.classList.add('visible');
}

function hideSidePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('visible');
}

// ===== TABLE RENDERER =====
function renderTable(tbodyEl, columns, rows, onRowClick) {
  if (!rows || rows.length === 0) {
    tbodyEl.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;padding:40px;color:var(--color-gray-400)">데이터가 없습니다.</td></tr>`;
    return;
  }
  tbodyEl.innerHTML = rows.map(row => {
    const cells = columns.map(col => {
      const val = typeof col.render === 'function' ? col.render(row) : escHtml(row[col.key] ?? '-');
      return `<td>${val}</td>`;
    }).join('');
    return `<tr data-id="${row.id}">${cells}</tr>`;
  }).join('');

  if (onRowClick) {
    tbodyEl.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const id = parseInt(tr.dataset.id);
        const row = rows.find(r => r.id === id);
        if (row) onRowClick(row);
      });
    });
  }
}

// ===== PAGINATION =====
function renderPagination(containerEl, total, page, size, pages, onPageChange) {
  const infoEl = containerEl.querySelector('.pagination-info');
  const controlsEl = containerEl.querySelector('.pagination-controls');
  if (infoEl) {
    const start = total === 0 ? 0 : (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    infoEl.textContent = `${start}-${end} / 전체 ${total}건`;
  }
  if (!controlsEl) return;
  const btns = [];
  btns.push(`<button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">‹</button>`);
  const maxBtns = 5;
  let startPage = Math.max(1, page - Math.floor(maxBtns / 2));
  let endPage = Math.min(pages, startPage + maxBtns - 1);
  if (endPage - startPage < maxBtns - 1) startPage = Math.max(1, endPage - maxBtns + 1);
  for (let p = startPage; p <= endPage; p++) {
    btns.push(`<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`);
  }
  btns.push(`<button class="page-btn" ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">›</button>`);
  controlsEl.innerHTML = btns.join('');
  controlsEl.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}

// ===== TABS =====
function initTabs(containerEl) {
  const tabs = containerEl.querySelectorAll('.tab-btn');
  const contents = containerEl.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = containerEl.querySelector(`#${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// ===== INIT MODAL =====
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.querySelector('#modal-save-btn').addEventListener('click', async () => {
      if (_modalSaveCallback) {
        try {
          await _modalSaveCallback();
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
    overlay.querySelector('.modal-close').addEventListener('click', hideModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal();
    });
  }

  const panelOverlay = document.getElementById('panel-overlay');
  if (panelOverlay) {
    panelOverlay.addEventListener('click', hideSidePanel);
  }

  const panelClose = document.querySelector('.side-panel-close');
  if (panelClose) panelClose.addEventListener('click', hideSidePanel);
});
