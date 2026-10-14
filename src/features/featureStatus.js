// Shows which month-picker path is active, so the feature detection is visible in a demo.

const MESSAGES = {
  native: {
    tone: 'good',
    icon: '✓',
    text: 'Native month picker. Modernizr found support for <input type="month">, so the fallback chunk was never downloaded.',
  },
  fallback: {
    tone: 'warning',
    icon: '!',
    text: 'No native month picker. Modernizr found no support, so the fallback chunk (flatpickr) was downloaded on demand.',
  },
  'plain-text': {
    tone: 'critical',
    icon: '×',
    text: 'The fallback picker could not be loaded, so this is a plain text field. Type the month as YYYY-MM.',
  },
};

export function showFeatureStatus(container, mode) {
  const message = MESSAGES[mode];
  const forced = document.documentElement.classList.contains('forced-fallback');

  container.dataset.tone = message.tone;
  container.querySelector('.status-icon').textContent = message.icon;
  container.querySelector('.status-text').textContent = forced
    ? `${message.text} (Forced with ?force-fallback.)`
    : message.text;
}
