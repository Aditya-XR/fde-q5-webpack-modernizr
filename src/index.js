// Entry point: wires the modules together. Everything imported statically here ends up in
// the main bundle; the month-picker fallback and the category report are separate chunks
// loaded with import() only when needed.
import './styles/main.css';
import { getState, setMonth, subscribe } from './modules/store.js';
import { initExpenseForm } from './modules/expenseForm.js';
import { initExpenseList } from './modules/expenseList.js';
import { renderSummary } from './modules/summary.js';
import { initReportPanel } from './modules/reportPanel.js';
import { initMonthField } from './features/monthField.js';
import { showFeatureStatus } from './features/featureStatus.js';

const byId = (id) => document.getElementById(id);

async function start() {
  const renderForm = initExpenseForm(byId('expense-form'));
  const renderList = initExpenseList(byId('expense-list'));
  const renderReport = initReportPanel(byId('report-toggle'), byId('report'));
  const summary = byId('summary');

  subscribe((state) => {
    renderForm(state);
    renderList(state);
    renderSummary(summary, state);
    renderReport(state);
  });

  const monthInput = byId('month');
  monthInput.value = getState().month;

  const monthField = await initMonthField(monthInput, setMonth);
  showFeatureStatus(byId('feature-status'), monthField.mode);
  subscribe((state) => monthField.setValue(state.month));
}

start();
