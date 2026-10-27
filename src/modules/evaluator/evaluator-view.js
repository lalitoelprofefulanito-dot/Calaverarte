import { el, clear, formatDate } from '../../core/dom.js';
import { button, viewHeader, emptyState } from '../../core/ui-kit.js';
import { evaluatePoem } from './evaluation-report.js';
import { STATUS_LABELS } from './check.js';

const STATUS_ICON = { ok: '✓', revisar: '!', 'no-verificable': '?' };

export function renderEvaluation(app) {
  if (!app.session) {
    return el('div', {}, viewHeader('Evaluación'), emptyState('No hay ninguna calaverita abierta', 'Abre o genera una calaverita para revisarla.',
      [button('Crear una calaverita', { variant: 'primary', onClick: () => app.go('crear') }), button('Abrir la biblioteca', { onClick: () => app.go('biblioteca') })]));
  }
  const session = app.session;
  const results = el('div', { 'aria-live': 'polite' });
  const dismissed = new Set();

  function goToVerse(suggestion) {
    app.focusTarget = `${suggestion.stanzaIndex}-${suggestion.verseIndex}`;
    app.go('editor');
  }

  function render(report) {
    const summary = el('div', { class: 'summary' },
      ['ok', 'revisar', 'no-verificable'].map((s) => el('span', { class: `badge ${s === 'ok' ? 'badge--ok' : s === 'revisar' ? 'badge--warn' : 'badge--muted'}` },
        `${STATUS_ICON[s]} ${STATUS_LABELS[s]}: ${report.summary[s]}`)));
    const list = el('ul', { class: 'check-list' }, report.checks.map((c) => {
      const suggestions = c.suggestions.filter((_, i) => !dismissed.has(`${c.id}-${i}`));
      return el('li', { class: `check check--${c.status}` },
        el('span', { class: 'check__status' }, `${STATUS_ICON[c.status]} ${STATUS_LABELS[c.status]}`),
        el('h3', {}, c.label),
        el('p', {}, c.detail),
        suggestions.length ? el('ul', { class: 'suggestions', 'aria-label': `Sugerencias: ${c.label}` }, c.suggestions.map((s, i) => {
          if (dismissed.has(`${c.id}-${i}`)) return null;
          return el('li', {}, el('p', {}, s.text), el('div', { class: 'row' },
            Number.isInteger(s.stanzaIndex) ? button('Editar este verso', { small: true, variant: 'primary', onClick: () => goToVerse(s) }) : null,
            button('Descartar sugerencia', { small: true, onClick: () => { dismissed.add(`${c.id}-${i}`); render(report); } })));
        })) : null);
    }));
    clear(results).append(
      el('p', { class: 'hint' }, `Revisión del ${formatDate(report.createdAt)} sobre «${session.poem.title}».`),
      summary, list);
  }

  function evaluate() {
    const report = evaluatePoem(session.poem);
    session.poem.evaluation = report;
    render(report);
  }

  const node = el('div', {},
    viewHeader('Evaluación', 'Comprobaciones automáticas y aproximadas. No cambian tu texto: cada sugerencia la aceptas o la descartas tú.'),
    el('div', { class: 'notice' }, el('p', {}, 'Las reglas detectan problemas de estructura, rima, ritmo y repetición. El humor, la intención y la calidad literaria no se pueden medir con reglas: esas decisiones son tuyas.')),
    el('div', { class: 'row', style: { margin: '1rem 0' } }, button('Evaluar de nuevo', { variant: 'primary', iconName: 'refresh', onClick: evaluate }), button('Volver al editor', { onClick: () => app.go('editor') })),
    results);
  evaluate();
  return node;
}
