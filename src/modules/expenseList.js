import { addExpenses, expensesFor, removeExpense } from './store.js';
import { formatMoney, formatMonth } from './format.js';
import { SAMPLE_EXPENSES } from './sampleData.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent, never innerHTML: titles are user input
  return node;
}

function renderEmpty(container, month) {
  const empty = element('div', 'empty-state');
  empty.append(element('p', '', `No expenses for ${formatMonth(month)} yet.`));
  const sampleButton = element('button', 'btn btn-secondary', 'Add sample expenses');
  sampleButton.type = 'button';
  sampleButton.dataset.action = 'add-samples';
  empty.append(sampleButton);
  container.replaceChildren(empty);
}

function renderRow(expense) {
  const row = element('li', 'expense-row');

  const info = element('div', 'expense-info');
  info.append(element('span', 'expense-title', expense.title));
  info.append(element('span', 'expense-category', expense.category));

  const remove = element('button', 'icon-button', '×');
  remove.type = 'button';
  remove.dataset.action = 'remove';
  remove.dataset.id = expense.id;
  remove.setAttribute('aria-label', `Delete ${expense.title}`);
  remove.title = 'Delete';

  row.append(info, element('span', 'expense-amount', formatMoney(expense.amount)), remove);
  return row;
}

/** Renders the month's expenses, newest first. Returns a render function for store updates. */
export function initExpenseList(container) {
  const countLabel = container.closest('section').querySelector('[data-list-count]');

  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'remove') removeExpense(button.dataset.id);
    if (button.dataset.action === 'add-samples') addExpenses(SAMPLE_EXPENSES);
  });

  return (state) => {
    const expenses = expensesFor(state.month, state.expenses).sort((a, b) => b.createdAt - a.createdAt);
    countLabel.textContent = expenses.length === 1 ? '1 entry' : `${expenses.length} entries`;

    if (expenses.length === 0) {
      renderEmpty(container, state.month);
      return;
    }
    const list = element('ul', 'expense-list');
    list.append(...expenses.map(renderRow));
    container.replaceChildren(list);
  };
}
