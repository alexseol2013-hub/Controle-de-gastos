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

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function seedData() {
  const monthLabels = ['Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Janeiro', 'Fevereiro', 'Fevereiro (2)'];
  const months = monthLabels.map((label, i) => ({ id: 'm' + (i + 1), label }));

  function row(name, vals) {
    const values = {};
    months.forEach((m, i) => { values[m.id] = vals[i] ?? null; });
    return { id: uid('r'), name, values };
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
        row('Casa', [null, null, 1460, 1460, 1460, 1460, 1460, 1460]),
        row('Gasolina', [null, 300, 350, 350, 350, 350, 350, 350]),
        row('Luz', [null, null, 350, 350, 350, 350, 350, 350]),
        row('Net', [null, null, 125, 125, 125, 125, 125, 125]),
        row('Condomínio', [null, null, 320, 320, 320, 320, 320, 320]),
        row('Barbeiro', [null, 45, 90, 90, 90, 90, 90, 90]),
        row('Faculdade Alex', [null, null, 270, 270, 270, 270, 270, 270]),
        row('Empréstimo', [null, null, 1497, 1497, 1497, 1497, 1497, 1497]),
        row('Bomba', [null, null, 500, null, 500, null, null, null]),
        row('Academia', [null, null, 250, 250, 250, 250, 250, 250]),
        row('Gatos', [null, null, 300, 300, 300, 300, 300, 300]),
        row('Remédios', [null, null, 200, 200, 200, 200, 200, 200]),
      ],
      variable: [
        row('Mercado', [null, 2500, 2500, 2500, 2500, 2500, 2500, 2500]),
        row('Cartão de crédito ailos', [null, null, 1100, 800, 700, 700, 700, 700]),
        row('Cartão de crédito mercado pago', [null, null, 2300, 1800, 1800, 1200, 1200, 1200]),
        row('Dani', [null, 70, 70, 70, 70, 70, 70, 70]),
        row('Rodrigo', [null, null, 25, 25, 25, 25, 25, 25]),
        row('Unha / sobrancelha', [null, null, 250, 250, 250, 250, 250, 250]),
        row('Empréstimo Pai', [null, null, 350, null, null, null, null, null]),
        row('Cartão caixa', [null, null, 250, 250, 250, 250, 250, 250]),
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
    item.addEventListener('click', () => { activeMonthId = m.id; closeMonthMenu(); renderHero(); renderGroups(); });
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
  if (idx > 0) { activeMonthId = state.months[idx - 1].id; renderHero(); renderGroups(); }
});
document.getElementById('nextMonth').addEventListener('click', () => {
  const idx = monthIndex(activeMonthId);
  if (idx < state.months.length - 1) { activeMonthId = state.months[idx + 1].id; renderHero(); renderGroups(); }
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

    state.groups[groupKey].forEach(row => {
      const itemRow = document.createElement('div');
      itemRow.className = 'itemRow';

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
      del.addEventListener('click', () => removeRow(groupKey, row.id));

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
   CHARTS
========================================================= */

let balanceChart, incomeExpenseChart;

function renderCharts() {
  const labels = state.months.map(m => m.label);
  const saldos = state.months.map(m => monthSaldo(m.id));
  const incomes = state.months.map(m => groupTotal('income', m.id));
  const expenses = state.months.map(m => groupTotal('fixed', m.id) + groupTotal('variable', m.id));
  const colors = saldos.map(s => s >= 0 ? '#2E6B4F' : '#9C3B2D');

  const balanceCtx = document.getElementById('chartBalance');
  if (!balanceChart) {
    balanceChart = new Chart(balanceCtx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Saldo', data: saldos, backgroundColor: colors, borderRadius: 4, maxBarThickness: 36 }] },
      options: baseChartOptions(),
    });
  } else {
    balanceChart.data.labels = labels;
    balanceChart.data.datasets[0].data = saldos;
    balanceChart.data.datasets[0].backgroundColor = colors;
    balanceChart.update();
  }

  const ieCtx = document.getElementById('chartIncomeExpense');
  if (!incomeExpenseChart) {
    incomeExpenseChart = new Chart(ieCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Rendimentos', data: incomes, backgroundColor: '#A9803F', borderRadius: 4, maxBarThickness: 20 },
          { label: 'Despesas', data: expenses, backgroundColor: '#9C3B2D', borderRadius: 4, maxBarThickness: 20 },
        ],
      },
      options: baseChartOptions(true),
    });
  } else {
    incomeExpenseChart.data.labels = labels;
    incomeExpenseChart.data.datasets[0].data = incomes;
    incomeExpenseChart.data.datasets[1].data = expenses;
    incomeExpenseChart.update();
  }
}

function baseChartOptions(showLegend) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: !!showLegend, labels: { font: { family: 'Inter', size: 11 }, color: '#6B7263' } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${brlPrecise.format(ctx.raw)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10.5 }, color: '#6B7263' } },
      y: {
        grid: { color: '#E4D9B8' },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#6B7263', callback: (v) => brl.format(v) },
      },
    },
  };
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
document.getElementById('btnExport').addEventListener('click', exportBackup);
document.getElementById('fileImport').addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

setViewMode(viewMode);
renderAll();
