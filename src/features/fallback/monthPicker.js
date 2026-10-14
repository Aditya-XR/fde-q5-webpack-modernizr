// Lazy chunk "month-fallback": only browsers without <input type="month"> download it.
// webpack puts flatpickr (from node_modules) in its own async vendor chunk and the CSS
// below in a separate CSS file, all fetched together when this module is imported.
import flatpickr from 'flatpickr';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect/index.js';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/plugins/monthSelect/style.css';
import './monthPicker.css';

/** Turns a plain text input into a month picker that keeps its value as "YYYY-MM". */
export function enhanceMonthInput(input) {
  const picker = flatpickr(input, {
    // On phones flatpickr would otherwise swap in a native date input, which is the wrong control.
    disableMobile: true,
    // People see "October 2026"; the real input (now hidden) keeps "2026-10" like a native one.
    altInput: true,
    plugins: [monthSelectPlugin({ shorthand: true, dateFormat: 'Y-m', altFormat: 'F Y' })],
  });

  // Point the existing <label> at the visible field so it stays accessible.
  if (picker.altInput) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    picker.altInput.id = `${input.id}-display`;
    if (label) label.htmlFor = picker.altInput.id;
  }
  return picker;
}
