import { expensesFor, totalOf } from './store.js';
import { daysCounted, formatMoney, formatMonth, formatPercent, shiftMonth } from './format.js';

function tile(label, value, detail) {
  const node = document.createElement('div');
  node.className = 'kpi';
  const labelNode = document.createElement('span');
  labelNode.className = 'kpi-label';
  labelNode.textContent = label;
  const valueNode = document.createElement('span');
  valueNode.className = 'kpi-value';
  valueNode.textContent = value;
  node.append(labelNode, valueNode);
  if (detail) node.append(detail);
  return node;
}

function detailText(text) {
  const node = document.createElement('span');
  node.className = 'kpi-detail';
  node.textContent = text;
  return node;
}

/** Change against the previous month. For spending, going up is the bad direction. */
function deltaDetail(total, previousTotal, previousMonth) {
  const name = formatMonth(previousMonth);
  if (previousTotal === 0) return detailText(`No data for ${name}`);

  const change = (total - previousTotal) / previousTotal;
  if (Math.abs(change) < 0.005) return detailText(`Same as ${name}`);

  const node = document.createElement('span');
  const up = change > 0;
  node.className = `kpi-detail kpi-delta ${up ? 'is-bad' : 'is-good'}`;
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = up ? '▲' : '▼';
  node.append(icon, ` ${formatPercent(Math.abs(change))} ${up ? 'more' : 'less'} than ${name}`);
  return node;
}

export function renderSummary(container, state) {
  const expenses = expensesFor(state.month, state.expenses);
  const total = totalOf(expenses);
  const previousMonth = shiftMonth(state.month, -1);
  const previousTotal = totalOf(expensesFor(previousMonth, state.expenses));
  const largest = expenses.reduce((max, expense) => (expense.amount > (max?.amount ?? 0) ? expense : max), null);

  container.replaceChildren(
    tile('Total spent', formatMoney(total), deltaDetail(total, previousTotal, previousMonth)),
    tile('Entries', String(expenses.length)),
    tile('Largest expense', largest ? formatMoney(largest.amount) : '–', largest ? detailText(largest.title) : null),
    tile('Daily average', formatMoney(Math.round(total / daysCounted(state.month)))),
  );
}
