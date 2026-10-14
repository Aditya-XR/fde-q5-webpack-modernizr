// Formatting helpers shared by every view (and by the lazily loaded report chunk).

const wholeRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const rupeesAndPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});
const percent = new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 0 });
const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

/** Formats an amount stored in paise, e.g. 125000 → "₹1,250" and 12550 → "₹125.50". */
export function formatMoney(paise) {
  return paise % 100 === 0 ? wholeRupees.format(paise / 100) : rupeesAndPaise.format(paise / 100);
}

export function formatPercent(ratio) {
  return percent.format(ratio);
}

function parseMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
}

/** "2026-10" → "October 2026" */
export function formatMonth(month) {
  const { year, monthIndex } = parseMonth(month);
  return monthName.format(new Date(year, monthIndex, 1));
}

/** shiftMonth("2026-01", -1) → "2025-12" */
export function shiftMonth(month, delta) {
  const { year, monthIndex } = parseMonth(month);
  const date = new Date(year, monthIndex + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Days to average over: the days elapsed so far for the current month, otherwise the whole month. */
export function daysCounted(month, today = new Date()) {
  const { year, monthIndex } = parseMonth(month);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
  return isCurrentMonth ? today.getDate() : daysInMonth;
}
