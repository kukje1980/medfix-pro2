// ===== STATE =====
const state = {
  page: 1,
  size: 50,
  search: '',
  company: '',
  category: '',
  model: '',
  selectedPartId: null,
  sortBy: 'deal_count',
  costUnlocked: sessionStorage.getItem('cost_unlocked') === '1',
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
  document.getElementById('seed-file-input').addEventListener('change', handleJsonFile);
  document.getElementById('seed-excel-input').addEventListener('change', handleExcelFile);
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
  const isSearch = state.search.length >= 1;
  const colSpan = isSearch ? 8 : 7;
  tbody.innerHTML = `<tr><td colspan="${colSpan}" class="loading"><div class="spinner"></div> 불러오는 중...</td></tr>`;

  // 검색 모드일 때 thead에 모델 컬럼 추가
  const thead = document.querySelector('#parts-tbody').closest('table').querySelector('thead tr');
  if (thead) {
    const hasModelCol = thead.querySelector('[data-col="model"]');
    if (isSearch && !hasModelCol) {
      const modelTh = document.createElement('th');
      modelTh.dataset.col = 'model';
      modelTh.textContent = '모델';
      thead.insertBefore(modelTh, thead.children[2]);
    } else if (!isSearch && hasModelCol) {
      hasModelCol.remove();
    }
  }

  const params = new URLSearchParams({ page: state.page, size: state.size, sort_by: state.sortBy });
  if (state.search) params.set('search', state.search);
  if (state.company) params.set('company', state.company);
  if (state.category) params.set('category', state.category);
  if (state.model) params.set('model', state.model);
  try {
    const data = await apiFetch(`/parts?${params}`);
    renderPartsTable(tbody, data.items, isSearch);
    renderPagination(
      document.getElementById('parts-pagination'),
      data.total, data.page, data.size, data.pages,
      p => { state.page = p; loadParts(); }
    );
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:40px;color:var(--color-danger)">${escHtml(e.message)}</td></tr>`;
  }
}

function dealBadge(count) {
  if (!count || count === 0) return '<span style="color:var(--color-gray-400);font-size:12px">-</span>';
  if (count >= 20) return `<span class="badge" style="background:rgba(6,214,160,.15);color:#047857;font-weight:600">${count}건</span>`;
  if (count >= 5)  return `<span class="badge" style="background:rgba(0,119,182,.12);color:#0369a1;font-weight:600">${count}건</span>`;
  return `<span class="badge" style="background:var(--color-gray-100);color:var(--color-gray-500)">${count}건</span>`;
}

function renderPartsTable(tbody, items, isSearch = false) {
  if (!items || items.length === 0) {
    const colSpan = isSearch ? 8 : 7;
    tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:40px;color:var(--color-gray-400)">부품이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(p => `
    <tr data-id="${p.id}" style="cursor:pointer">
      <td><code style="font-size:11px;background:var(--color-gray-100);padding:2px 6px;border-radius:4px">${escHtml(p.part_code)}</code></td>
      <td><strong>${escHtml(p.part_name)}</strong></td>
      ${isSearch ? `<td style="font-size:12px;color:var(--color-gray-500)">${escHtml(p.model)}</td>` : ''}
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:${p.symptom ? 'var(--color-danger)' : 'var(--color-gray-400)'}">${escHtml(p.symptom || '-')}</td>
      <td style="text-align:right;font-size:12px">${fmtCost(p.cost_avg)}</td>
      <td style="text-align:right;font-size:12px;font-weight:600;color:var(--color-primary)">${fmtMan(p.local_price)}</td>
      <td style="text-align:right;font-size:12px;font-weight:600;color:var(--color-primary)">${fmtMan(p.univ_price)}</td>
      <td style="text-align:right">${dealBadge(p.deal_count)}</td>
    </tr>`).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
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

function fmtMan(val) {
  if (val == null) return '<span style="color:var(--color-gray-400)">-</span>';
  return Number(val).toLocaleString('ko-KR') + '만';
}

// 원가 표시 (잠금 상태면 자물쇠 아이콘)
function fmtCost(val, showUnlockHint = false) {
  if (!state.costUnlocked) {
    return `<span class="cost-locked" onclick="unlockCost()" title="클릭하여 원가 열람 비밀번호 입력" style="cursor:pointer;font-size:14px;user-select:none">🔒</span>`;
  }
  if (val == null) return '<span style="color:var(--color-gray-400)">-</span>';
  return Number(val).toLocaleString('ko-KR') + '원';
}

function unlockCost() {
  showModal('원가 열람', `
    <div class="form-group">
      <label class="form-label">비밀번호를 입력하세요</label>
      <input type="password" id="cost-pw" class="form-control" placeholder="비밀번호" style="font-size:16px;letter-spacing:4px" autofocus>
      <div id="cost-pw-err" style="color:var(--color-danger);font-size:12px;margin-top:6px;display:none">비밀번호가 틀립니다.</div>
    </div>
  `, () => {
    const pw = document.getElementById('cost-pw')?.value || '';
    if (pw === '15901') {
      state.costUnlocked = true;
      sessionStorage.setItem('cost_unlocked', '1');
      hideModal();
      loadParts();
      // 열린 상세 패널 갱신
      if (state.selectedPartId) {
        apiFetch(`/parts/${state.selectedPartId}`).then(part =>
          apiFetch(`/parts/${state.selectedPartId}/deals`).then(deals =>
            renderDetailPanel(part, deals)
          )
        );
      }
    } else {
      const errEl = document.getElementById('cost-pw-err');
      if (errEl) errEl.style.display = '';
      document.getElementById('cost-pw')?.select();
      return false; // 모달 닫지 않음
    }
  }, { saveLabel: '확인' });

  // 엔터키로 제출
  setTimeout(() => {
    const input = document.getElementById('cost-pw');
    if (input) {
      input.focus();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('#modal-overlay #modal-save-btn')?.click();
      });
    }
  }, 100);
}

function lockCost() {
  state.costUnlocked = false;
  sessionStorage.removeItem('cost_unlocked');
  loadParts();
  document.getElementById('part-detail-inline').style.display = 'none';
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
        ${state.costUnlocked
          ? `<button class="btn btn-sm" onclick="lockCost()" title="원가 다시 잠금" style="font-size:12px;padding:3px 8px">🔒 잠금</button>`
          : `<button class="btn btn-sm" onclick="unlockCost()" title="원가 열람" style="font-size:12px;padding:3px 8px;color:var(--color-primary)">🔓 원가 열람</button>`}
        <button class="btn btn-secondary btn-sm" onclick="openEditPart(${part.id})">✏️ 수정</button>
        <button class="btn btn-danger btn-sm" onclick="deletePart(${part.id}, '${escHtml(part.part_name).replace(/'/g, "\\'")}')">🗑 삭제</button>
        <button class="btn btn-sm" onclick="document.getElementById('part-detail-inline').style.display='none'" style="padding:4px 10px;font-size:14px;line-height:1">×</button>
      </div>
    </div>`;

  if (part.symptom) {
    h += `<div class="pip-symptom">
      <strong>⚠ 교체 증상: ${escHtml(part.symptom)}</strong>
      ${part.symptom_detail ? `<div style="margin-top:5px">💡 ${escHtml(part.symptom_detail)}</div>` : ''}
      ${part.symptom_location ? `<div style="margin-top:3px;font-size:11px">📍 교체 위치: ${escHtml(part.symptom_location)}</div>` : ''}
    </div>`;
  }

  const costDisp = state.costUnlocked
    ? (part.cost_avg != null ? `<span style="font-weight:700">₩${Number(part.cost_avg).toLocaleString('ko-KR')}</span>` : '-')
    : `<span onclick="unlockCost()" style="cursor:pointer;font-size:16px" title="클릭하여 비밀번호 입력">🔒</span>`;

  h += `<div class="pip-prices">
    <div class="pip-card cost-card" style="${state.costUnlocked ? '' : 'cursor:pointer'}" ${state.costUnlocked ? '' : 'onclick="unlockCost()"'}>
      <label>원가${state.costUnlocked ? '' : ' 🔒'}</label>
      <div class="pv">${costDisp}</div>
    </div>
    <div class="pip-card"><label>로컬가(만)</label><div class="pv blue">${fw(part.local_price)}</div></div>
    <div class="pip-card"><label>종병가(만)</label><div class="pv blue">${fw(part.univ_price)}</div></div>
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
    <div id="deals-table-wrap">${renderDealsTable(deals, state.costUnlocked)}</div>
  </div>`;

  h += `</div>`;

  const panel = document.getElementById('part-detail-inline');
  panel.style.display = 'block';
  panel.innerHTML = h;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDealsTable(deals, showCost = false) {
  if (!deals || deals.length === 0) {
    return `<div style="text-align:center;padding:20px;color:var(--color-gray-400);font-size:12px">납품 내역이 없습니다.</div>`;
  }
  const costCell = showCost
    ? `<th class="r">원가</th>`
    : `<th class="r" style="cursor:pointer;color:var(--color-primary)" onclick="unlockCost()" title="원가 열람">원가 🔒</th>`;
  return `<table class="pip-dt">
    <thead>
      <tr>
        <th>병원/거래처</th>
        <th>납품일</th>
        <th class="r">수량</th>
        <th class="r">납품단가</th>
        ${costCell}
        <th></th>
      </tr>
    </thead>
    <tbody>${deals.map(d => `
      <tr>
        <td>${escHtml(d.hospital || '-')}</td>
        <td>${formatDateShort(d.deal_date)}</td>
        <td class="r">${d.quantity || 1}</td>
        <td class="r" style="font-weight:600;color:var(--color-primary)">${fmtPrice(d.deal_price)}</td>
        <td class="r">${showCost ? fmtPrice(d.cost_price) : '<span onclick="unlockCost()" style="cursor:pointer;font-size:13px" title="클릭하여 비밀번호 입력">🔒</span>'}</td>
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
  if (wrap) wrap.innerHTML = renderDealsTable(deals, state.costUnlocked);
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
    <div style="padding:4px 0">
      <p style="color:var(--color-gray-600);margin-bottom:20px;font-size:13px;line-height:1.6">
        부품 데이터를 <strong>JSON</strong> 또는 <strong>Excel(xlsx)</strong> 형식으로 업로드하세요.<br>
        이미 등록된 부품(부품코드+회사+모델 기준)은 건너뜁니다.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="border:2px dashed var(--color-gray-200);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:border-color .15s"
             onclick="document.getElementById('seed-file-input').click()"
             onmouseover="this.style.borderColor='var(--color-primary)'"
             onmouseout="this.style.borderColor='var(--color-gray-200)'">
          <div style="font-size:32px;margin-bottom:8px">📄</div>
          <div style="font-size:13px;font-weight:600;color:var(--color-gray-700);margin-bottom:4px">JSON 업로드</div>
          <div style="font-size:11px;color:var(--color-gray-400)">seed_data_complete.json</div>
        </div>
        <div style="border:2px dashed var(--color-gray-200);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:border-color .15s"
             onclick="document.getElementById('seed-excel-input').click()"
             onmouseover="this.style.borderColor='#16a34a'"
             onmouseout="this.style.borderColor='var(--color-gray-200)'">
          <div style="font-size:32px;margin-bottom:8px">📊</div>
          <div style="font-size:13px;font-weight:600;color:var(--color-gray-700);margin-bottom:4px">Excel 업로드</div>
          <div style="font-size:11px;color:var(--color-gray-400)">.xlsx / .xls 파일</div>
        </div>
      </div>
      <div style="background:var(--color-gray-50);border-radius:8px;padding:12px;font-size:11px;color:var(--color-gray-500);line-height:1.7">
        <strong>Excel 컬럼명 (한글/영문):</strong><br>
        회사·제조사 / 형명·분류 / 모델·모델명 / 품번·품목코드 / 품명·부품명<br>
        원가 / 로컬가 / 대학가·종병가 / 증상·교체증상 / 납품건수<br>
        <em>납품내역 시트: 병원·거래처 / 납품일 / 납품가·납품단가 / 실원가</em>
      </div>
      <div id="seed-status" style="margin-top:14px;font-size:13px;text-align:center"></div>
    </div>
  `, null, { saveLabel: '닫기', saveBtnClass: 'btn-secondary' });
  document.querySelector('#modal-overlay #modal-save-btn').onclick = hideModal;
}

function _showSeedStatus(msg, type = 'info') {
  const el = document.getElementById('seed-status');
  if (!el) return;
  const colors = { info: 'var(--color-gray-500)', success: 'var(--color-success)', error: 'var(--color-danger)' };
  el.innerHTML = `<span style="color:${colors[type]}">${type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : ''}${escHtml(msg)}</span>`;
}

async function handleJsonFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  _showSeedStatus('JSON 파싱 중...');
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const pCount = (json.parts || json.part_deals ? json.parts?.length : null) ?? Object.keys(json).length;
    _showSeedStatus(`부품 ${(json.parts||[]).length}건, 납품 ${(json.part_deals||json.deals||[]).length}건 발견. 업로드 중...`);
    const payload = { parts: json.parts || [], deals: json.part_deals || json.deals || [] };
    const result = await apiFetch('/parts/seed', { method: 'POST', body: JSON.stringify(payload) });
    const msg = `부품 ${result.parts}건 등록, 납품 ${result.deals}건 등록, ${result.skipped}건 중복 건너뜀`;
    _showSeedStatus(msg, 'success');
    showToast(msg, 'success');
    loadTree(); loadParts();
  } catch (err) {
    _showSeedStatus(err.message || 'JSON 업로드 실패', 'error');
    showToast(err.message || 'JSON 업로드 실패', 'error');
  }
  e.target.value = '';
}

async function handleExcelFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  _showSeedStatus(`"${file.name}" 파싱 중...`);

  // 회사 자동감지 실패 대비 — 모달에서 회사명 선택 가능하도록
  const COMPANIES = [
    '', 'KOWA (Japan)', 'KONAN (Japan)', 'KEELER (UK)',
    'A.R.C. Laser (Germany)', 'Phaco Handpiece (해외)',
    'Camera/주변기기', 'NewEyesTech', '기타'
  ];
  const companySelect = COMPANIES.map(c =>
    `<option value="${escHtml(c)}">${c || '-- 자동 감지 (권장) --'}</option>`
  ).join('');

  // 회사 선택 후 업로드하는 내부 함수
  const doUpload = async (companyOverride) => {
    _showSeedStatus(`업로드 중... (${file.name})`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (companyOverride) formData.append('company', companyOverride);
      const resp = await fetch('/parts/seed-excel', { method: 'POST', body: formData });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.detail || 'Excel 업로드 실패');
      const msg = `부품 ${result.parts}건 등록, 납품 ${result.deals}건 등록, ${result.skipped}건 중복 건너뜀`;
      _showSeedStatus(msg, 'success');
      showToast(msg, 'success');
      loadTree(); loadParts();
    } catch (err) {
      _showSeedStatus(err.message || 'Excel 업로드 실패', 'error');
      showToast(err.message || 'Excel 업로드 실패', 'error');
    }
  };

  // 회사 선택 모달
  showModal('Excel 업로드 — 회사 선택', `
    <div class="form-group">
      <label class="form-label">파일: <strong>${escHtml(file.name)}</strong></label>
    </div>
    <div class="form-group">
      <label class="form-label">회사 (자동 감지 또는 직접 선택)</label>
      <select id="excel-company" class="form-control" style="font-size:13px">
        ${companySelect}
      </select>
      <div style="font-size:11px;color:var(--color-gray-400);margin-top:4px">
        엑셀의 시리즈명으로 자동 판별합니다. 잘못 감지되면 직접 선택하세요.
      </div>
    </div>
  `, () => {
    const company = document.getElementById('excel-company')?.value || '';
    hideModal();
    doUpload(company);
  }, { saveLabel: '업로드 시작' });

  e.target.value = '';
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
