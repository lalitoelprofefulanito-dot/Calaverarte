import { el, clear, formatDate } from '../../core/dom.js';
import { button, viewHeader, emptyState, textInput } from '../../core/ui-kit.js';
import { getProvider } from '../../adapters/generation-provider.js';
import { saveVersion, restoreVersion, diffStates } from './version-service.js';
import { poemToPlainText } from '../../core/poem-model.js';
import { copyText } from '../export/print-service.js';
import { stagesByStanza } from '../literary-engine/narrative-builder.js';
import { STAGE_GUIDE } from '../workshop/formula.js';
import { meterOf } from '../literary-engine/rhythm-checker.js';

export function renderEditor(app) {
  if (!app.session) {
    return el('div', {}, viewHeader('Editor'), emptyState(
      'No hay ninguna calaverita abierta',
      'Genera una nueva o abre una de tu biblioteca para editarla verso por verso.',
      [button('Crear una calaverita', { variant: 'primary', onClick: () => app.go('crear') }), button('Abrir la biblioteca', { onClick: () => app.go('biblioteca') })],
    ));
  }
  const session = app.session;
  const root = el('div', { class: 'editor' });
  const stanzaList = el('div', { class: 'stanza-list' });
  const versionsPanel = el('section', { class: 'card', 'aria-labelledby': 'versiones-titulo' });
  const saveState = el('span', { class: 'save-state', role: 'status' });
  const titleInput = textInput(session.poem.title, { maxlength: '120', id: 'poem-title' });
  const undoBtn = button('Deshacer', { iconName: 'undo', small: true, onClick: () => { session.undo(); refreshAll(); } });
  const redoBtn = button('Rehacer', { iconName: 'redo', small: true, onClick: () => { session.redo(); refreshAll(); } });

  titleInput.addEventListener('input', () => { session.setTitle(titleInput.value); refreshToolbar(); });

  const run = (operation, after = refreshAll) => {
    try {
      operation();
      after();
    } catch (error) {
      app.toast(error.message, 'error');
    }
  };

  function refreshToolbar() {
    saveState.textContent = session.dirty ? 'Cambios sin guardar' : 'Guardado en este dispositivo';
    saveState.className = `save-state ${session.dirty ? 'save-state--dirty' : 'save-state--clean'}`;
    undoBtn.disabled = !session.canUndo;
    redoBtn.disabled = !session.canRedo;
  }

  function refreshAll({ focus } = {}) {
    if (titleInput.value !== session.poem.title) titleInput.value = session.poem.title;
    renderStanzas();
    renderVersions();
    refreshToolbar();
    if (focus) root.querySelector(focus)?.focus();
  }

  function renderStanzas() {
    const stages = stagesByStanza(session.poem.stanzas.map((s) => Math.max(1, s.verses.length)));
    clear(stanzaList).append(...session.poem.stanzas.map((stanza, i) => {
      const locked = stanza.locked;
      const count = session.poem.stanzas.length;
      const stageIds = [...new Set(stages[i])];
      const stageNames = stageIds.map((s) => STAGE_GUIDE[s].title.toLowerCase()).join(', ');
      const guide = el('details', { class: 'stanza-guide' },
        el('summary', {}, '¿Qué debe lograr esta estrofa?'),
        stageIds.map((s) => el('div', {},
          el('p', {}, el('strong', {}, `${STAGE_GUIDE[s].title}. `), STAGE_GUIDE[s].purpose),
          el('ul', {}, STAGE_GUIDE[s].questions.map((q) => el('li', {}, q))),
          el('p', { class: 'hint' }, `Consejo: ${STAGE_GUIDE[s].tip}`))),
        el('p', {}, el('a', { href: '#/taller' }, 'Ver la fórmula completa en el Taller literario')));
      const head = el('div', { class: 'stanza-card__head' },
        el('div', {},
          el('h3', { id: `est-${stanza.id}` }, `Estrofa ${i + 1}`),
          el('p', { class: 'hint' }, `Función sugerida: ${stageNames}.`),
          locked ? el('p', { class: 'lock-label' }, 'Bloqueada: no se puede editar ni regenerar.') : null,
          guide),
        el('div', { class: 'row' },
          button(locked ? 'Desbloquear' : 'Bloquear', { small: true, iconName: locked ? 'unlock' : 'lock', attrs: { 'aria-pressed': String(locked), 'aria-describedby': `est-${stanza.id}`, 'data-action': 'lock' }, onClick: () => run(() => session.toggleLock(i), () => refreshAll({ focus: `[data-stanza="${stanza.id}"] [data-action="lock"]` })) }),
          button('Regenerar', { small: true, iconName: 'refresh', attrs: { disabled: locked, 'aria-describedby': `est-${stanza.id}`, 'data-action': 'regenerate' }, onClick: () => regenerate(i) }),
          button(`Subir estrofa ${i + 1}`, { small: true, iconOnly: true, iconName: 'up', attrs: { disabled: i === 0 }, onClick: () => run(() => session.moveStanza(i, -1)) }),
          button(`Bajar estrofa ${i + 1}`, { small: true, iconOnly: true, iconName: 'down', attrs: { disabled: i === count - 1 }, onClick: () => run(() => session.moveStanza(i, 1)) }),
          button(`Añadir estrofa después de la ${i + 1}`, { small: true, iconOnly: true, iconName: 'plus', attrs: { disabled: count >= 8 }, onClick: () => run(() => session.addStanza(i)) }),
          button(`Eliminar estrofa ${i + 1}`, { small: true, iconOnly: true, iconName: 'trash', variant: 'danger', attrs: { disabled: locked || count <= 1 }, onClick: () => removeStanza(i) })));
      const verses = stanza.verses.map((verse, j) => {
        const input = textInput(verse, { readonly: locked, 'aria-label': `Verso ${j + 1} de la estrofa ${i + 1}`, maxlength: '300', dataset: { verse: `${i}-${j}` } });
        const meter = el('span', { class: 'verse-row__meter', title: 'Sílabas métricas aproximadas (la medida tradicional es 8)' });
        const showMeter = () => {
          const n = verse.trim() || input.value.trim() ? meterOf(input.value).metric : 0;
          meter.textContent = n ? `${n} síl.` : '—';
          meter.classList.toggle('is-off', n > 0 && Math.abs(n - 8) > 1);
        };
        showMeter();
        input.addEventListener('input', () => { try { session.setVerse(i, j, input.value); showMeter(); refreshToolbar(); } catch (error) { app.toast(error.message, 'error'); } });
        return el('div', { class: 'verse-row' },
          el('span', { class: 'verse-row__num', 'aria-hidden': 'true' }, String(j + 1)),
          input,
          meter,
          el('div', { class: 'row' },
            button(`Añadir verso después del ${j + 1} en la estrofa ${i + 1}`, { small: true, iconOnly: true, iconName: 'plus', attrs: { disabled: locked || stanza.verses.length >= 8 }, onClick: () => run(() => session.addVerse(i, j), () => refreshAll({ focus: `[data-verse="${i}-${j + 1}"]` })) }),
            button(`Quitar el verso ${j + 1} de la estrofa ${i + 1}`, { small: true, iconOnly: true, iconName: 'minus', attrs: { disabled: locked || stanza.verses.length <= 1 }, onClick: () => run(() => session.removeVerse(i, j)) })));
      });
      return el('section', { class: `stanza-card${locked ? ' is-locked' : ''}`, 'aria-labelledby': `est-${stanza.id}`, dataset: { stanza: stanza.id } }, head, verses);
    }));
  }

  function regenerate(index) {
    run(() => {
      const { verses, warnings } = getProvider('local').regenerateStanza(session.poem, index);
      session.replaceStanzaVerses(index, verses);
      app.toast(`Estrofa ${index + 1} regenerada. Puedes volver atrás con «Deshacer».`, 'success');
      warnings.forEach((w) => app.toast(w, 'warning'));
    });
  }

  async function removeStanza(index) {
    const ok = await app.confirm({ title: `¿Eliminar la estrofa ${index + 1}?`, message: 'Podrás recuperarla con «Deshacer» mientras no cierres la página.', confirmLabel: 'Eliminar estrofa', danger: true });
    if (ok) run(() => session.removeStanza(index));
  }

  async function save() {
    try {
      await app.saveSession();
      refreshToolbar();
      app.toast('Guardado en este dispositivo.', 'success');
    } catch (error) {
      app.reportError(error);
    }
  }

  async function saveNamedVersion() {
    const label = versionLabel.value.trim() || `Versión del ${formatDate(new Date().toISOString())}`;
    try {
      const next = saveVersion(session.poem, label);
      session.poem.versions = next.versions;
      await app.saveSession();
      versionLabel.value = '';
      refreshAll();
      app.toast(`Versión «${label}» guardada.`, 'success');
    } catch (error) {
      app.reportError(error);
    }
  }

  async function variant() {
    try {
      const backup = saveVersion(session.poem, 'Antes de la nueva variante');
      session.poem.versions = backup.versions;
      const result = getProvider('local').generateVariant(session.poem);
      session.applyVariant(result);
      await app.saveSession();
      refreshAll();
      app.toast('Nueva variante creada y guardada. La anterior quedó en «Versiones».', 'success');
      result.warnings.forEach((w) => app.toast(w, 'warning'));
    } catch (error) {
      app.reportError(error);
    }
  }

  async function copyAll() {
    const ok = await copyText(poemToPlainText(session.poem));
    app.toast(ok ? 'Texto copiado al portapapeles.' : 'No se pudo copiar. Selecciona el texto en la vista del diseñador.', ok ? 'success' : 'error');
  }

  const versionLabel = textInput('', { id: 'version-label', maxlength: '80', placeholder: 'Ejemplo: versión para el periódico mural' });
  const compareArea = el('div', { 'aria-live': 'polite' });

  function renderVersions() {
    const versions = [...(session.poem.versions || [])].reverse();
    clear(versionsPanel).append(
      el('h2', { id: 'versiones-titulo' }, `Versiones (${versions.length})`),
      el('div', { class: 'field' }, el('label', { for: 'version-label' }, 'Nombre de la versión (opcional)'), versionLabel),
      button('Guardar como versión', { iconName: 'save', onClick: saveNamedVersion }),
      versions.length
        ? el('ul', { class: 'version-list', style: { marginTop: '1rem' } }, versions.map((v) => el('li', {},
          el('span', {}, el('strong', {}, v.label), el('br'), el('span', { class: 'hint' }, formatDate(v.createdAt))),
          el('span', { class: 'row' },
            button('Comparar con el actual', { small: true, attrs: { 'aria-label': `Comparar «${v.label}» con el texto actual` }, onClick: () => compare(v) }),
            button('Restaurar', { small: true, attrs: { 'aria-label': `Restaurar «${v.label}»` }, onClick: () => restore(v) })))))
        : el('p', { class: 'hint', style: { marginTop: '1rem' } }, 'Aún no hay versiones. Se crean al guardar una versión, al generar una variante o al restaurar.'),
      compareArea);
  }

  function compare(version) {
    const diff = diffStates(version.snapshot, session.poem);
    const changes = diff.filter((d) => d.type !== 'same').length;
    clear(compareArea).append(
      el('h3', { style: { marginTop: '1rem' } }, `Diferencias entre «${version.label}» y el texto actual`),
      el('p', {}, changes ? `${changes} línea${changes === 1 ? '' : 's'} distinta${changes === 1 ? '' : 's'}.` : 'No hay diferencias.'),
      el('ul', { class: 'diff' }, diff.map((d) => el('li', { class: `diff--${d.type}` }, d.text || '\u00a0'))));
    compareArea.querySelector('h3').setAttribute('tabindex', '-1');
    compareArea.querySelector('h3').focus();
  }

  async function restore(version) {
    const ok = await app.confirm({
      title: `¿Restaurar «${version.label}»?`,
      message: 'El texto actual, incluidos los cambios sin guardar, se conservará como una versión nueva antes de restaurar.',
      confirmLabel: 'Restaurar versión',
    });
    if (!ok) return;
    try {
      const restored = restoreVersion(session.poem, version.id);
      session.apply((poem) => Object.assign(poem, restored));
      await app.saveSession();
      clear(compareArea);
      refreshAll();
      app.toast(`Se restauró «${version.label}».`, 'success');
    } catch (error) {
      app.reportError(error);
    }
  }

  const HOOK_LABELS = { gusto: 'su gusto', oficio: 'su oficio', lugar: 'el escenario', anecdota: 'la anécdota' };
  const hook = session.poem.engine?.hook;
  const hookValue = hook ? session.poem.params?.[hook] : '';
  const threadNote = hook && hookValue
    ? el('p', { class: 'notice thread-note' }, el('strong', {}, 'Hilo conductor: '), `${HOOK_LABELS[hook]} («${hookValue}»). Aparece al principio y regresa en el conflicto o el final. Si reescribes versos, procura conservarlo.`)
    : null;
  const warnings = app.pendingWarnings;
  app.pendingWarnings = [];
  const warningBox = warnings.length
    ? el('div', { class: 'notice notice--warn', role: 'status' }, el('strong', {}, 'Avisos del generador'), el('ul', {}, warnings.map((w) => el('li', {}, w))))
    : null;

  const toolbar = el('div', { class: 'editor-toolbar' },
    el('div', { class: 'field editor-title' }, el('label', { for: 'poem-title' }, 'Título'), titleInput),
    el('div', { class: 'row' },
      saveState,
      button('Guardar', { variant: 'primary', iconName: 'save', small: true, onClick: save }),
      undoBtn, redoBtn,
      button('Nueva variante', { small: true, iconName: 'refresh', onClick: variant }),
      button('Copiar texto', { small: true, iconName: 'copy', onClick: copyAll }),
      button('Evaluar', { small: true, onClick: () => app.go('evaluacion') }),
      button('Diseñar e imprimir', { small: true, iconName: 'print', onClick: () => app.go('disenador') })));

  const onKey = (event) => {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) { event.preventDefault(); if (session.undo()) refreshAll(); }
    else if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); if (session.redo()) refreshAll(); }
    else if (key === 's') { event.preventDefault(); save(); }
  };
  document.addEventListener('keydown', onKey);

  root.append(
    viewHeader('Editor', 'Cambia cualquier verso. Bloquea las estrofas que ya te gustan para que «Regenerar» y «Nueva variante» no las toquen. Atajos: Ctrl+Z deshacer, Ctrl+Y rehacer, Ctrl+S guardar.'),
    ...[warningBox, threadNote, toolbar, stanzaList, versionsPanel].filter(Boolean));
  refreshAll();
  if (app.focusVersions) {
    app.focusVersions = false;
    setTimeout(() => versionsPanel.scrollIntoView(), 0);
  }
  if (app.focusTarget) {
    const target = app.focusTarget;
    app.focusTarget = null;
    setTimeout(() => root.querySelector(`[data-verse="${target}"]`)?.focus(), 50);
  }
  return { node: root, cleanup: () => document.removeEventListener('keydown', onKey) };
}
