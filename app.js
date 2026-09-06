/* ---------------------------------------------------------
   Livro-Caixa — controle financeiro pessoal
   Dados ficam salvos no localStorage do navegador.
--------------------------------------------------------- */

const STORAGE_KEY = 'livroCaixa_v1';
const VIEW_KEY = 'livroCaixa_view';

const GROUP_META = {
  income:   { label: 'Rendimentos',        totalLabel: 'Total de rendimentos' },
  fixed:    { label: 'Despesas Fixas',      totalLabel: 'Total de despesas fixas' },
  variable: { label: 'Despesas Variáveis',  totalLabel: 'Total de despesas variáveis' },
};
const GROUP_ORDER = ['income', 'fixed', 'variable'];

const CATEGORY_META = {
  moradia:     { label: 'Moradia',            color: '#6B5B3D' },
  transporte:  { label: 'Transporte',         color: '#3D6B85' },
  alimentacao: { label: 'Alimentação',        color: '#2E6B4F' },
  saude:       { label: 'Saúde',              color: '#A94B3D' },
  educacao:    { label: 'Educação',           color: '#5B4C8C' },
  cuidados:    { label: 'Cuidados pessoais',  color: '#A9803F' },
  pets:        { label: 'Pets',               color: '#8C6F52' },
  dividas:     { label: 'Dívidas / Cartão',   color: '#7A3D55' },
  lazer:       { label: 'Lazer',              color: '#3D8C6B' },
  outros:      { label: 'Outros',             color: '#9AA093' },
};
const CATEGORY_ORDER = Object.keys(CATEGORY_META);

function rowCategory(row) {
  return CATEGORY_META[row.category] ? row.category : 'outros';
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function seedData() {
  const monthLabels = ['Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Janeiro', 'Fevereiro', 'Fevereiro (2)'];
  const months = monthLabels.map((label, i) => ({ id: 'm' + (i + 1), label }));

  function row(name, vals, category) {
    const values = {};
    months.forEach((m, i) => { values[m.id] = vals[i] ?? null; });
    const r = { id: uid('r'), name, values };
    if (category) r.category = category;
    return r;
  }

  return {
    months,
    groups: {
      income: [
        row('Rendimento 01', [null, null, 8000, 8000, 19000, 5700, 6700, 8000]),
        row('Vale alimentação', [null, 3000, 2790, 2790, 2790, 2790, 2790, 2790]),
        row('Mãe celular + cartão', [null, 533, 161, 161, 161, 161, 161, 161]),
        row('Mãe XBOX + controle + Nick', [null, 499, 169, 169, 169, 169, 169, 169]),
        row('Mãe empréstimo', [null, 481, 160, 160, 160, 160, 160, 160]),
        row('Sobra do mês anterior', [3500, 3500, 5098, 3821, 4194, 15167, 13940, 13712]),
      ],
      fixed: [
        row('Casa', [null, null, 1460, 1460, 1460, 1460, 1460, 1460], 'moradia'),
        row('Gasolina', [null, 300, 350, 350, 350, 350, 350, 350], 'transporte'),
        row('Luz', [null, null, 350, 350, 350, 350, 350, 350], 'moradia'),
        row('Net', [null, null, 125, 125, 125, 125, 125, 125], 'moradia'),
        row('Condomínio', [null, null, 320, 320, 320, 320, 320, 320], 'moradia'),
        row('Barbeiro', [null, 45, 90, 90, 90, 90, 90, 90], 'cuidados'),
        row('Faculdade Alex', [null, null, 270, 270, 270, 270, 270, 270], 'educacao'),
        row('Empréstimo', [null, null, 1497, 1497, 1497, 1497, 1497, 1497], 'dividas'),
        row('Bomba', [null, null, 500, null, 500, null, null, null], 'transporte'),
        row('Academia', [null, null, 250, 250, 250, 250, 250, 250], 'saude'),
        row('Gatos', [null, null, 300, 300, 300, 300, 300, 300], 'pets'),
        row('Remédios', [null, null, 200, 200, 200, 200, 200, 200], 'saude'),
      ],
      variable: [
        row('Mercado', [null, 2500, 2500, 2500, 2500, 2500, 2500, 2500], 'alimentacao'),
        row('Cartão de crédito ailos', [null, null, 1100, 800, 700, 700, 700, 700], 'dividas'),
        row('Cartão de crédito mercado pago', [null, null, 2300, 1800, 1800, 1200, 1200, 1200], 'dividas'),
        row('Dani', [null, 70, 70, 70, 70, 70, 70, 70], 'outros'),
        row('Rodrigo', [null, null, 25, 25, 25, 25, 25, 25], 'outros'),
        row('Unha / sobrancelha', [null, null, 250, 250, 250, 250, 250, 250], 'cuidados'),
        row('Empréstimo Pai', [null, null, 350, null, null, null, null, null], 'dividas'),
        row('Cartão caixa', [null, null, 250, 250, 250, 250, 250, 250], 'dividas'),
      ],
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Não foi possível ler os dados salvos', e); }
  return seedData();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let activeMonthId = state.months[state.months.length - 1]?.id;
let viewMode = localStorage.getItem(VIEW_KEY) || 'month';
let collapsedGroups = {}; // session-only, per groupKey

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brlPrecise = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function num(v) { return typeof v === 'number' && !isNaN(v) ? v : 0; }

function groupTotal(groupKey, monthId) {
  return state.groups[groupKey].reduce((sum, r) => sum + num(r.values[monthId]), 0);
}

function monthSaldo(monthId) {
  return groupTotal('income', monthId) - groupTotal('fixed', monthId) - groupTotal('variable', monthId);
}

function cumulativeSaldo(monthId) {
  let total = 0;
  for (const m of state.months) {
    total += monthSaldo(m.id);
    if (m.id === monthId) break;
  }
  return total;
}

function monthIndex(monthId) {
  return state.months.findIndex(m => m.id === monthId);
}

/* =========================================================
   VIEW TOGGLE
========================================================= */

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem(VIEW_KEY, mode);
  document.querySelectorAll('.viewToggle__btn').forEach(b => b.classList.toggle('is-active', b.dataset.mode === mode));
  document.getElementById('monthView').hidden = mode !== 'month';
  document.getElementById('tableView').hidden = mode !== 'table';
  closeMonthMenu();
}

document.querySelectorAll('.viewToggle__btn').forEach(btn => {
  btn.addEventListener('click', () => setViewMode(btn.dataset.mode));
});

/* =========================================================
   MONTH VIEW (card list, one month at a time)
========================================================= */

function renderHero() {
  const idx = monthIndex(activeMonthId);
  const m = state.months[idx];
  if (!m) return;

  document.getElementById('monthPickerLabel').textContent = m.label;
  document.getElementById('prevMonth').disabled = idx <= 0;
  document.getElementById('nextMonth').disabled = idx >= state.months.length - 1;

  const income = groupTotal('income', m.id);
  const expense = groupTotal('fixed', m.id) + groupTotal('variable', m.id);
  const saldo = income - expense;
  const cumulative = cumulativeSaldo(m.id);

  const balEl = document.getElementById('heroBalance');
  balEl.textContent = brlPrecise.format(saldo);
  balEl.classList.toggle('neg', saldo < 0);
  balEl.classList.toggle('pos', saldo >= 0);

  document.getElementById('heroIncome').textContent = brl.format(income);
  document.getElementById('heroExpense').textContent = brl.format(expense);
  const cumEl = document.getElementById('heroCumulative');
  cumEl.textContent = brl.format(cumulative);
  cumEl.style.color = cumulative >= 0 ? '#B7E0C4' : '#F0B3A6';

  renderHeroDelta(idx, saldo);
}

function renderHeroDelta(idx, saldo) {
  let el = document.getElementById('heroDelta');
  if (!el) {
    el = document.createElement('span');
    el.id = 'heroDelta';
    el.className = 'hero__delta';
    document.querySelector('.hero__balance').appendChild(el);
  }
  if (idx <= 0) { el.textContent = ''; return; }
  const prevMonth = state.months[idx - 1];
  const prevSaldo = monthSaldo(prevMonth.id);
  const diff = saldo - prevSaldo;
  el.classList.toggle('pos', diff >= 0);
  el.classList.toggle('neg', diff < 0);
  const arrow = diff >= 0 ? '▲' : '▼';
  el.textContent = `${arrow} ${brl.format(Math.abs(diff))} vs ${prevMonth.label}`;
}

function closeMonthMenu() {
  const menu = document.getElementById('monthMenu');
  menu.hidden = true;
  menu.innerHTML = '';
}

function toggleMonthMenu() {
  const menu = document.getElementById('monthMenu');
  if (!menu.hidden) { closeMonthMenu(); return; }
  menu.innerHTML = '';
  state.months.forEach(m => {
    const item = document.createElement('button');
    item.className = 'monthMenu__item' + (m.id === activeMonthId ? ' is-active' : '');
    const span = document.createElement('span');
    span.textContent = m.label;
    item.appendChild(span);
    if (state.months.length > 1) {
      const del = document.createElement('button');
      del.textContent = '✕';
      del.title = 'Remover este mês';
      del.addEventListener('click', (e) => { e.stopPropagation(); removeMonth(m.id); });
      item.appendChild(del);
    }
    item.addEventListener('click', () => { activeMonthId = m.id; closeMonthMenu(); renderHero(); renderGroups(); renderCategoryBreakdown(); });
    menu.appendChild(item);
  });
  menu.hidden = false;
}

document.getElementById('monthPicker').addEventListener('click', toggleMonthMenu);
document.addEventListener('click', (e) => {
  const menu = document.getElementById('monthMenu');
  if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('#monthPicker')) {
    closeMonthMenu();
  }
});
document.getElementById('prevMonth').addEventListener('click', () => {
  const idx = monthIndex(activeMonthId);
  if (idx > 0) { activeMonthId = state.months[idx - 1].id; renderHero(); renderGroups(); renderCategoryBreakdown(); }
});
document.getElementById('nextMonth').addEventListener('click', () => {
  const idx = monthIndex(activeMonthId);
  if (idx < state.months.length - 1) { activeMonthId = state.months[idx + 1].id; renderHero(); renderGroups(); renderCategoryBreakdown(); }
});

function renderGroups() {
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  GROUP_ORDER.forEach(groupKey => {
    const meta = GROUP_META[groupKey];
    const card = document.createElement('div');
    card.className = 'groupCard' + (collapsedGroups[groupKey] ? ' is-collapsed' : '');

    const head = document.createElement('div');
    head.className = 'groupCard__head';
    const h3 = document.createElement('h3');
    h3.textContent = meta.label;
    const totalWrap = document.createElement('div');
    totalWrap.style.display = 'flex';
    totalWrap.style.alignItems = 'center';
    const totalSpan = document.createElement('span');
    totalSpan.className = 'groupCard__total';
    totalSpan.textContent = (groupKey === 'income' ? '' : '− ') + brl.format(groupTotal(groupKey, activeMonthId));
    const chev = document.createElement('span');
    chev.className = 'groupCard__chev';
    chev.textContent = '▾';
    totalWrap.appendChild(totalSpan);
    totalWrap.appendChild(chev);
    head.appendChild(h3);
    head.appendChild(totalWrap);
    head.addEventListener('click', () => {
      collapsedGroups[groupKey] = !collapsedGroups[groupKey];
      card.classList.toggle('is-collapsed');
    });
    card.appendChild(head);

    const body = document.createElement('div');
    body.className = 'groupCard__body';

    state.groups[groupKey].forEach((row, idx, arr) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'itemRow';

      const reorder = document.createElement('div');
      reorder.className = 'itemRow__reorder';
      const upBtn = document.createElement('button');
      upBtn.textContent = '▲';
      upBtn.title = 'Mover para cima';
      upBtn.disabled = idx === 0;
      upBtn.addEventListener('click', () => moveItem(groupKey, row.id, -1));
      const downBtn = document.createElement('button');
      downBtn.textContent = '▼';
      downBtn.title = 'Mover para baixo';
      downBtn.disabled = idx === arr.length - 1;
      downBtn.addEventListener('click', () => moveItem(groupKey, row.id, 1));
      reorder.appendChild(upBtn);
      reorder.appendChild(downBtn);
      itemRow.appendChild(reorder);

      if (groupKey !== 'income') {
        const catKey = rowCategory(row);
        const catSelect = document.createElement('select');
        catSelect.className = 'itemRow__cat';
        catSelect.style.background = CATEGORY_META[catKey].color;
        catSelect.title = 'Categoria: ' + CATEGORY_META[catKey].label;
        CATEGORY_ORDER.forEach(key => {
          const opt = document.createElement('option');
          opt.value = key;
          opt.textContent = CATEGORY_META[key].label;
          opt.selected = key === catKey;
          catSelect.appendChild(opt);
        });
        catSelect.addEventListener('change', () => {
          row.category = catSelect.value;
          catSelect.style.background = CATEGORY_META[row.category].color;
          catSelect.title = 'Categoria: ' + CATEGORY_META[row.category].label;
          saveState();
          renderCharts();
        });
        itemRow.appendChild(catSelect);
      }

      const nameInput = document.createElement('input');
      nameInput.className = 'itemRow__name';
      nameInput.value = row.name;
      nameInput.addEventListener('change', () => { row.name = nameInput.value || row.name; saveState(); });

      const valueInput = document.createElement('input');
      valueInput.className = 'itemRow__value';
      valueInput.type = 'text';
      valueInput.inputMode = 'decimal';
      const v = row.values[activeMonthId];
      valueInput.value = v === null || v === undefined ? '' : String(v);
      valueInput.placeholder = 'R$ 0';
      valueInput.addEventListener('change', () => {
        const parsed = parseFloat(valueInput.value.replace(',', '.'));
        row.values[activeMonthId] = isNaN(parsed) ? null : parsed;
        saveState();
        renderHero();
        totalSpan.textContent = (groupKey === 'income' ? '' : '− ') + brl.format(groupTotal(groupKey, activeMonthId));
        renderCharts();
      });

      const del = document.createElement('button');
      del.className = 'itemRow__del';
      del.textContent = '✕';
      del.title = 'Remover item';
      del.addEventListener('click', () => {
        if (confirm(`Remover "${row.name}"?`)) removeRow(groupKey, row.id);
      });

      itemRow.appendChild(nameInput);
      itemRow.appendChild(valueInput);
      itemRow.appendChild(del);
      body.appendChild(itemRow);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'addItemBtn';
    addBtn.textContent = '+ adicionar item';
    addBtn.addEventListener('click', () => addRowToGroup(groupKey));
    body.appendChild(addBtn);

    card.appendChild(body);
    container.appendChild(card);
  });
}

/* =========================================================
   TABLE VIEW (Visão geral — planilha completa)
========================================================= */

function renderTableHead() {
  const thead = document.getElementById('sheetHead');
  const tr = document.createElement('tr');
  tr.appendChild(document.createElement('th'));
  state.months.forEach(m => {
    const th = document.createElement('th');
    const wrap = document.createElement('div');
    wrap.className = 'month-head';
    const input = document.createElement('input');
    input.value = m.label;
    input.addEventListener('change', () => { m.label = input.value || m.label; saveState(); renderHero(); });
    wrap.appendChild(input);
    if (state.months.length > 1) {
      const del = document.createElement('button');
      del.textContent = '✕';
      del.title = 'Remover este mês';
      del.addEventListener('click', () => removeMonth(m.id));
      wrap.appendChild(del);
    }
    th.appendChild(wrap);
    tr.appendChild(th);
  });
  thead.innerHTML = '';
  thead.appendChild(tr);
}

function makeRowLabelCell(row, groupKey) {
  const th = document.createElement('th');
  th.className = 'cell cell--label';
  const wrap = document.createElement('div');
  wrap.className = 'row-label';
  const input = document.createElement('input');
  input.value = row.name;
  input.addEventListener('change', () => { row.name = input.value || row.name; saveState(); });
  const del = document.createElement('button');
  del.textContent = '✕';
  del.title = 'Remover esta linha';
  del.addEventListener('click', () => removeRow(groupKey, row.id));
  wrap.appendChild(input);
  wrap.appendChild(del);
  th.appendChild(wrap);
  return th;
}

function makeValueCell(row, monthId) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.className = 'value-input';
  const v = row.values[monthId];
  input.value = v === null || v === undefined ? '' : String(v);
  input.placeholder = '—';
  input.addEventListener('change', () => {
    const parsed = parseFloat(input.value.replace(',', '.'));
    row.values[monthId] = isNaN(parsed) ? null : parsed;
    saveState();
    renderTableFoot();
    renderHero();
    renderCharts();
  });
  td.appendChild(input);
  return td;
}

function renderTableGroupRows(groupKey, tbody) {
  const meta = GROUP_META[groupKey];

  const headerRow = document.createElement('tr');
  headerRow.className = 'group-header';
  const th = document.createElement('th');
  th.textContent = meta.label;
  headerRow.appendChild(th);
  state.months.forEach(() => headerRow.appendChild(document.createElement('td')));
  tbody.appendChild(headerRow);

  state.groups[groupKey].forEach(row => {
    const tr = document.createElement('tr');
    tr.appendChild(makeRowLabelCell(row, groupKey));
    state.months.forEach(m => tr.appendChild(makeValueCell(row, m.id)));
    tbody.appendChild(tr);
  });

  const addRow = document.createElement('tr');
  const addTh = document.createElement('th');
  const addBtn = document.createElement('button');
  addBtn.className = 'add-row-btn';
  addBtn.textContent = '+ adicionar item';
  addBtn.addEventListener('click', () => addRowToGroup(groupKey));
  addTh.appendChild(addBtn);
  addRow.appendChild(addTh);
  state.months.forEach(() => addRow.appendChild(document.createElement('td')));
  tbody.appendChild(addRow);

  const totalRow = document.createElement('tr');
  totalRow.className = 'group-total';
  totalRow.dataset.groupTotal = groupKey;
  const totalTh = document.createElement('th');
  totalTh.textContent = meta.totalLabel;
  totalRow.appendChild(totalTh);
  state.months.forEach(m => {
    const td = document.createElement('td');
    td.className = 'balance-cell';
    td.dataset.monthTotal = m.id;
    td.textContent = brl.format(groupTotal(groupKey, m.id));
    totalRow.appendChild(td);
  });
  tbody.appendChild(totalRow);
}

function renderTableBody() {
  const tbody = document.getElementById('sheetBody');
  tbody.innerHTML = '';
  GROUP_ORDER.forEach(groupKey => renderTableGroupRows(groupKey, tbody));
}

function renderTableFoot() {
  const tfoot = document.getElementById('sheetFoot');
  tfoot.innerHTML = '';

  GROUP_ORDER.forEach(groupKey => {
    const row = document.querySelector(`tr.group-total[data-group-total="${groupKey}"]`);
    if (!row) return;
    state.months.forEach(m => {
      const td = row.querySelector(`td[data-month-total="${m.id}"]`);
      if (td) td.textContent = brl.format(groupTotal(groupKey, m.id));
    });
  });

  const balanceRow = document.createElement('tr');
  balanceRow.className = 'balance-row';
  const bTh = document.createElement('th');
  bTh.textContent = 'Saldo do mês';
  balanceRow.appendChild(bTh);
  state.months.forEach(m => {
    const s = monthSaldo(m.id);
    const td = document.createElement('td');
    td.className = 'balance-cell ' + (s >= 0 ? 'pos' : 'neg');
    td.textContent = brl.format(s);
    balanceRow.appendChild(td);
  });
  tfoot.appendChild(balanceRow);

  const cumRow = document.createElement('tr');
  cumRow.className = 'balance-row';
  const cTh = document.createElement('th');
  cTh.textContent = 'Saldo acumulado';
  cumRow.appendChild(cTh);
  state.months.forEach(m => {
    const s = cumulativeSaldo(m.id);
    const td = document.createElement('td');
    td.className = 'balance-cell ' + (s >= 0 ? 'pos' : 'neg');
    td.textContent = brl.format(s);
    cumRow.appendChild(td);
  });
  tfoot.appendChild(cumRow);
}

function renderTable() {
  renderTableHead();
  renderTableBody();
  renderTableFoot();
}

/* =========================================================
   CHARTS — SVG desenhado à mão (sem depender de nenhuma
   biblioteca externa, então nunca quebra por causa de rede)
========================================================= */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function fmtCompact(v) {
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1000) {
    const k = abs / 1000;
    return sign + (k >= 10 ? Math.round(k) : k.toFixed(1).replace('.', ',')) + 'k';
  }
  return sign + Math.round(abs);
}

function shortLabel(label) {
  return label.length > 4 ? label.slice(0, 3) : label;
}

function renderCharts() {
  const months = state.months;
  const saldos = months.map(m => monthSaldo(m.id));
  const incomes = months.map(m => groupTotal('income', m.id));
  const expenses = months.map(m => groupTotal('fixed', m.id) + groupTotal('variable', m.id));

  renderDivergingChart(document.getElementById('chartBalance'), months, saldos);
  renderGroupedChart(document.getElementById('chartIncomeExpense'), months, incomes, expenses);
  renderCategoryBreakdown();
  renderPeriodSummary();
}

function categoryTotals(monthId) {
  const totals = {};
  ['fixed', 'variable'].forEach(groupKey => {
    state.groups[groupKey].forEach(row => {
      const cat = rowCategory(row);
      totals[cat] = (totals[cat] || 0) + num(row.values[monthId]);
    });
  });
  return totals;
}

function renderCategoryBreakdown() {
  const container = document.getElementById('categoryBreakdown');
  const subEl = document.getElementById('catBreakdownMonth');
  if (!container) return;
  const m = state.months.find(x => x.id === activeMonthId);
  if (subEl) subEl.textContent = m ? `— ${m.label}` : '';

  const totals = categoryTotals(activeMonthId);
  const entries = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  container.innerHTML = '';
  if (!entries.length) {
    container.innerHTML = '<p class="chart-svg__empty">Nenhuma despesa lançada neste mês ainda.</p>';
    return;
  }
  const maxVal = entries[0][1];
  entries.forEach(([catKey, val]) => {
    const meta = CATEGORY_META[catKey];
    const catRow = document.createElement('div');
    catRow.className = 'catRow';

    const dot = document.createElement('span');
    dot.className = 'catRow__dot';
    dot.style.background = meta.color;

    const label = document.createElement('span');
    label.className = 'catRow__label';
    label.textContent = meta.label;

    const barWrap = document.createElement('div');
    barWrap.className = 'catRow__bar';
    const fill = document.createElement('div');
    fill.className = 'catRow__fill';
    fill.style.width = (val / maxVal * 100) + '%';
    fill.style.background = meta.color;
    barWrap.appendChild(fill);

    const value = document.createElement('span');
    value.className = 'catRow__value';
    value.textContent = brl.format(val);

    catRow.appendChild(dot);
    catRow.appendChild(label);
    catRow.appendChild(barWrap);
    catRow.appendChild(value);
    container.appendChild(catRow);
  });
}

function renderPeriodSummary() {
  const el = document.getElementById('periodIncome');
  if (!el) return;
  const months = state.months;
  const totalIncome = months.reduce((sum, m) => sum + groupTotal('income', m.id), 0);
  const totalExpense = months.reduce((sum, m) => sum + groupTotal('fixed', m.id) + groupTotal('variable', m.id), 0);
  const totalBalance = totalIncome - totalExpense;
  const avg = months.length ? totalBalance / months.length : 0;

  document.getElementById('periodIncome').textContent = brl.format(totalIncome);
  document.getElementById('periodExpense').textContent = brl.format(totalExpense);
  const balEl = document.getElementById('periodBalance');
  balEl.textContent = brl.format(totalBalance);
  balEl.style.color = totalBalance >= 0 ? 'var(--positive)' : 'var(--negative)';
  const avgEl = document.getElementById('periodAverage');
  avgEl.textContent = brl.format(avg);
  avgEl.style.color = avg >= 0 ? 'var(--positive)' : 'var(--negative)';

  document.getElementById('periodHint').textContent =
    `Considerando ${months.length} ${months.length === 1 ? 'mês lançado' : 'meses lançados'}, de ${months[0]?.label} a ${months[months.length - 1]?.label}.`;
}

function renderDivergingChart(container, months, values) {
  container.innerHTML = '';
  if (!months.length) { container.innerHTML = '<p class="chart-svg__empty">Sem dados ainda.</p>'; return; }

  const slot = 58;
  const width = Math.max(months.length * slot, 300);
  const height = 190;
  const midY = height / 2;
  const maxAbs = Math.max(1, ...values.map(v => Math.abs(v)));
  const barMax = midY - 34;
  const barW = slot * 0.46;

  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.max(width, 300), height, preserveAspectRatio: 'xMinYMid meet' });
  svg.appendChild(svgEl('line', { x1: 0, y1: midY, x2: width, y2: midY, stroke: '#DDD0A8', 'stroke-width': 1 }));

  months.forEach((m, i) => {
    const v = values[i];
    const cx = i * slot + slot / 2;
    const h = Math.abs(v) / maxAbs * barMax;
    const y = v >= 0 ? midY - h : midY;
    const color = v >= 0 ? '#2E6B4F' : '#9C3B2D';

    const rect = svgEl('rect', { x: cx - barW / 2, y, width: barW, height: Math.max(h, 2), rx: 3, fill: color });
    const title = svgEl('title', {});
    title.textContent = `${m.label}: ${brlPrecise.format(v)}`;
    rect.appendChild(title);
    svg.appendChild(rect);

    const valueLabel = svgEl('text', {
      x: cx, y: v >= 0 ? Math.max(y - 6, 10) : y + h + 14,
      'text-anchor': 'middle', 'font-size': '9', fill: '#6B7263', 'font-family': 'Inter, sans-serif',
    });
    valueLabel.textContent = fmtCompact(v);
    svg.appendChild(valueLabel);

    const monthLabel = svgEl('text', {
      x: cx, y: height - 6, 'text-anchor': 'middle', 'font-size': '9.5', fill: '#6B7263', 'font-family': 'Inter, sans-serif',
    });
    monthLabel.textContent = shortLabel(m.label);
    svg.appendChild(monthLabel);
  });

  container.appendChild(svg);
}

function renderGroupedChart(container, months, incomes, expenses) {
  container.innerHTML = '';
  if (!months.length) { container.innerHTML = '<p class="chart-svg__empty">Sem dados ainda.</p>'; return; }

  const slot = 58;
  const width = Math.max(months.length * slot, 300);
  const height = 190;
  const baseline = height - 24;
  const barMax = baseline - 22;
  const maxVal = Math.max(1, ...incomes, ...expenses);
  const barW = 13;
  const gap = 3;

  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width: Math.max(width, 300), height, preserveAspectRatio: 'xMinYMid meet' });
  svg.appendChild(svgEl('line', { x1: 0, y1: baseline, x2: width, y2: baseline, stroke: '#DDD0A8', 'stroke-width': 1 }));

  months.forEach((m, i) => {
    const cx = i * slot + slot / 2;
    const hIncome = incomes[i] / maxVal * barMax;
    const hExpense = expenses[i] / maxVal * barMax;
    const xIncome = cx - gap / 2 - barW;
    const xExpense = cx + gap / 2;

    const rIncome = svgEl('rect', { x: xIncome, y: baseline - hIncome, width: barW, height: Math.max(hIncome, 1), rx: 2, fill: '#A9803F' });
    const tIncome = svgEl('title', {}); tIncome.textContent = `${m.label} — Rendimentos: ${brlPrecise.format(incomes[i])}`;
    rIncome.appendChild(tIncome);

    const rExpense = svgEl('rect', { x: xExpense, y: baseline - hExpense, width: barW, height: Math.max(hExpense, 1), rx: 2, fill: '#9C3B2D' });
    const tExpense = svgEl('title', {}); tExpense.textContent = `${m.label} — Despesas: ${brlPrecise.format(expenses[i])}`;
    rExpense.appendChild(tExpense);

    svg.appendChild(rIncome);
    svg.appendChild(rExpense);

    const monthLabel = svgEl('text', {
      x: cx, y: height - 6, 'text-anchor': 'middle', 'font-size': '9.5', fill: '#6B7263', 'font-family': 'Inter, sans-serif',
    });
    monthLabel.textContent = shortLabel(m.label);
    svg.appendChild(monthLabel);
  });

  container.appendChild(svg);
}

/* =========================================================
   MUTATIONS
========================================================= */

function addRowToGroup(groupKey) {
  const values = {};
  state.months.forEach(m => { values[m.id] = null; });
  state.groups[groupKey].push({ id: uid('r'), name: 'Novo item', values });
  saveState();
  renderGroups();
  renderTable();
  renderCharts();
}

function moveItem(groupKey, rowId, direction) {
  const arr = state.groups[groupKey];
  const idx = arr.findIndex(r => r.id === rowId);
  const newIdx = idx + direction;
  if (idx === -1 || newIdx < 0 || newIdx >= arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  saveState();
  renderGroups();
  renderTable();
}

function removeRow(groupKey, rowId) {
  state.groups[groupKey] = state.groups[groupKey].filter(r => r.id !== rowId);
  saveState();
  renderGroups();
  renderTable();
  renderHero();
  renderCharts();
}

function addMonth() {
  const prev = state.months[state.months.length - 1];
  const newMonth = { id: uid('m'), label: 'Novo mês' };
  state.months.push(newMonth);
  GROUP_ORDER.forEach(groupKey => {
    state.groups[groupKey].forEach(row => {
      // Despesas fixas costumam se repetir; demais começam em branco.
      row.values[newMonth.id] = groupKey === 'fixed' && prev ? (row.values[prev.id] ?? null) : null;
    });
  });
  activeMonthId = newMonth.id;
  saveState();
  renderAll();
}

function duplicateMonth() {
  const source = state.months.find(m => m.id === activeMonthId);
  if (!source) return;
  const newMonth = { id: uid('m'), label: 'Cópia de ' + source.label };
  state.months.push(newMonth);
  GROUP_ORDER.forEach(groupKey => {
    state.groups[groupKey].forEach(row => {
      row.values[newMonth.id] = row.values[source.id] ?? null;
    });
  });
  activeMonthId = newMonth.id;
  saveState();
  renderAll();
}

function removeMonth(monthId) {
  if (state.months.length <= 1) return;
  if (!confirm('Remover este mês e todos os valores lançados nele?')) return;
  state.months = state.months.filter(m => m.id !== monthId);
  if (activeMonthId === monthId) activeMonthId = state.months[state.months.length - 1].id;
  saveState();
  closeMonthMenu();
  renderAll();
}

/* =========================================================
   BACKUP
========================================================= */

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `livro-caixa-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.months || !parsed.groups) throw new Error('formato inválido');
      state = parsed;
      activeMonthId = state.months[state.months.length - 1]?.id;
      saveState();
      renderAll();
    } catch (e) {
      alert('Não foi possível importar este arquivo. Verifique se é um backup válido.');
    }
  };
  reader.readAsText(file);
}

/* =========================================================
   INIT
========================================================= */

function renderAll() {
  renderHero();
  renderGroups();
  renderTable();
  renderCharts();
}

document.getElementById('btnAddMonth').addEventListener('click', addMonth);
document.getElementById('btnDuplicateMonth').addEventListener('click', duplicateMonth);
document.getElementById('btnExport').addEventListener('click', exportBackup);
document.getElementById('fileImport').addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

setViewMode(viewMode);
renderAll();
