import { getState } from './store.js';

/**
 * The category report is code-split: its JS and CSS are a separate chunk that is only
 * requested the first time someone opens the report.
 *
 * webpackPrefetch adds <link rel="prefetch"> once the page has loaded, so the browser
 * fetches the chunk while idle and opening the report feels instant. That is the right
 * trade-off for a feature most visitors may use. The month-picker fallback is
 * deliberately NOT prefetched (see features/monthField.js).
 */
const loadReport = () =>
  import(/* webpackChunkName: "report", webpackPrefetch: true */ './report/categoryReport.js');

export function initReportPanel(toggle, container) {
  let open = false;
  let report = null;

  async function show() {
    if (!report) {
      container.textContent = 'Loading report…';
      try {
        report = await loadReport();
      } catch {
        container.textContent = 'The report could not be loaded. Check your connection and try again.';
        return;
      }
    }
    if (open) report.renderCategoryReport(container, getState());
  }

  toggle.addEventListener('click', () => {
    open = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Hide report' : 'Show report';
    container.hidden = !open;
    if (open) show();
  });

  return (state) => {
    if (open && report) report.renderCategoryReport(container, state);
  };
}
