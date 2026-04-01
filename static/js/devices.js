let state = { page: 1, size: 20, search: '', status: '', customer_id: '' };
let customers = [];

async function init() {
  customers = (await apiFetch('/customers?size=200')).items;
  populateCustomerFilter();
  loadDevices();
}

function populateCustomerFilter() {
  const sel = document.getElementById('filter-customer');
  if (!sel) return;
  sel.innerHTML = '<option value="">전체 병원</option>' +
    customers.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
}

async function loadDevices() {
  const tbody = document.getElementById('devices-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>';
  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.search) params.set('search', state.search);
  if (state.status) params.set('status', state.status);
  if (state.customer_id) params.set('customer_id', state.customer_id);
  try {
    const data = await apiFetch(`/devices?${params}`);
    renderTable(
      tbody,
      [
        { key: 'model_name', render: r => `<strong>${escHtml(r.model_name)}</strong><br><small style="color:var(--color-gray-400)">${escHtml(r.manufacturer||'')}</small>` },
        { key: 'serial_number', render: r => `<code style="font-size:12px;background:var(--color-gray-100);padding:2px 6px;border-radius:4px">${escHtml(r.serial_number)}</code>` },
        { key: 'device_type', render: r => escHtml(r.device_type || '-') },
        { key: 'customer_name', render: r => escHtml(r.customer_name || '-') },
        { key: 'location', render: r => escHtml(r.location || '-') },
        { key: 'status', render: r => statusBadge(r.status) },
        { key: 'last_service_date', render: r => formatDateShort(r.last_service_date) },
      ],
      data.items,
      showDevicePanel
    );
    renderPagination(
      document.getElementById('pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadDevices(); }
    );
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function showDevicePanel(device) {
  const d = await apiFetch(`/devices/${device.id}`);
  const histories = await apiFetch(`/devices/${device.id}/service-history`);
  const html = `
    <div class="detail-grid" style="margin-bottom:20px">
      <div class="detail-field"><label>모델명</label><div class="value">${escHtml(d.model_name)}</div></div>
      <div class="detail-field"><label>제조사</label><div class="value">${escHtml(d.manufacturer||'-')}</div></div>
      <div class="detail-field"><label>시리얼 번호</label><div class="value"><code>${escHtml(d.serial_number)}</code></div></div>
      <div class="detail-field"><label>기기 분류</label><div class="value">${escHtml(d.device_type||'-')}</div></div>
      <div class="detail-field"><label>상태</label><div class="value">${statusBadge(d.status)}</div></div>
      <div class="detail-field"><label>설치 위치</label><div class="value">${escHtml(d.location||'-')}</div></div>
      <div class="detail-field"><label>병원</label><div class="value">${escHtml(d.customer_name||'-')}</div></div>
      <div class="detail-field"><label>설치일</label><div class="value">${formatDateShort(d.install_date)}</div></div>
      <div class="detail-field"><label>보증 만료일</label><div class="value">${formatDateShort(d.warranty_expiry)}</div></div>
      <div class="detail-field"><label>마지막 서비스</label><div class="value">${formatDateShort(d.last_service_date)}</div></div>
      ${d.notes ? `<div class="detail-field full"><label>메모</label><div class="value">${escHtml(d.notes)}</div></div>` : ''}
    </div>
    <div style="margin-bottom:16px;display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm" onclick="openEditDevice(${d.id})">✏️ 수정</button>
      <button class="btn btn-danger btn-sm" onclick="deleteDevice(${d.id}, '${escHtml(d.model_name)}')">🗑 삭제</button>
    </div>
    <div class="card-title" style="margin-bottom:12px">서비스 이력 (${histories.length}건)</div>
    ${histories.length ? `<table><thead><tr><th>서비스일</th><th>기술자</th><th>유형</th><th>결과</th></tr></thead><tbody>
      ${histories.map(h => `<tr>
        <td>${formatDateShort(h.service_date)}</td>
        <td>${escHtml(h.technician_name||'-')}</td>
        <td>${escHtml(h.service_type||'-')}</td>
        <td>${statusBadge(h.result||'-')}</td>
      </tr>`).join('')}
    </tbody></table>` : '<div class="empty-state"><p>서비스 이력이 없습니다.</p></div>'}
  `;
  showSidePanel(`${d.model_name} (${d.serial_number})`, html);
}

function openCreateDevice() {
  showModal('의료기기 등록', deviceForm(), async () => {
    const data = getDeviceFormData();
    if (!data.model_name || !data.serial_number) { showToast('모델명과 시리얼 번호는 필수입니다.', 'error'); return; }
    await apiFetch('/devices', { method: 'POST', body: JSON.stringify(data) });
    showToast('등록되었습니다.', 'success');
    hideModal();
    loadDevices();
  }, { large: true });
}

async function openEditDevice(id) {
  hideSidePanel();
  const d = await apiFetch(`/devices/${id}`);
  showModal('의료기기 수정', deviceForm(d), async () => {
    const data = getDeviceFormData();
    if (!data.model_name) { showToast('모델명은 필수입니다.', 'error'); return; }
    await apiFetch(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('수정되었습니다.', 'success');
    hideModal();
    loadDevices();
  }, { large: true });
}

function deleteDevice(id, name) {
  hideSidePanel();
  showConfirm('기기 삭제', `"${name}"을(를) 삭제하시겠습니까?`, async () => {
    await apiFetch(`/devices/${id}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    loadDevices();
  });
}

function deviceForm(d = {}) {
  const custOpts = customers.map(c => `<option value="${c.id}" ${d.customer_id==c.id?'selected':''}>${escHtml(c.name)}</option>`).join('');
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">모델명 <span class="required">*</span></label>
        <input type="text" id="f-model" value="${escHtml(d.model_name||'')}" placeholder="모델명">
      </div>
      <div class="form-group">
        <label class="form-label">제조사</label>
        <input type="text" id="f-mfr" value="${escHtml(d.manufacturer||'')}" placeholder="제조사">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">시리얼 번호 <span class="required">*</span></label>
        <input type="text" id="f-serial" value="${escHtml(d.serial_number||'')}" placeholder="시리얼 번호">
      </div>
      <div class="form-group">
        <label class="form-label">기기 분류</label>
        <select id="f-dtype">
          <option value="">선택</option>
          ${['초음파','CT','MRI','X-Ray','혈관조영','내시경','심전도','기타'].map(t => `<option ${d.device_type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">설치 병원</label>
        <select id="f-customer"><option value="">선택</option>${custOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select id="f-status">
          ${['정상','점검중','수리중','폐기'].map(s => `<option ${d.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">설치 위치</label>
      <input type="text" id="f-loc" value="${escHtml(d.location||'')}" placeholder="예: 2층 영상의학과">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">설치일</label>
        <input type="date" id="f-install" value="${formatDateInput(d.install_date)}">
      </div>
      <div class="form-group">
        <label class="form-label">보증 만료일</label>
        <input type="date" id="f-warranty" value="${formatDateInput(d.warranty_expiry)}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea id="f-notes" placeholder="메모">${escHtml(d.notes||'')}</textarea>
    </div>
  `;
}

function getDeviceFormData() {
  return {
    model_name: document.getElementById('f-model').value.trim(),
    manufacturer: document.getElementById('f-mfr').value.trim() || null,
    serial_number: document.getElementById('f-serial').value.trim(),
    device_type: document.getElementById('f-dtype').value || null,
    customer_id: document.getElementById('f-customer').value ? parseInt(document.getElementById('f-customer').value) : null,
    status: document.getElementById('f-status').value || '정상',
    location: document.getElementById('f-loc').value.trim() || null,
    install_date: document.getElementById('f-install').value || null,
    warranty_expiry: document.getElementById('f-warranty').value || null,
    notes: document.getElementById('f-notes').value.trim() || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('btn-create').addEventListener('click', openCreateDevice);

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    loadDevices();
  }, 400));

  document.getElementById('filter-status').addEventListener('change', e => {
    state.status = e.target.value;
    state.page = 1;
    loadDevices();
  });

  document.getElementById('filter-customer').addEventListener('change', e => {
    state.customer_id = e.target.value;
    state.page = 1;
    loadDevices();
  });
});
