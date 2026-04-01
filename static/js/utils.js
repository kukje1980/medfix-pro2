function formatDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateShort(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateInput(val) {
  if (!val) return '';
  return val.split('T')[0];
}

function statusBadge(status) {
  if (!status) return '';
  return `<span class="badge badge-${status}">${status}</span>`;
}

function priorityBadge(priority) {
  if (!priority) return '';
  return `<span class="badge badge-${priority}">${priority}</span>`;
}

function debounce(fn, ms = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMonthName(month) {
  const names = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  return names[(month - 1)] || '';
}

// Update active nav item
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path !== '/' && href !== '/' && path.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // Update top bar date
  const dateEl = document.querySelector('.top-bar-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`;
  }
});
