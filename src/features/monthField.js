// Feature detection + fallback for <input type="month">.
//
// Modernizr (inlined in <head>) has already tested the browser. Three outcomes:
//   'native'     – the browser's own month picker (Chrome, Edge, mobile browsers)
//   'fallback'   – no native support (desktop Firefox and Safari): a flatpickr month picker
//                  is downloaded as a separate chunk, only by these browsers
//   'plain-text' – the fallback chunk failed to load: a text field that accepts YYYY-MM
// Every mode reports the same "YYYY-MM" value, so the rest of the app never needs to know.

const MONTH_PATTERN = '\\d{4}-(0[1-9]|1[0-2])';

export function supportsNativeMonthInput() {
  return Boolean(window.Modernizr?.inputtypes?.month);
}

/**
 * @param {HTMLInputElement} input
 * @param {(month: string) => void} onChange called with "YYYY-MM"
 * @returns {Promise<{ mode: 'native' | 'fallback' | 'plain-text', setValue: (month: string) => void }>}
 */
export async function initMonthField(input, onChange) {
  let lastValid = input.value;

  input.addEventListener('change', () => {
    if (input.value && input.checkValidity()) {
      lastValid = input.value;
      onChange(input.value);
    } else if (!input.value) {
      input.value = lastValid; // an emptied field goes back to the month being shown
    } else {
      input.reportValidity();
    }
  });

  const setInputValue = (month) => {
    input.value = month;
    lastValid = month;
  };

  if (supportsNativeMonthInput()) {
    return { mode: 'native', setValue: setInputValue };
  }

  // Unsupported browsers already treat type="month" as a text box. Setting it explicitly
  // also covers ?force-fallback in a browser that does support it.
  input.type = 'text';
  input.placeholder = 'YYYY-MM';
  input.pattern = MONTH_PATTERN;
  input.title = 'Month as YYYY-MM, for example 2026-10';

  try {
    // No webpackPrefetch here on purpose: browsers with native support must never
    // download this chunk.
    const { enhanceMonthInput } = await import(
      /* webpackChunkName: "month-fallback" */ './fallback/monthPicker.js'
    );
    const picker = enhanceMonthInput(input);
    return {
      mode: 'fallback',
      setValue: (month) => {
        picker.setDate(month, false, 'Y-m');
        lastValid = month;
      },
    };
  } catch (error) {
    console.warn('Month picker fallback could not be loaded, using a plain text field.', error);
    return { mode: 'plain-text', setValue: setInputValue };
  }
}
