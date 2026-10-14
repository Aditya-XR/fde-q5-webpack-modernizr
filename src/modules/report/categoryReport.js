// Lazy chunk "report": loaded by reportPanel.js the first time the report is opened.
// Its CSS is imported here too, so MiniCssExtractPlugin emits it as a separate CSS chunk.
import './categoryReport.css';
import { expensesFor, totalOf } from '../store.js';
import { formatMoney, formatMonth, formatPercent } from '../format.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function groupByCategory(expenses) {
  const groups = new Map();
  for (const expense of expenses) {
    const group = groups.get(expense.category) ?? { category: expense.category, amount: 0, count: 0 };
    group.amount += expense.amount;
    group.count += 1;
    groups.set(expense.category, group);
  }
  return [...groups.values()].sort((a, b) => b.amount - a.amount);
}

function csvCell(value) {
  let text = String(value);
  // A leading = + - @ would make spreadsheet apps run the cell as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(expenses, month) {
  const rows = [
    ['Month', 'Title', 'Category', 'Amount (INR)', 'Added on'],
    ...expenses.map((expense) => [
      expense.month,
      expense.title,
      expense.category,
      (expense.amount / 100).toFixed(2),
      new Date(expense.createdAt).toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  // The byte-order mark makes Excel read the file as UTF-8.
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const link = element('a');
  link.href = url;
  link.download = `expenses-${month}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createTooltip(report) {
  const tooltip = element('div', 'report-tooltip');
  tooltip.setAttribute('aria-hidden', 'true'); // rows carry the same details in their aria-label
  const value = element('strong', 'tooltip-value');
  const label = element('span', 'tooltip-label');
  const detail = element('span', 'tooltip-detail');
  tooltip.append(value, label, detail);
  report.append(tooltip);

  return {
    show(row, group, share, clientX) {
      value.textContent = formatMoney(group.amount);
      label.textContent = group.category;
      detail.textContent = `${group.count} ${group.count === 1 ? 'entry' : 'entries'} · ${formatPercent(share)} of the month`;
      tooltip.classList.add('is-visible');

      const reportBox = report.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const anchorX = clientX ?? row.querySelector('.bar').getBoundingClientRect().right;
      const half = tooltip.offsetWidth / 2;
      const x = Math.min(Math.max(anchorX - reportBox.left, half), reportBox.width - half);
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${rowBox.top - reportBox.top}px`;
    },
    hide() {
      tooltip.classList.remove('is-visible');
    },
  };
}

export function renderCategoryReport(container, state) {
  const expenses = expensesFor(state.month, state.expenses);
  const total = totalOf(expenses);

  const report = element('div', 'report-body');
  const header = element('div', 'report-header');
  const titles = element('div');
  titles.append(
    element('h3', 'report-title', 'Spending by category'),
    element('p', 'report-sub', `${formatMonth(state.month)} · ${formatMoney(total)} in total`),
  );
  header.append(titles);
  report.append(header);

  if (expenses.length === 0) {
    report.append(element('p', 'empty-state', 'Add an expense to see the breakdown.'));
    container.replaceChildren(report);
    return;
  }

  const csvButton = element('button', 'btn btn-secondary', 'Download CSV');
  csvButton.type = 'button';
  csvButton.addEventListener('click', () => downloadCsv(expenses, state.month));
  header.append(csvButton);

  const groups = groupByCategory(expenses);
  const largest = groups[0].amount;
  const tooltip = createTooltip(report);

  const list = element('ul', 'bar-list');
  for (const group of groups) {
    const share = group.amount / total;
    const row = element('li', 'bar-row');
    row.tabIndex = 0;
    row.setAttribute(
      'aria-label',
      `${group.category}: ${formatMoney(group.amount)}, ${group.count} ${group.count === 1 ? 'entry' : 'entries'}, ${formatPercent(share)} of the month`,
    );

    const track = element('div', 'bar-track');
    const bar = element('div', 'bar');
    bar.style.setProperty('--ratio', String(group.amount / largest));
    track.append(bar, element('span', 'bar-value', formatMoney(group.amount)));

    row.append(element('span', 'bar-label', group.category), track, element('span', 'bar-share', formatPercent(share)));
    row.addEventListener('pointermove', (event) => tooltip.show(row, group, share, event.clientX));
    row.addEventListener('pointerleave', () => tooltip.hide());
    row.addEventListener('focus', () => tooltip.show(row, group, share));
    row.addEventListener('blur', () => tooltip.hide());
    list.append(row);
  }
  report.append(list);
  container.replaceChildren(report);
}
