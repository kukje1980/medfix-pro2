let state = { page: 1, size: 20, status: '', priority: '', technician_id: '' };
let devices = [], customers = [], technicians = [];

async function init() {
  [devices, customers, technicians] = await Promise.all([
    apiFetch('/devices?size=200').then(r => r.items),
    apiFetch('/customers?size=200').then(r => r.items),
    apiFetch('/technicians').then(r => r.items),
  ]);
  populateFilters();
  loadRequests();
}

function populateFilters() {
  const sel = document.getElementById('filter-technician');
  if (sel) {
    sel.innerHTML = '<option value="">전체 기술자</option>' +
      technicians.filter(t => t.status === '재직중').map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('');
  }
}

async function loadRequests() {
  const tbody = document.getElementById('requests-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>';
  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.status) params.set('status', state.status);
  if (state.priority) params.set('priority', state.priority);
  if (state.technician_id) params.set('technician_id', state.technician_id);
  try {
    const data = await apiFetch(`/service-requests?${params}`);
    renderTable(
      tbody,
      [
        { key: 'request_number', render: r => `<strong>${escHtml(r.request_number||'-')}</strong>` },
        { key: 'title', render: r => escHtml(r.title) },
        { key: 'device_model', render: r => `${escHtml(r.device_model||'-')}<br><small style="color:var(--color-gray-400)">${escHtml(r.device_serial||'')}</small>` },
        { key: 'customer_name', render: r => escHtml(r.customer_name||'-') },
        { key: 'request_type', render: r => escHtml(r.request_type||'-') },
        { key: 'priority', render: r => priorityBadge(r.priority) },
        { key: 'status', render: r => statusBadge(r.status) },
        { key: 'scheduled_date', render: r => formatDateShort(r.scheduled_date) },
      ],
      data.items,
      showRequestPanel
    );
    renderPagination(
      document.getElementById('pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadRequests(); }
    );
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function showRequestPanel(req) {
  const r = await apiFetch(`/service-requests/${req.id}`);
  const canComplete = ['배정', '진행중'].includes(r.status);
  const canDelete = ['접수', '취소'].includes(r.status);

  const html = `
    <div class="detail-grid" style="margin-bottom:20px">
      <div class="detail-field"><label>요청 번호</label><div class="value"><strong>${escHtml(r.request_number||'-')}</strong></div></div>
      <div class="detail-field"><label>상태</label><div class="value">${statusBadge(r.status)}</div></div>
      <div class="detail-field"><label>기기</label><div class="value">${escHtml(r.device_model||'-')}</div></div>
      <div class="detail-field"><label>시리얼</label><div class="value">${escHtml(r.device_serial||'-')}</div></div>
      <div class="detail-field"><label>병원</label><div class="value">${escHtml(r.customer_name||'-')}</div></div>
      <div class="detail-field"><label>요청 유형</label><div class="value">${escHtml(r.request_type||'-')}</div></div>
      <div class="detail-field"><label>우선순위</label><div class="value">${priorityBadge(r.priority)}</div></div>
      <div class="detail-field"><label>담당 기술자</label><div class="value">${escHtml(r.technician_name||'미배정')}</div></div>
      <div class="detail-field"><label>예정일</label><div class="value">${formatDateShort(r.scheduled_date)}</div></div>
      <div class="detail-field"><label>완료일</label><div class="value">${formatDateShort(r.completed_date)}</div></div>
      <div class="detail-field full"><label>요청 내용</label><div class="value">${escHtml(r.description||'-')}</div></div>
    </div>
    <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="openEditRequest(${r.id})">✏️ 수정</button>
      <button class="btn btn-secondary btn-sm" onclick="openAssignTech(${r.id})">👤 기술자 배정</button>
      ${canComplete ? `<button class="btn btn-success btn-sm" onclick="openCompleteRequest(${r.id})">✅ 완료 처리</button>` : ''}
      ${r.status !== '완료' && r.status !== '취소' ? `<button class="btn btn-warning btn-sm" onclick="quickStatus(${r.id}, '진행중')">▶ 진행중</button>` : ''}
      ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteRequest(${r.id})">🗑 삭제</button>` : ''}
    </div>
  `;
  showSidePanel(`요청: ${r.title}`, html);
}

function openCreateRequest() {
  const devOpts = devices.map(d => `<option value="${d.id}" data-cid="${d.customer_id}">${escHtml(d.model_name)} (${escHtml(d.serial_number)})</option>`).join('');
  const techOpts = technicians.filter(t => t.status === '재직중').map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('');
  const html = `
    <div class="form-group">
      <label class="form-label">기기 선택 <span class="required">*</span></label>
      <select id="f-device"><option value="">선택</option>${devOpts}</select>
    </div>
    <div class="form-group" id="customer-display" style="display:none">
      <label class="form-label">병원</label>
      <div id="f-customer-name" style="padding:8px 12px;background:var(--color-gray-50);border-radius:6px;font-size:13.5px;color:var(--color-gray-600)"></div>
      <input type="hidden" id="f-customer-id">
    </div>
    <div class="form-group">
      <label class="form-label">요청 제목 <span class="required">*</span></label>
      <input type="text" id="f-title" placeholder="요청 제목">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">요청 유형</label>
        <select id="f-type">
          ${['정기점검','고장수리','설치','교육','기타'].map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">우선순위</label>
        <select id="f-priority">
          ${['긴급','높음','보통','낮음'].map((p,i) => `<option ${i===2?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">담당 기술자</label>
        <select id="f-tech"><option value="">선택 (나중에 배정)</option>${techOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">예정일</label>
        <input type="date" id="f-date">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">증상 / 요청 내용</label>
      <textarea id="f-desc" placeholder="상세 내용을 입력하세요"></textarea>
    </div>
  `;
  showModal('서비스 요청 접수', html, async () => {
    const deviceId = parseInt(document.getElementById('f-device').value);
    const customerId = parseInt(document.getElementById('f-customer-id').value);
    const title = document.getElementById('f-title').value.trim();
    if (!deviceId || !title) { showToast('기기와 요청 제목은 필수입니다.', 'error'); return; }
    const techVal = document.getElementById('f-tech').value;
    const data = {
      device_id: deviceId,
      customer_id: customerId,
      title,
      request_type: document.getElementById('f-type').value,
      priority: document.getElementById('f-priority').value,
      assigned_technician_id: techVal ? parseInt(techVal) : null,
      scheduled_date: document.getElementById('f-date').value || null,
      description: document.getElementById('f-desc').value.trim() || null,
    };
    await apiFetch('/service-requests', { method: 'POST', body: JSON.stringify(data) });
    showToast('접수되었습니다.', 'success');
    hideModal();
    loadRequests();
  }, { large: true });

  // Auto-fill customer on device select
  document.getElementById('f-device').addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    const cid = opt ? parseInt(opt.dataset.cid) : null;
    const customer = customers.find(c => c.id === cid);
    if (customer) {
      document.getElementById('customer-display').style.display = '';
      document.getElementById('f-customer-name').textContent = customer.name;
      document.getElementById('f-customer-id').value = customer.id;
    } else {
      document.getElementById('customer-display').style.display = 'none';
      document.getElementById('f-customer-id').value = '';
    }
  });
}

async function openEditRequest(id) {
  hideSidePanel();
  const r = await apiFetch(`/service-requests/${id}`);
  const techOpts = technicians.filter(t => t.status === '재직중').map(t =>
    `<option value="${t.id}" ${r.assigned_technician_id===t.id?'selected':''}>${escHtml(t.name)}</option>`).join('');
  const html = `
    <div class="form-group">
      <label class="form-label">요청 제목</label>
      <input type="text" id="f-title" value="${escHtml(r.title)}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">요청 유형</label>
        <select id="f-type">
          ${['정기점검','고장수리','설치','교육','기타'].map(t => `<option ${r.request_type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">우선순위</label>
        <select id="f-priority">
          ${['긴급','높음','보통','낮음'].map(p => `<option ${r.priority===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">담당 기술자</label>
        <select id="f-tech"><option value="">선택</option>${techOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">예정일</label>
        <input type="date" id="f-date" value="${formatDateInput(r.scheduled_date)}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">요청 내용</label>
      <textarea id="f-desc">${escHtml(r.description||'')}</textarea>
    </div>
  `;
  showModal('서비스 요청 수정', html, async () => {
    const techVal = document.getElementById('f-tech').value;
    const data = {
      title: document.getElementById('f-title').value.trim(),
      request_type: document.getElementById('f-type').value,
      priority: document.getElementById('f-priority').value,
      assigned_technician_id: techVal ? parseInt(techVal) : null,
      scheduled_date: document.getElementById('f-date').value || null,
      description: document.getElementById('f-desc').value.trim() || null,
    };
    await apiFetch(`/service-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('수정되었습니다.', 'success');
    hideModal();
    loadRequests();
  });
}

function openAssignTech(id) {
  hideSidePanel();
  const techOpts = technicians.filter(t => t.status === '재직중').map(t =>
    `<option value="${t.id}">${escHtml(t.name)} (${escHtml(t.specialization||'-')})</option>`).join('');
  const html = `
    <div class="form-group">
      <label class="form-label">기술자 선택 <span class="required">*</span></label>
      <select id="f-tech"><option value="">선택</option>${techOpts}</select>
    </div>
  `;
  showModal('기술자 배정', html, async () => {
    const techId = document.getElementById('f-tech').value;
    if (!techId) { showToast('기술자를 선택해주세요.', 'error'); return; }
    await apiFetch(`/service-requests/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ technician_id: parseInt(techId) }) });
    showToast('기술자가 배정되었습니다.', 'success');
    hideModal();
    loadRequests();
  }, { small: true });
}

function openCompleteRequest(id) {
  hideSidePanel();
  const html = `
    <div class="form-group">
      <label class="form-label">수행 작업 내용 <span class="required">*</span></label>
      <textarea id="f-work" placeholder="수행한 작업 내용을 상세히 입력하세요"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">교체 부품</label>
      <input type="text" id="f-parts" placeholder="예: 에어필터 1개, 팬벨트 1개">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">작업 시간 (시간)</label>
        <input type="number" id="f-hours" step="0.5" min="0" placeholder="예: 2.5">
      </div>
      <div class="form-group">
        <label class="form-label">처리 결과</label>
        <select id="f-result">
          ${['정상처리','부품대기','재방문필요','폐기권고'].map(r => `<option>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">다음 점검 예정일</label>
      <input type="date" id="f-next-date">
    </div>
    <div class="form-group">
      <label class="form-label">기술자 메모</label>
      <textarea id="f-notes" placeholder="기타 특이사항"></textarea>
    </div>
  `;
  showModal('서비스 완료 처리', html, async () => {
    const work = document.getElementById('f-work').value.trim();
    if (!work) { showToast('수행 작업 내용을 입력해주세요.', 'error'); return; }
    const data = {
      work_performed: work,
      parts_replaced: document.getElementById('f-parts').value.trim() || null,
      labor_hours: document.getElementById('f-hours').value ? parseFloat(document.getElementById('f-hours').value) : null,
      result: document.getElementById('f-result').value,
      next_service_date: document.getElementById('f-next-date').value || null,
      technician_notes: document.getElementById('f-notes').value.trim() || null,
    };
    await apiFetch(`/service-requests/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });
    showToast('서비스가 완료 처리되었습니다.', 'success');
    hideModal();
    loadRequests();
  }, { large: true, saveLabel: '완료 처리', saveBtnClass: 'btn-success' });
}

async function quickStatus(id, status) {
  hideSidePanel();
  await apiFetch(`/service-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  showToast(`상태가 "${status}"로 변경되었습니다.`, 'success');
  loadRequests();
}

function deleteRequest(id) {
  hideSidePanel();
  showConfirm('요청 삭제', '이 서비스 요청을 삭제하시겠습니까?', async () => {
    await apiFetch(`/service-requests/${id}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    loadRequests();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('btn-create').addEventListener('click', openCreateRequest);
  ['filter-status','filter-priority','filter-technician'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (id === 'filter-status') state.status = el.value;
      if (id === 'filter-priority') state.priority = el.value;
      if (id === 'filter-technician') state.technician_id = el.value;
      state.page = 1;
      loadRequests();
    });
  });
});
