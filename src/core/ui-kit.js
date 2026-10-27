/** Piezas de interfaz reutilizables construidas con el constructor seguro. */
import { el, svgFromString } from './dom.js';

const ICONS = {
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  unlock: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  redo: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  starOutline: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8M8 21v-7h8v7"/></svg>',
  skull: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6C18 6 9 16 9 28c0 7 3 12 8 16v8c0 3 2 5 5 5h20c3 0 5-2 5-5v-8c5-4 8-9 8-16C55 16 46 6 32 6z" fill="#FFFBF0" stroke="#1E1D1A" stroke-width="3"/><circle cx="23" cy="29" r="7" fill="#1E1D1A"/><circle cx="41" cy="29" r="7" fill="#1E1D1A"/><circle cx="23" cy="29" r="2.6" fill="#D98E04"/><circle cx="41" cy="29" r="2.6" fill="#D98E04"/><path d="M32 36l-4 6h8z" fill="#1E1D1A"/><path d="M25 50v6M30 50v6M35 50v6M40 50v6" stroke="#1E1D1A" stroke-width="2.5"/><path d="M32 8c2 4 2 7 0 10-2-3-2-6 0-10z" fill="#B5175E"/></svg>',
};

export function icon(name) {
  return svgFromString(ICONS[name]);
}

export function button(label, { onClick, variant = 'secondary', iconName, small = false, iconOnly = false, attrs = {} } = {}) {
  const classes = ['btn', `btn--${variant}`];
  if (small) classes.push('btn--small');
  if (iconOnly) classes.push('btn--icon');
  return el('button', {
    type: 'button',
    class: classes.join(' '),
    'aria-label': iconOnly ? label : undefined,
    title: iconOnly ? label : undefined,
    on: onClick ? { click: onClick } : undefined,
    ...attrs,
  }, iconName ? icon(iconName) : null, iconOnly ? null : label);
}

/** Campo con etiqueta, ayuda y espacio para el mensaje de error. */
export function field({ id, label, hint, optional = false, control }) {
  const hintId = hint ? `${id}-ayuda` : null;
  const errorId = `${id}-error`;
  control.id = id;
  if (hintId) control.setAttribute('aria-describedby', hintId);
  const error = el('p', { class: 'field-error', id: errorId, hidden: true });
  return el('div', { class: 'field', dataset: { field: id } },
    el('label', { for: id }, label, optional ? el('span', { class: 'optional' }, ' (opcional)') : null),
    hint ? el('p', { class: 'hint', id: hintId }, hint) : null,
    control,
    error);
}

export function setFieldError(wrapper, message) {
  const control = wrapper.querySelector('input, select, textarea');
  const error = wrapper.querySelector('.field-error');
  const hint = wrapper.querySelector('.hint');
  if (message) {
    error.textContent = message;
    error.hidden = false;
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', [hint?.id, error.id].filter(Boolean).join(' '));
  } else {
    error.textContent = '';
    error.hidden = true;
    control.removeAttribute('aria-invalid');
    if (hint) control.setAttribute('aria-describedby', hint.id);
    else control.removeAttribute('aria-describedby');
  }
}

export function select(options, value, attrs = {}) {
  return el('select', attrs, options.map((o) => el('option', { value: String(o.id), selected: String(o.id) === String(value) }, o.label)));
}

export function textInput(value = '', attrs = {}) {
  const input = el('input', { type: 'text', autocomplete: 'off', ...attrs });
  input.value = value;
  return input;
}

export function checkbox(label, checked, attrs = {}) {
  const input = el('input', { type: 'checkbox', ...attrs });
  input.checked = Boolean(checked);
  return el('label', { class: 'choice' }, input, label);
}

export function viewHeader(title, text) {
  return el('header', { class: 'view-header' }, el('h1', { tabindex: '-1' }, title), text ? el('p', {}, text) : null);
}

export function emptyState(title, text, actions = []) {
  return el('div', { class: 'empty-state' }, el('h2', {}, title), el('p', {}, text), el('div', { class: 'row' }, actions));
}
