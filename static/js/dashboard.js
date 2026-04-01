const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

async function loadDashboard() {
  try {
    const [stats, recent, upcoming] = await Promise.all([
      apiFetch('/dashboard/stats'),
      apiFetch('/dashboard/recent-requests'),
      apiFetch('/dashboard/upcoming-services'),
    ]);
    renderStats(stats);
    renderRecentRequests(recent);
    renderUpcoming(upcoming);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderStats(stats) {
  document.getElementById('kpi-total-devices').textContent = stats.total_devices;
  const st = stats.device_status || {};
  document.getElementById('kpi-repair').textContent = (st['수리중'] || 0) + (st['점검중'] || 0);
  document.getElementById('kpi-open').textContent = stats.open_requests;
  document.getElementById('kpi-completed').textContent = stats.completed_this_month;
  document.getElementById('kpi-technicians').textContent = stats.active_technicians;

  // Status bar
  const total = stats.total_devices || 1;
  const normal = st['정상'] || 0;
  const check = st['점검중'] || 0;
  const repair = st['수리중'] || 0;
  const discard = st['폐기'] || 0;

  const bar = document.getElementById('status-bar');
  if (bar) {
    bar.innerHTML = `
      <div class="status-bar-wrap">
        <div class="status-bar-inner">
          <div style="width:${(normal/total*100).toFixed(1)}%;background:var(--color-success)" title="정상: ${normal}"></div>
          <div style="width:${(check/total*100).toFixed(1)}%;background:#eab308" title="점검중: ${check}"></div>
          <div style="width:${(repair/total*100).toFixed(1)}%;background:var(--color-danger)" title="수리중: ${repair}"></div>
          <div style="width:${(discard/total*100).toFixed(1)}%;background:var(--color-gray-300)" title="폐기: ${discard}"></div>
        </div>
        <div class="status-legend">
          <span><i style="background:var(--color-success)"></i>정상 ${normal}</span>
          <span><i style="background:#eab308"></i>점검중 ${check}</span>
          <span><i style="background:var(--color-danger)"></i>수리중 ${repair}</span>
          <span><i style="background:var(--color-gray-300)"></i>폐기 ${discard}</span>
        </div>
      </div>
    `;
  }
}

function renderRecentRequests(items) {
  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--color-gray-400)">데이터가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(r => `
    <tr onclick="location.href='/service-requests'">
      <td><strong>${escHtml(r.request_number || '-')}</strong></td>
      <td>${escHtml(r.device_model || '-')}</td>
      <td>${escHtml(r.customer_name || '-')}</td>
      <td>${escHtml(r.request_type || '-')}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${escHtml(r.technician_name || '미배정')}</td>
    </tr>
  `).join('');
}

function renderUpcoming(items) {
  const el = document.getElementById('upcoming-list');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>예정된 서비스가 없습니다.</p></div>';
    return;
  }
  el.innerHTML = items.map(r => {
    const d = r.scheduled_date ? new Date(r.scheduled_date) : null;
    const month = d ? MONTHS[d.getMonth()] : '';
    const day = d ? d.getDate() : '';
    return `
      <div class="upcoming-item">
        <div class="upcoming-date">
          <div class="ud-month">${month}</div>
          <div class="ud-day">${day}</div>
        </div>
        <div class="upcoming-info">
          <div class="title">${escHtml(r.title)}</div>
          <div class="sub">${escHtml(r.customer_name || '-')} · ${escHtml(r.device_model || '-')} · ${escHtml(r.technician_name || '기술자 미배정')}</div>
        </div>
        ${priorityBadge(r.priority)}
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', loadDashboard);
