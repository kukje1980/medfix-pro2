let state = { page: 1, size: 20, device_id: '', technician_id: '' };
let devices = [], technicians = [];

async function init() {
  [devices, technicians] = await Promise.all([
    apiFetch('/devices?size=200').then(r => r.items),
    apiFetch('/technicians').then(r => r.items),
  ]);
  populateFilters();
  loadHistory();
  loadReport();
}

function populateFilters() {
  const dSel = document.getElementById('filter-device');
  if (dSel) {
    dSel.innerHTML = '<option value="">전체 기기</option>' +
      devices.map(d => `<option value="${d.id}">${escHtml(d.model_name)} (${escHtml(d.serial_number)})</option>`).join('');
  }
  const tSel = document.getElementById('filter-technician');
  if (tSel) {
    tSel.innerHTML = '<option value="">전체 기술자</option>' +
      technicians.map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('');
  }
}

async function loadHistory() {
  const tbody = document.getElementById('history-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>';
  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.device_id) params.set('device_id', state.device_id);
  if (state.technician_id) params.set('technician_id', state.technician_id);
  try {
    const data = await apiFetch(`/service-history?${params}`);
    renderTable(
      tbody,
      [
        { key: 'service_date', render: r => formatDateShort(r.service_date) },
        { key: 'device_model', render: r => `${escHtml(r.device_model||'-')}<br><small style="color:var(--color-gray-400)">${escHtml(r.device_serial||'')}</small>` },
        { key: 'customer_name', render: r => escHtml(r.customer_name||'-') },
        { key: 'technician_name', render: r => escHtml(r.technician_name||'-') },
        { key: 'service_type', render: r => escHtml(r.service_type||'-') },
        { key: 'labor_hours', render: r => r.labor_hours ? `${r.labor_hours}h` : '-' },
        { key: 'result', render: r => statusBadge(r.result||'-') },
      ],
      data.items,
      showHistoryPanel
    );
    renderPagination(
      document.getElementById('pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadHistory(); }
    );
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function showHistoryPanel(hist) {
  const h = await apiFetch(`/service-history/${hist.id}`);
  const html = `
    <div class="detail-grid" style="margin-bottom:20px">
      <div class="detail-field"><label>서비스일</label><div class="value">${formatDate(h.service_date)}</div></div>
      <div class="detail-field"><label>요청 번호</label><div class="value">${escHtml(h.request_number||'-')}</div></div>
      <div class="detail-field"><label>기기</label><div class="value">${escHtml(h.device_model||'-')}</div></div>
      <div class="detail-field"><label>시리얼</label><div class="value">${escHtml(h.device_serial||'-')}</div></div>
      <div class="detail-field"><label>병원</label><div class="value">${escHtml(h.customer_name||'-')}</div></div>
      <div class="detail-field"><label>기술자</label><div class="value">${escHtml(h.technician_name||'-')}</div></div>
      <div class="detail-field"><label>서비스 유형</label><div class="value">${escHtml(h.service_type||'-')}</div></div>
      <div class="detail-field"><label>작업 시간</label><div class="value">${h.labor_hours ? h.labor_hours + '시간' : '-'}</div></div>
      <div class="detail-field"><label>결과</label><div class="value">${statusBadge(h.result||'-')}</div></div>
      <div class="detail-field"><label>다음 점검 예정일</label><div class="value">${formatDate(h.next_service_date)}</div></div>
      <div class="detail-field full"><label>수행 작업 내용</label><div class="value" style="white-space:pre-line">${escHtml(h.work_performed||'-')}</div></div>
      ${h.parts_replaced ? `<div class="detail-field full"><label>교체 부품</label><div class="value">${escHtml(h.parts_replaced)}</div></div>` : ''}
      ${h.technician_notes ? `<div class="detail-field full"><label>기술자 메모</label><div class="value" style="white-space:pre-line">${escHtml(h.technician_notes)}</div></div>` : ''}
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-danger btn-sm" onclick="deleteHistory(${h.id})">🗑 삭제</button>
    </div>
  `;
  showSidePanel('서비스 이력 상세', html);
}

function deleteHistory(id) {
  hideSidePanel();
  showConfirm('이력 삭제', '이 서비스 이력을 삭제하시겠습니까?', async () => {
    await apiFetch(`/service-history/${id}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    loadHistory();
  });
}

async function loadReport() {
  const now = new Date();
  const yearSel = document.getElementById('report-year');
  const monthSel = document.getElementById('report-month');
  if (!yearSel || !monthSel) return;
  yearSel.value = now.getFullYear();
  monthSel.value = now.getMonth() + 1;
  await fetchReport();
}

async function fetchReport() {
  const year = document.getElementById('report-year').value;
  const month = document.getElementById('report-month').value;
  try {
    const data = await apiFetch(`/service-history/report/monthly?year=${year}&month=${month}`);
    renderReport(data);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderReport(data) {
  document.getElementById('report-total').textContent = data.total_count;
  document.getElementById('report-hours').textContent = data.total_hours;

  const techTable = document.getElementById('report-by-tech');
  if (techTable) {
    const tbody = techTable.querySelector('tbody');
    const entries = Object.entries(data.by_technician || {});
    if (entries.length) {
      tbody.innerHTML = entries.map(([name, v]) =>
        `<tr><td>${escHtml(name)}</td><td>${v.count}건</td><td>${v.hours}시간</td></tr>`
      ).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-gray-400)">데이터 없음</td></tr>';
    }
  }

  const typeTable = document.getElementById('report-by-type');
  if (typeTable) {
    const tbody = typeTable.querySelector('tbody');
    const entries = Object.entries(data.by_type || {});
    if (entries.length) {
      tbody.innerHTML = entries.map(([type, count]) =>
        `<tr><td>${escHtml(type)}</td><td>${count}건</td></tr>`
      ).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--color-gray-400)">데이터 없음</td></tr>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  ['filter-device','filter-technician'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (id === 'filter-device') state.device_id = el.value;
      if (id === 'filter-technician') state.technician_id = el.value;
      state.page = 1;
      loadHistory();
    });
  });
  document.getElementById('btn-load-report').addEventListener('click', fetchReport);
});
