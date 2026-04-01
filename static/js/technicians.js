let state = { status: '' };

async function loadTechnicians() {
  const tbody = document.getElementById('technicians-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>';
  const params = new URLSearchParams();
  if (state.status) params.set('status', state.status);
  try {
    const data = await apiFetch(`/technicians?${params}`);
    renderTable(
      tbody,
      [
        { key: 'name', render: r => `<strong>${escHtml(r.name)}</strong>` },
        { key: 'employee_id', render: r => escHtml(r.employee_id || '-') },
        { key: 'phone', render: r => escHtml(r.phone || '-') },
        { key: 'email', render: r => escHtml(r.email || '-') },
        { key: 'specialization', render: r => escHtml(r.specialization || '-') },
        { key: 'status', render: r => statusBadge(r.status) },
      ],
      data.items,
      showTechnicianPanel
    );
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function showTechnicianPanel(tech) {
  const t = await apiFetch(`/technicians/${tech.id}`);
  const [histories, activeRequests] = await Promise.all([
    apiFetch(`/technicians/${tech.id}/service-history`),
    apiFetch(`/technicians/${tech.id}/active-requests`),
  ]);
  const html = `
    <div class="detail-grid" style="margin-bottom:20px">
      <div class="detail-field"><label>이름</label><div class="value">${escHtml(t.name)}</div></div>
      <div class="detail-field"><label>사번</label><div class="value">${escHtml(t.employee_id||'-')}</div></div>
      <div class="detail-field"><label>연락처</label><div class="value">${escHtml(t.phone||'-')}</div></div>
      <div class="detail-field"><label>이메일</label><div class="value">${escHtml(t.email||'-')}</div></div>
      <div class="detail-field"><label>상태</label><div class="value">${statusBadge(t.status)}</div></div>
      <div class="detail-field"><label>전문 분야</label><div class="value">${escHtml(t.specialization||'-')}</div></div>
    </div>
    <div style="margin-bottom:16px;display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm" onclick="openEditTechnician(${t.id})">✏️ 수정</button>
      <button class="btn btn-danger btn-sm" onclick="deleteTechnician(${t.id}, '${escHtml(t.name)}')">🗑 삭제</button>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="tab-active">진행중 요청 (${activeRequests.length})</button>
      <button class="tab-btn" data-tab="tab-hist">서비스 이력 (${histories.length})</button>
    </div>
    <div id="tab-active" class="tab-content active">
      ${activeRequests.length ? `<table><thead><tr><th>요청번호</th><th>기기</th><th>병원</th><th>상태</th></tr></thead><tbody>
        ${activeRequests.map(r => `<tr><td>${escHtml(r.request_number||'-')}</td><td>${escHtml(r.device_model||'-')}</td><td>${escHtml(r.customer_name||'-')}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty-state"><p>진행중인 요청이 없습니다.</p></div>'}
    </div>
    <div id="tab-hist" class="tab-content">
      ${histories.length ? `<table><thead><tr><th>서비스일</th><th>기기</th><th>유형</th><th>결과</th></tr></thead><tbody>
        ${histories.map(h => `<tr><td>${formatDateShort(h.service_date)}</td><td>${escHtml(h.device_model||'-')}</td><td>${escHtml(h.service_type||'-')}</td><td>${statusBadge(h.result||'-')}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty-state"><p>이력이 없습니다.</p></div>'}
    </div>
  `;
  showSidePanel(t.name, html);
  initTabs(document.getElementById('side-panel'));
}

function openCreateTechnician() {
  showModal('기술자 등록', techForm(), async () => {
    const data = getTechFormData();
    if (!data.name) { showToast('이름을 입력해주세요.', 'error'); return; }
    await apiFetch('/technicians', { method: 'POST', body: JSON.stringify(data) });
    showToast('등록되었습니다.', 'success');
    hideModal();
    loadTechnicians();
  });
}

async function openEditTechnician(id) {
  hideSidePanel();
  const t = await apiFetch(`/technicians/${id}`);
  showModal('기술자 수정', techForm(t), async () => {
    const data = getTechFormData();
    if (!data.name) { showToast('이름을 입력해주세요.', 'error'); return; }
    await apiFetch(`/technicians/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('수정되었습니다.', 'success');
    hideModal();
    loadTechnicians();
  });
}

function deleteTechnician(id, name) {
  hideSidePanel();
  showConfirm('기술자 삭제', `"${name}"을(를) 삭제하시겠습니까?`, async () => {
    await apiFetch(`/technicians/${id}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    loadTechnicians();
  });
}

function techForm(t = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 <span class="required">*</span></label>
        <input type="text" id="f-name" value="${escHtml(t.name||'')}" placeholder="기술자 이름">
      </div>
      <div class="form-group">
        <label class="form-label">사번</label>
        <input type="text" id="f-eid" value="${escHtml(t.employee_id||'')}" placeholder="사번">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input type="tel" id="f-phone" value="${escHtml(t.phone||'')}" placeholder="전화번호">
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input type="email" id="f-email" value="${escHtml(t.email||'')}" placeholder="이메일">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">전문 분야</label>
        <input type="text" id="f-spec" value="${escHtml(t.specialization||'')}" placeholder="예: CT, MRI, 초음파">
      </div>
      <div class="form-group">
        <label class="form-label">재직 상태</label>
        <select id="f-status">
          ${['재직중','휴직','퇴직'].map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <textarea id="f-notes" placeholder="메모">${escHtml(t.notes||'')}</textarea>
    </div>
  `;
}

function getTechFormData() {
  return {
    name: document.getElementById('f-name').value.trim(),
    employee_id: document.getElementById('f-eid').value.trim() || null,
    phone: document.getElementById('f-phone').value.trim() || null,
    email: document.getElementById('f-email').value.trim() || null,
    specialization: document.getElementById('f-spec').value.trim() || null,
    status: document.getElementById('f-status').value || '재직중',
    notes: document.getElementById('f-notes').value.trim() || null,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  loadTechnicians();
  document.getElementById('btn-create').addEventListener('click', openCreateTechnician);
  document.getElementById('filter-status').addEventListener('change', e => {
    state.status = e.target.value;
    loadTechnicians();
  });
});
