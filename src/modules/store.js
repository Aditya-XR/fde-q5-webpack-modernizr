// Single source of truth for the app. Every change goes through this module, which saves
// to localStorage and notifies subscribers so all views stay in sync.

const STORAGE_KEY = 'fde-expense-tracker:v1';

export const CATEGORIES = ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];

const listeners = new Set();

let state = {
  month: currentMonth(),
  expenses: loadExpenses(),
};

export function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isValidExpense(expense) {
  return (
    expense !== null &&
    typeof expense === 'object' &&
    typeof expense.id === 'string' &&
    typeof expense.title === 'string' &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(expense.month) &&
    Number.isInteger(expense.amount) &&
    expense.amount > 0 &&
    CATEGORIES.includes(expense.category)
  );
}

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(isValidExpense) : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses));
  } catch {
    // Storage blocked or full: the app keeps working in memory for this visit.
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function update(changes, { persist = false } = {}) {
  state = { ...state, ...changes };
  if (persist) saveExpenses();
  listeners.forEach((listener) => listener(state));
}

export function getState() {
  return state;
}

/** Calls `listener(state)` now and after every change. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function setMonth(month) {
  if (month !== state.month) update({ month });
}

/** `amount` is in paise (integer) so totals never suffer from floating-point rounding. */
export function addExpense({ title, amount, category, month = state.month }) {
  const expense = { id: makeId(), month, title, amount, category, createdAt: Date.now() };
  update({ expenses: [...state.expenses, expense] }, { persist: true });
  return expense;
}

export function addExpenses(list) {
  const now = Date.now();
  // Older timestamps further down the list keep the given order in the newest-first view.
  const added = list.map((item, index) => ({ id: makeId(), month: state.month, createdAt: now - index, ...item }));
  update({ expenses: [...state.expenses, ...added] }, { persist: true });
}

export function removeExpense(id) {
  update({ expenses: state.expenses.filter((expense) => expense.id !== id) }, { persist: true });
}

export function expensesFor(month, expenses = state.expenses) {
  return expenses.filter((expense) => expense.month === month);
}

export function totalOf(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

// Keep several open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) update({ expenses: loadExpenses() });
});
