let state = { page: 1, size: 20, search: '' };

async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>';
  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.search) params.set('search', state.search);
  try {
    const data = await apiFetch(`/customers?${params}`);
    renderTable(
      tbody,
      [
        { key: 'name', render: r => `<strong>${escHtml(r.name)}</strong>` },
        { key: 'hospital_type', render: r => escHtml(r.hospital_type || '-') },
        { key: 'contact_person', render: r => escHtml(r.contact_person || '-') },
        { key: 'phone', render: r => escHtml(r.phone || '-') },
        { key: 'device_count', render: r => `<span style="font-weight:600">${r.device_count}</span>대` },
        { key: 'created_at', render: r => formatDateShort(r.created_at) },
      ],
      data.items,
      showCustomerPanel
    );
    renderPagination(
      document.getElementById('pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadCustomers(); }
    );
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function showCustomerPanel(customer) {
  const c = await apiFetch(`/customers/${customer.id}`);
  const devicesP = apiFetch(`/customers/${customer.id}/devices`);
  const requestsP = apiFetch(`/customers/${customer.id}/service-requests`);
  const [devices, requests] = await Promise.all([devicesP, requestsP]);

  const html = `
    <div class="detail-grid" style="margin-bottom:20px">
      <div class="detail-field"><label>병원명</label><div class="value">${escHtml(c.name)}</div></div>
      <div class="detail-field"><label>병원 구분</label><div class="value">${escHtml(c.hospital_type || '-')}</div></div>
      <div class="detail-field"><label>담당자</label><div class="value">${escHtml(c.contact_person || '-')}</div></div>
      <div class="detail-field"><label>연락처</label><div class="value">${escHtml(c.phone || '-')}</div></div>
      <div class="detail-field"><label>이메일</label><div class="value">${escHtml(c.email || '-')}</div></div>
      <div class="detail-field full"><label>주소</label><div class="value">${escHtml(c.address || '-')}</div></div>
      ${c.notes ? `<div class="detail-field full"><label>메모</label><div class="value">${escHtml(c.notes)}</div></div>` : ''}
    </div>
    <div class="panel-actions" style="margin-bottom:16px;display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm" onclick="openEditCustomer(${c.id})">✏️ 수정</button>
      <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id}, '${escHtml(c.name)}')">🗑 삭제</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="tab-devices">기기 (${devices.length})</button>
      <button class="tab-btn" data-tab="tab-requests">서비스 요청 (${requests.length})</button>
    </div>
    <div id="tab-devices" class="tab-content active">
      ${devices.length ? `<table><thead><tr><th>모델명</th><th>시리얼</th><th>분류</th><th>상태</th></tr></thead><tbody>
        ${devices.map(d => `<tr><td>${escHtml(d.model_name)}</td><td>${escHtml(d.serial_number)}</td><td>${escHtml(d.device_type||'-')}</td><td>${statusBadge(d.status)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty-state"><p>등록된 기기가 없습니다.</p></div>'}
    </div>
    <div id="tab-requests" class="tab-content">
      ${requests.length ? `<table><thead><tr><th>요청번호</th><th>제목</th><th>상태</th><th>예정일</th></tr></thead><tbody>
        ${requests.map(r => `<tr><td>${escHtml(r.request_number||'-')}</td><td>${escHtml(r.title)}</td><td>${statusBadge(r.status)}</td><td>${formatDateShort(r.scheduled_date)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty-state"><p>서비스 요청이 없습니다.</p></div>'}
    </div>
  `;
  showSidePanel(c.name, html);
  const panel = document.getElementById('side-panel');
  initTabs(panel);
}

function openCreateCustomer() {
  showModal('고객/병원 등록', customerForm(), async () => {
    const data = getCustomerFormData();
    if (!data.name) { showToast('병원명을 입력해주세요.', 'error'); return; }
    await apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) });
    showToast('등록되었습니다.', 'success');
    hideModal();
    loadCustomers();
  });
}

async function openEditCustomer(id) {
  hideSidePanel();
  const c = await apiFetch(`/customers/${id}`);
  showModal('고객/병원 수정', customerForm(c), async () => {
    const data = getCustomerFormData();
    if (!data.name) { showToast('병원명을 입력해주세요.', 'error'); return; }
    await apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('수정되었습니다.', 'success');
    hideModal();
    loadCustomers();
  });
}

function deleteCustomer(id, name) {
  hideSidePanel();
  showConfirm('고객 삭제', `"${name}"을(를) 삭제하시겠습니까?`, async () => {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    loadCustomers();
  });
}

function customerForm(c = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">병원명 <span class="required">*</span></label>
        <input type="text" id="f-name" value="${escHtml(c.name||'')}" placeholder="병원명 입력">
      </div>
      <div class="form-group">
        <label class="form-label">병원 구분</label>
        <select id="f-type">
          <option value="">선택</option>
          ${['상급종합병원','종합병원','병원','의원','요양원','기타'].map(t => `<option ${c.hospital_type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">담당자</label>
        <input type="text" id="f-contact" value="${escHtml(c.contact_person||'')}" placeholder="담당자명">
      </div>
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input type="tel" id="f-phone" value="${escHtml(c.phone||'')}" placeholder="전화번호">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">이메일</label>
      <input type="email" id="f-email" value="${escHtml(c.email||'')}" placeholder="이메일 주소">
    </div>
    <div class="form-group">
      <label class="form-label">주소</label>
      <input type="text" id="f-address" value="${escHtml(c.address||'')}" placeholder="주소 입력">
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea id="f-notes" placeholder="메모">${escHtml(c.notes||'')}</textarea>
    </div>
  `;
}

function getCustomerFormData() {
  return {
    name: document.getElementById('f-name').value.trim(),
    hospital_type: document.getElementById('f-type').value || null,
    contact_person: document.getElementById('f-contact').value.trim() || null,
    phone: document.getElementById('f-phone').value.trim() || null,
    email: document.getElementById('f-email').value.trim() || null,
    address: document.getElementById('f-address').value.trim() || null,
    notes: document.getElementById('f-notes').value.trim() || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  document.getElementById('btn-create').addEventListener('click', openCreateCustomer);
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    loadCustomers();
  }, 400));
});
