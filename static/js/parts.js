// ===== STATE =====
const state = {
  page: 1,
  size: 50,
  search: '',
  company: '',
  category: '',
  model: '',
  selectedPartId: null,
};

// ===== INIT =====
async function init() {
  await loadTree();
  loadParts();

  document.getElementById('parts-search').addEventListener('input', debounce(e => {
    state.search = e.target.value.trim();
    state.page = 1;
    loadParts();
  }, 400));

  document.getElementById('btn-create-part').addEventListener('click', openCreatePart);

  document.getElementById('btn-collapse-all').addEventListener('click', () => {
    document.querySelectorAll('.tree-cats, .tree-models').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.tree-toggle').forEach(el => el.textContent = '▶');
  });

  document.getElementById('btn-seed-upload').addEventListener('click', openSeedUpload);
  document.getElementById('seed-file-input').addEventListener('change', handleSeedFile);
}

// ===== TREE =====
async function loadTree() {
  const treeBody = document.getElementById('tree-body');
  try {
    const tree = await apiFetch('/parts/tree');
    if (!tree || tree.length === 0) {
      treeBody.innerHTML = `<div style="padding:20px;text-align:center;color:var(--color-gray-400);font-size:12px">등록된 부품이 없습니다</div>`;
      return;
    }
    treeBody.innerHTML = tree.map(company => buildCompanyNode(company)).join('');
    bindTreeEvents();
  } catch (e) {
    treeBody.innerHTML = `<div style="padding:20px;text-align:center;color:var(--color-danger);font-size:12px">트리 로드 실패</div>`;
  }
}

function buildCompanyNode(company) {
  const catsHtml = company.categories.map(cat => {
    const modelsHtml = cat.models.map(m => `
      <div class="tree-model-item" data-company="${escHtml(company.company)}" data-category="${escHtml(cat.category)}" data-model="${escHtml(m.model)}">
        <span style="color:var(--color-gray-300);font-size:10px">■</span>
        <span>${escHtml(m.model)}</span>
        <span class="tree-count ${m.count > 0 ? 'has-deals' : ''}">${m.count}</span>
      </div>`).join('');
    return `
      <div class="tree-cat">
        <div class="tree-cat-header" data-company="${escHtml(company.company)}" data-category="${escHtml(cat.category)}">
          <span class="tree-toggle">▶</span>
          <span>${escHtml(cat.category)}</span>
          <span class="tree-count">${cat.count}</span>
        </div>
        <div class="tree-models">${modelsHtml}</div>
      </div>`;
  }).join('');

  return `
    <div class="tree-company">
      <div class="tree-company-header" data-company="${escHtml(company.company)}">
        <span class="tree-toggle">▶</span>
        <span>${escHtml(company.company)}</span>
        <span class="tree-count ${company.count > 0 ? 'has-deals' : ''}">${company.count}</span>
      </div>
      <div class="tree-cats">${catsHtml}</div>
    </div>`;
}

function bindTreeEvents() {
  // Company click
  document.querySelectorAll('.tree-company-header').forEach(el => {
    el.addEventListener('click', () => {
      const cats = el.nextElementSibling;
      const tog = el.querySelector('.tree-toggle');
      const isOpen = cats.classList.toggle('open');
      tog.textContent = isOpen ? '▼' : '▶';

      clearActiveTree();
      el.classList.add('active');
      state.company = el.dataset.company;
      state.category = '';
      state.model = '';
      state.page = 1;
      updateBreadcrumb();
      loadParts();
    });
  });

  // Category click
  document.querySelectorAll('.tree-cat-header').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const models = el.nextElementSibling;
      const tog = el.querySelector('.tree-toggle');
      const isOpen = models.classList.toggle('open');
      tog.textContent = isOpen ? '▼' : '▶';

      clearActiveTree();
      el.classList.add('active');
      state.company = el.dataset.company;
      state.category = el.dataset.category;
      state.model = '';
      state.page = 1;
      updateBreadcrumb();
      loadParts();
    });
  });

  // Model click
  document.querySelectorAll('.tree-model-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      clearActiveTree();
      el.classList.add('active');
      state.company = el.dataset.company;
      state.category = el.dataset.category;
      state.model = el.dataset.model;
      state.page = 1;
      updateBreadcrumb();
      loadParts();
    });
  });
}

function clearActiveTree() {
  document.querySelectorAll('.tree-company-header, .tree-cat-header, .tree-model-item').forEach(el => el.classList.remove('active'));
}

function updateBreadcrumb() {
  const el = document.getElementById('parts-breadcrumb');
  const parts = [state.company, state.category, state.model].filter(Boolean);
  el.textContent = parts.length ? parts.join(' > ') : '전체 부품';
}

// ===== PARTS TABLE =====
async function loadParts() {
  const tbody = document.getElementById('parts-tbody');
  tbody.innerHTML = `<tr><td colspan="7" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>`;
  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.search) params.set('search', state.search);
  if (state.company) params.set('company', state.company);
  if (state.category) params.set('category', state.category);
  if (state.model) params.set('model', state.model);
  try {
    const data = await apiFetch(`/parts?${params}`);
    renderPartsTable(tbody, data.items);
    renderPagination(
      document.getElementById('parts-pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadParts(); }
    );
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-danger)">${escHtml(e.message)}</td></tr>`;
  }
}

function renderPartsTable(tbody, items) {
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--color-gray-400)">부품이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(p => `
    <tr data-id="${p.id}">
      <td><code style="font-size:12px;background:var(--color-gray-100);padding:2px 6px;border-radius:4px">${escHtml(p.part_code)}</code></td>
      <td><strong>${escHtml(p.part_name)}</strong></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--color-gray-500);font-size:12px">${escHtml(p.symptom || '-')}</td>
      <td style="text-align:right;font-size:12px">${fmtPrice(p.cost_avg)}</td>
      <td style="text-align:right;font-size:12px">${fmtPrice(p.local_price)}</td>
      <td style="text-align:right;font-size:12px">${fmtPrice(p.univ_price)}</td>
      <td style="text-align:right">
        ${p.deal_count > 0 ? `<span class="badge" style="background:#fef9c3;color:#92400e">${p.deal_count}건</span>` : '<span style="color:var(--color-gray-400);font-size:12px">-</span>'}
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const id = parseInt(tr.dataset.id);
      const part = items.find(p => p.id === id);
      if (part) showPartDetail(part);
    });
  });
}

function fmtPrice(val) {
  if (val == null) return '<span style="color:var(--color-gray-400)">-</span>';
  return Number(val).toLocaleString('ko-KR') + '원';
}

// ===== PART DETAIL PANEL =====
async function showPartDetail(part) {
  state.selectedPartId = part.id;
  const deals = await apiFetch(`/parts/${part.id}/deals`);
  renderDetailPanel(part, deals);
}

function renderDetailPanel(part, deals) {
  const fw = v => v == null ? '<span style="color:var(--color-gray-400)">-</span>' : Number(v).toLocaleString('ko-KR') + '원';

  let h = `<div class="pip">
    <div class="pip-header">
      <div>
        <h3><code style="font-size:12px;background:var(--color-gray-100);padding:2px 6px;border-radius:4px;font-weight:600">${escHtml(part.part_code)}</code> &nbsp;${escHtml(part.part_name)}</h3>
        <div class="pip-sub">${escHtml(part.company)} › ${escHtml(part.category)} › ${escHtml(part.model)}</div>
      </div>
      <div class="pip-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditPart(${part.id})">✏️ 수정</button>
        <button class="btn btn-danger btn-sm" onclick="deletePart(${part.id}, '${escHtml(part.part_name).replace(/'/g, "\\'")}')">🗑 삭제</button>
        <button class="btn btn-sm" onclick="document.getElementById('part-detail-inline').style.display='none'" style="padding:4px 10px;font-size:14px;line-height:1">×</button>
      </div>
    </div>`;

  if (part.symptom) {
    h += `<div class="pip-symptom">
      <strong>⚠ ${escHtml(part.symptom)}</strong>
      ${part.symptom_detail ? `<div style="margin-top:4px">${escHtml(part.symptom_detail)}</div>` : ''}
      ${part.symptom_location ? `<div style="margin-top:3px;font-size:11px">📍 ${escHtml(part.symptom_location)}</div>` : ''}
    </div>`;
  }

  h += `<div class="pip-prices">
    <div class="pip-card"><label>원가</label><div class="pv">${fw(part.cost_avg)}</div></div>
    <div class="pip-card"><label>로컬가</label><div class="pv blue">${fw(part.local_price)}</div></div>
    <div class="pip-card"><label>대학가</label><div class="pv blue">${fw(part.univ_price)}</div></div>
    <div class="pip-card"><label>평균단가</label><div class="pv amber">${fw(part.avg_price)}</div></div>
    <div class="pip-card"><label>최저납품가</label><div class="pv">${fw(part.min_price)}</div></div>
    <div class="pip-card"><label>최고납품가</label><div class="pv">${fw(part.max_price)}</div></div>
  </div>`;

  h += `<div class="pip-deals">
    <div class="pip-deals-header">
      <h4>📋 납품 내역 (${deals.length}건)</h4>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="text" id="deal-hospital-filter" class="search-input" style="width:180px" placeholder="🔍 병원명 검색..." oninput="filterDeals(${part.id})">
        <button class="btn btn-secondary btn-sm" onclick="openAddDeal(${part.id})">+ 납품 등록</button>
      </div>
    </div>
    <div id="deals-table-wrap">${renderDealsTable(deals)}</div>
  </div>`;

  h += `</div>`;

  const panel = document.getElementById('part-detail-inline');
  panel.style.display = 'block';
  panel.innerHTML = h;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDealsTable(deals) {
  if (!deals || deals.length === 0) {
    return `<div style="text-align:center;padding:20px;color:var(--color-gray-400);font-size:12px">납품 내역이 없습니다.</div>`;
  }
  return `<table class="pip-dt">
    <thead>
      <tr>
        <th>병원/거래처</th>
        <th>납품일</th>
        <th class="r">수량</th>
        <th class="r">납품단가</th>
        <th class="r">실원가</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${deals.map(d => `
      <tr>
        <td>${escHtml(d.hospital || '-')}</td>
        <td>${formatDateShort(d.deal_date)}</td>
        <td class="r">${d.quantity || 1}</td>
        <td class="r" style="font-weight:600;color:var(--color-primary)">${fmtPrice(d.deal_price)}</td>
        <td class="r">${fmtPrice(d.cost_price)}</td>
        <td><button class="btn btn-sm btn-danger" style="padding:2px 7px;font-size:11px" onclick="deleteDeal(${d.id}, ${d.part_id})">삭제</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

async function filterDeals(partId) {
  const hospital = document.getElementById('deal-hospital-filter')?.value.trim() || '';
  const params = hospital ? `?hospital=${encodeURIComponent(hospital)}` : '';
  const deals = await apiFetch(`/parts/${partId}/deals${params}`);
  const wrap = document.getElementById('deals-table-wrap');
  if (wrap) wrap.innerHTML = renderDealsTable(deals);
}

async function deleteDeal(dealId, partId) {
  if (!confirm('이 납품 내역을 삭제하시겠습니까?')) return;
  try {
    await apiFetch(`/parts/deals/${dealId}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    const part = await apiFetch(`/parts/${partId}`);
    const deals = await apiFetch(`/parts/${partId}/deals`);
    renderDetailPanel(part, deals);
    loadTree();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ===== ADD DEAL MODAL =====
function openAddDeal(partId) {
  showModal('납품 내역 등록', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">납품일 <span class="required">*</span></label>
        <input type="date" id="d-date" value="${new Date().toISOString().slice(0,10)}">
      </div>
      <div class="form-group">
        <label class="form-label">수량</label>
        <input type="number" id="d-qty" value="1" min="1">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">병원명</label>
      <input type="text" id="d-hospital" placeholder="납품 병원명">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">납품가</label>
        <input type="number" id="d-price" placeholder="납품가 (원)">
      </div>
      <div class="form-group">
        <label class="form-label">원가</label>
        <input type="number" id="d-cost" placeholder="원가 (원)">
      </div>
    </div>
  `, async () => {
    const deal_date = document.getElementById('d-date').value;
    if (!deal_date) { showToast('납품일은 필수입니다.', 'error'); return; }
    const data = {
      deal_date,
      quantity: parseInt(document.getElementById('d-qty').value) || 1,
      hospital: document.getElementById('d-hospital').value.trim() || null,
      deal_price: parseInt(document.getElementById('d-price').value) || null,
      cost_price: parseInt(document.getElementById('d-cost').value) || null,
    };
    await apiFetch(`/parts/${partId}/deals`, { method: 'POST', body: JSON.stringify(data) });
    showToast('납품 내역이 등록되었습니다.', 'success');
    hideModal();
    const part = await apiFetch(`/parts/${partId}`);
    const deals = await apiFetch(`/parts/${partId}/deals`);
    renderDetailPanel(part, deals);
    loadTree();
    loadParts();
  });
}

// ===== CREATE/EDIT PART MODAL =====
function partForm(p = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">부품코드 <span class="required">*</span></label>
        <input type="text" id="pf-code" value="${escHtml(p.part_code||'')}" placeholder="부품코드">
      </div>
      <div class="form-group">
        <label class="form-label">부품명 <span class="required">*</span></label>
        <input type="text" id="pf-name" value="${escHtml(p.part_name||'')}" placeholder="부품명">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">제조사 <span class="required">*</span></label>
        <input type="text" id="pf-company" value="${escHtml(p.company||state.company||'')}" placeholder="제조사">
      </div>
      <div class="form-group">
        <label class="form-label">분류 <span class="required">*</span></label>
        <input type="text" id="pf-category" value="${escHtml(p.category||state.category||'')}" placeholder="분류">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">모델명 <span class="required">*</span></label>
      <input type="text" id="pf-model" value="${escHtml(p.model||state.model||'')}" placeholder="모델명">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">원가</label>
        <input type="number" id="pf-cost" value="${p.cost_avg??''}" placeholder="원가 (원)">
      </div>
      <div class="form-group">
        <label class="form-label">로컬가</label>
        <input type="number" id="pf-local" value="${p.local_price??''}" placeholder="로컬가 (원)">
      </div>
      <div class="form-group">
        <label class="form-label">대학가</label>
        <input type="number" id="pf-univ" value="${p.univ_price??''}" placeholder="대학가 (원)">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">증상</label>
      <input type="text" id="pf-symptom" value="${escHtml(p.symptom||'')}" placeholder="주요 증상">
    </div>
    <div class="form-group">
      <label class="form-label">증상 상세</label>
      <textarea id="pf-symptom-detail" placeholder="증상 상세 내용">${escHtml(p.symptom_detail||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">증상 위치</label>
      <input type="text" id="pf-symptom-loc" value="${escHtml(p.symptom_location||'')}" placeholder="증상 위치">
    </div>
  `;
}

function getPartFormData() {
  return {
    part_code: document.getElementById('pf-code').value.trim(),
    part_name: document.getElementById('pf-name').value.trim(),
    company: document.getElementById('pf-company').value.trim(),
    category: document.getElementById('pf-category').value.trim(),
    model: document.getElementById('pf-model').value.trim(),
    cost_avg: parseInt(document.getElementById('pf-cost').value) || null,
    local_price: parseInt(document.getElementById('pf-local').value) || null,
    univ_price: parseInt(document.getElementById('pf-univ').value) || null,
    symptom: document.getElementById('pf-symptom').value.trim() || null,
    symptom_detail: document.getElementById('pf-symptom-detail').value.trim() || null,
    symptom_location: document.getElementById('pf-symptom-loc').value.trim() || null,
  };
}

function openCreatePart() {
  showModal('부품 등록', partForm(), async () => {
    const data = getPartFormData();
    if (!data.part_code || !data.part_name || !data.company || !data.category || !data.model) {
      showToast('부품코드, 부품명, 제조사, 분류, 모델은 필수입니다.', 'error');
      return;
    }
    await apiFetch('/parts', { method: 'POST', body: JSON.stringify(data) });
    showToast('부품이 등록되었습니다.', 'success');
    hideModal();
    loadTree();
    loadParts();
  }, { large: true });
}

async function openEditPart(partId) {
  const p = await apiFetch(`/parts/${partId}`);
  showModal('부품 수정', partForm(p), async () => {
    const data = getPartFormData();
    if (!data.part_code || !data.part_name || !data.company || !data.category || !data.model) {
      showToast('필수 항목을 입력하세요.', 'error');
      return;
    }
    await apiFetch(`/parts/${partId}`, { method: 'PUT', body: JSON.stringify(data) });
    showToast('수정되었습니다.', 'success');
    hideModal();
    loadTree();
    loadParts();
    const updatedPart = await apiFetch(`/parts/${partId}`);
    const updatedDeals = await apiFetch(`/parts/${partId}/deals`);
    renderDetailPanel(updatedPart, updatedDeals);
  }, { large: true });
}

async function deletePart(partId, name) {
  showConfirm('부품 삭제', `"${name}"을(를) 삭제하시겠습니까? 납품 내역도 함께 삭제됩니다.`, async () => {
    await apiFetch(`/parts/${partId}`, { method: 'DELETE' });
    showToast('삭제되었습니다.', 'success');
    hideModal();
    const pip = document.getElementById('part-detail-inline');
    if (pip) pip.style.display = 'none';
    loadTree();
    loadParts();
  });
}

// ===== SEED DATA UPLOAD =====
function openSeedUpload() {
  showModal('데이터 가져오기', `
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:36px;margin-bottom:12px">📦</div>
      <p style="color:var(--color-gray-600);margin-bottom:16px">seed_data_complete.json 파일을 업로드하면<br>부품 및 납품 내역 데이터가 자동으로 등록됩니다.</p>
      <button class="btn btn-primary" onclick="document.getElementById('seed-file-input').click()">JSON 파일 선택</button>
      <div id="seed-status" style="margin-top:12px;font-size:13px;color:var(--color-gray-500)"></div>
    </div>
  `, null, { saveLabel: '닫기', saveBtnClass: 'btn-secondary' });
  document.querySelector('#modal-overlay #modal-save-btn').onclick = hideModal;
}

async function handleSeedFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('seed-status');
  if (statusEl) statusEl.textContent = '파일 파싱 중...';
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (statusEl) statusEl.textContent = `${(json.parts||[]).length}건 부품, ${(json.deals||[]).length}건 납품 내역 발견. 업로드 중...`;
    const result = await apiFetch('/parts/seed', { method: 'POST', body: JSON.stringify(json) });
    const msg = `완료: 부품 ${result.parts}건 등록, 납품 ${result.deals}건 등록, ${result.skipped}건 중복 건너뜀`;
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-success)">✓ ${escHtml(msg)}</span>`;
    showToast(msg, 'success');
    loadTree();
    loadParts();
  } catch (err) {
    const msg = err.message || '업로드 실패';
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-danger)">✕ ${escHtml(msg)}</span>`;
    showToast(msg, 'error');
  }
  e.target.value = '';
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
