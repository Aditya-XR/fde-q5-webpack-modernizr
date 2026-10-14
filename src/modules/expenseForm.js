import { CATEGORIES, addExpense } from './store.js';
import { formatMonth } from './format.js';

/** Wires up the "Add an expense" form. Returns a render function for store updates. */
export function initExpenseForm(form) {
  const { title, amount, category } = form.elements;
  const monthLabel = form.closest('section').querySelector('[data-form-month]');

  category.append(...CATEGORIES.map((name) => new Option(name, name)));

  // Clear a custom error as soon as the user edits the field.
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const titleValue = title.value.trim();
    const paise = Math.round(Number(amount.value) * 100);

    title.setCustomValidity(titleValue ? '' : 'Enter what the expense was for.');
    amount.setCustomValidity(
      Number.isFinite(paise) && paise > 0 ? '' : 'Enter an amount greater than ₹0.',
    );
    if (!form.reportValidity()) return;

    addExpense({ title: titleValue, amount: paise, category: category.value });

    const chosenCategory = category.value;
    form.reset();
    category.value = chosenCategory; // people often add several in the same category
    title.focus();
  });

  return (state) => {
    monthLabel.textContent = formatMonth(state.month);
  };
}
