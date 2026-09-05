/* ---------------------------------------------------------
   Livro-Caixa — controle financeiro pessoal
   Dados ficam salvos no localStorage do navegador.
--------------------------------------------------------- */

const STORAGE_KEY = 'livroCaixa_v1';

const GROUP_META = {
  income:   { label: 'Rendimentos',        totalLabel: 'Total de rendimentos' },
  fixed:    { label: 'Despesas Fixas',      totalLabel: 'Total de despesas fixas' },
  variable: { label: 'Despesas Variáveis',  totalLabel: 'Total de despesas variáveis' },
};

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

/* ---------------- render: months nav ---------------- */

function renderMonthsNav() {
  const nav = document.getElementById('monthsNav');
  nav.innerHTML = '';
  state.months.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'month-tab' + (m.id === activeMonthId ? ' is-active' : '');
    btn.textContent = m.label;
    btn.addEventListener('click', () => { activeMonthId = m.id; renderMonthsNav(); renderSummary(); });
    nav.appendChild(btn);
  });
}

/* ---------------- render: sheet table ---------------- */

function renderHead() {
  const thead = document.getElementById('sheetHead');
  const tr = document.createElement('tr');
  tr.appendChild(document.createElement('th'));
  state.months.forEach(m => {
    const th = document.createElement('th');
    const wrap = document.createElement('div');
    wrap.className = 'month-head';
    const input = document.createElement('input');
    input.value = m.label;
    input.addEventListener('change', () => { m.label = input.value || m.label; saveState(); renderMonthsNav(); });
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
    renderFoot();
    renderSummary();
    renderCharts();
  });
  td.appendChild(input);
  return td;
}

function renderGroupRows(groupKey, tbody) {
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

function renderBody() {
  const tbody = document.getElementById('sheetBody');
  tbody.innerHTML = '';
  renderGroupRows('income', tbody);
  renderGroupRows('fixed', tbody);
  renderGroupRows('variable', tbody);
}

function renderFoot() {
  const tfoot = document.getElementById('sheetFoot');
  tfoot.innerHTML = '';

  // update the three group total rows in body too (in case values changed without full body re-render)
  ['income', 'fixed', 'variable'].forEach(groupKey => {
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

/* ---------------- render: summary sidebar ---------------- */

function renderSummary() {
  const m = state.months.find(x => x.id === activeMonthId) || state.months[state.months.length - 1];
  if (!m) return;
  const income = groupTotal('income', m.id);
  const expense = groupTotal('fixed', m.id) + groupTotal('variable', m.id);
  const saldo = income - expense;
  const cumulative = cumulativeSaldo(m.id);

  document.getElementById('sumBalanceHint').textContent = m.label;

  const balEl = document.getElementById('sumBalance');
  balEl.textContent = brlPrecise.format(saldo);
  balEl.classList.toggle('pos', saldo >= 0);
  balEl.classList.toggle('neg', saldo < 0);

  document.getElementById('sumIncome').textContent = brlPrecise.format(income);
  document.getElementById('sumExpense').textContent = brlPrecise.format(expense);

  const cumEl = document.getElementById('sumCumulative');
  cumEl.textContent = brlPrecise.format(cumulative);
  cumEl.style.color = cumulative >= 0 ? 'var(--positive)' : 'var(--negative)';
}

/* ---------------- charts ---------------- */

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
      data: { labels, datasets: [{ label: 'Saldo', data: saldos, backgroundColor: colors, borderRadius: 2, maxBarThickness: 42 }] },
      options: baseChartOptions('Saldo (R$)'),
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
          { label: 'Rendimentos', data: incomes, backgroundColor: '#A9803F', borderRadius: 2, maxBarThickness: 24 },
          { label: 'Despesas', data: expenses, backgroundColor: '#9C3B2D', borderRadius: 2, maxBarThickness: 24 },
        ],
      },
      options: baseChartOptions('R$', true),
    });
  } else {
    incomeExpenseChart.data.labels = labels;
    incomeExpenseChart.data.datasets[0].data = incomes;
    incomeExpenseChart.data.datasets[1].data = expenses;
    incomeExpenseChart.update();
  }
}

function baseChartOptions(axisLabel, showLegend) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: !!showLegend, labels: { font: { family: 'Inter', size: 11 }, color: '#5C6355' } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${brlPrecise.format(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 11 }, color: '#5C6355' } },
      y: {
        grid: { color: '#DDD0A8' },
        ticks: {
          font: { family: 'IBM Plex Mono', size: 10 }, color: '#5C6355',
          callback: (v) => brl.format(v),
        },
      },
    },
  };
}

/* ---------------- mutations ---------------- */

function addRowToGroup(groupKey) {
  const values = {};
  state.months.forEach(m => { values[m.id] = null; });
  state.groups[groupKey].push({ id: uid('r'), name: 'Novo item', values });
  saveState();
  renderBody();
  renderFoot();
  renderCharts();
}

function removeRow(groupKey, rowId) {
  state.groups[groupKey] = state.groups[groupKey].filter(r => r.id !== rowId);
  saveState();
  renderBody();
  renderFoot();
  renderSummary();
  renderCharts();
}

function addMonth() {
  const prev = state.months[state.months.length - 1];
  const newMonth = { id: uid('m'), label: 'Novo mês' };
  state.months.push(newMonth);
  ['income', 'fixed', 'variable'].forEach(groupKey => {
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
  renderAll();
}

/* ---------------- backup ---------------- */

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

/* ---------------- init ---------------- */

function renderAll() {
  renderMonthsNav();
  renderHead();
  renderBody();
  renderFoot();
  renderSummary();
  renderCharts();
}

document.getElementById('btnAddMonth').addEventListener('click', addMonth);
document.getElementById('btnExport').addEventListener('click', exportBackup);
document.getElementById('fileImport').addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

renderAll();
