import { el, clear } from '../../core/dom.js';
import { button, viewHeader, field, select, checkbox } from '../../core/ui-kit.js';
import { PROFILES, getProfile } from './grade-profiles.js';
import { ACTIVITY_TYPES, buildActivity } from './activity-builder.js';
import { generatePoem } from '../generator/generation-service.js';
import { printContent, copyText } from '../export/print-service.js';
import { newSeed } from '../../core/rng.js';

const SAMPLE_NAMES = { preescolar: 'Lupita', 'primaria-baja': 'Mateo', 'primaria-alta': 'la maestra Rosa', secundaria: 'el prefecto Juan', general: 'Don Chucho' };

/** Hoja de actividad (pantalla e impresión). */
function renderSheet(activity, instructions, withKey) {
  const block = (b) => {
    switch (b.kind) {
      case 'poem': return el('div', { class: 'poem-block' }, b.title ? el('h3', {}, b.title) : null, b.stanzas.map((s) => el('div', { class: 'stanza' }, s.verses.map((v) => el('p', {}, v)))));
      case 'title': return el('h3', {}, b.text);
      case 'list': return el('div', {}, b.title ? el('h3', {}, b.title) : null, el('ul', { class: b.inline ? 'inline-list' : '' }, b.items.map((i) => el('li', {}, i))));
      case 'questions': return el('div', {}, b.title ? el('h3', {}, b.title) : null, el('ol', {}, b.items.map((q) => el('li', {}, el('p', {}, q), el('div', { class: 'write-line' })))));
      case 'table': return el('div', { class: 'table-scroll' }, el('table', {}, el('thead', {}, el('tr', {}, b.headers.map((h) => el('th', {}, h)))), el('tbody', {}, b.rows.map((r) => el('tr', {}, r.map((c) => el('td', {}, c)))))));
      case 'options': return el('div', {}, b.items.map((o) => el('div', { class: 'poem-block', style: { marginBottom: '1rem' } }, el('h3', {}, o.label), o.verses.map((v) => el('p', {}, v)))));
      case 'lines': return el('div', {}, el('p', {}, el('strong', {}, b.label)), Array.from({ length: b.count }, () => el('div', { class: 'write-line' })));
      case 'organizer': return el('table', {}, el('tbody', {}, b.rows.map((r) => el('tr', {}, el('th', { scope: 'row', style: { width: '40%' } }, r), el('td', {}, '\u00a0')))));
      default: return null;
    }
  };
  return el('article', { class: 'activity-sheet' },
    el('h2', {}, activity.title),
    el('p', {}, 'Nombre: ________________________________   Fecha: ______________'),
    el('p', {}, el('strong', {}, 'Instrucciones: '), instructions),
    activity.blocks.map(block),
    withKey && activity.answerKey?.length
      ? el('section', { class: 'answer-key' }, el('h3', {}, 'Clave de respuestas (para la persona docente)'), el('ul', {}, activity.answerKey.map((a) => el('li', {}, a))))
      : null);
}

function sheetToText(activity, instructions, withKey) {
  const lines = [activity.title, '', `Instrucciones: ${instructions}`, ''];
  for (const b of activity.blocks) {
    if (b.kind === 'poem') lines.push(b.title || '', ...b.stanzas.flatMap((s) => [...s.verses, '']));
    else if (b.kind === 'title') lines.push(b.text, '');
    else if (b.kind === 'list') lines.push(b.title || '', ...b.items.map((i) => `• ${i}`), '');
    else if (b.kind === 'questions') lines.push(b.title || '', ...b.items.map((q, i) => `${i + 1}. ${q}\n   ______________________________`), '');
    else if (b.kind === 'table') lines.push(b.headers.join(' | '), ...b.rows.map((r) => r.join(' | ')), '');
    else if (b.kind === 'options') b.items.forEach((o) => lines.push(o.label, ...o.verses, ''));
    else if (b.kind === 'lines') lines.push(b.label, ...Array.from({ length: b.count }, () => '______________________________'), '');
    else if (b.kind === 'organizer') lines.push(...b.rows.map((r) => `${r} ______________________`), '');
  }
  if (withKey && activity.answerKey?.length) lines.push('CLAVE DE RESPUESTAS', ...activity.answerKey);
  return lines.join('\n');
}

export function renderEducation(app) {
  const state = { seed: newSeed(), samplePoem: null, activity: null };
  const profileSelect = select(PROFILES, app.lastForm?.level && app.lastForm.level !== 'general' ? app.lastForm.level : 'primaria-baja');
  const typeSelect = select(ACTIVITY_TYPES, 'completar');
  const sourceSelect = select([
    { id: 'actual', label: app.session ? `La calaverita abierta: «${app.session.poem.title}»` : 'La calaverita abierta (no hay ninguna)' },
    { id: 'ejemplo', label: 'Una calaverita de ejemplo para este nivel' },
  ], app.session ? 'actual' : 'ejemplo');
  const keyToggle = checkbox('Incluir la clave de respuestas (se imprime en página aparte)', true);
  const instructions = el('textarea', { id: 'edu-instrucciones', rows: '4' });
  const guide = el('div', { class: 'notice' });
  const preview = el('div', { 'aria-live': 'polite' });

  function sourcePoem() {
    if (sourceSelect.value === 'actual' && app.session) return app.session.poem;
    const profile = getProfile(profileSelect.value);
    if (!state.samplePoem || state.samplePoem.params.level !== profile.id) {
      const r = profile.recommended;
      state.samplePoem = generatePoem({ names: SAMPLE_NAMES[profile.id], gender: profile.id === 'preescolar' || profile.id === 'primaria-alta' ? 'a' : 'o', tone: r.tone, stanzas: r.stanzas, verses: r.verses, scheme: r.scheme, audience: profile.id === 'general' ? 'general' : 'educativo', level: profile.id }, state.seed).poem;
    }
    return state.samplePoem;
  }

  function build({ keepInstructions = false } = {}) {
    try {
      if (sourceSelect.value === 'actual' && !app.session) sourceSelect.value = 'ejemplo';
      state.activity = buildActivity(typeSelect.value, sourcePoem(), { profileId: profileSelect.value, seed: state.seed });
      if (!keepInstructions) instructions.value = state.activity.instructions;
      const profile = getProfile(profileSelect.value);
      clear(guide).append(el('strong', {}, `Guía docente para ${profile.label}: `), profile.guide,
        profile.activities.includes(typeSelect.value) ? null : el('p', { style: { marginTop: '0.5rem' } }, 'Esta actividad no está entre las recomendadas para este nivel; revísala antes de usarla.'));
      clear(preview).append(renderSheet(state.activity, instructions.value, keyToggle.querySelector('input').checked));
    } catch (error) {
      app.reportError(error);
    }
  }

  profileSelect.addEventListener('change', () => { state.samplePoem = null; build(); });
  typeSelect.addEventListener('change', () => build());
  sourceSelect.addEventListener('change', () => build());
  keyToggle.querySelector('input').addEventListener('change', () => build({ keepInstructions: true }));
  instructions.addEventListener('input', () => build({ keepInstructions: true }));

  const node = el('div', {},
    viewHeader('Modo educativo', 'Hojas de trabajo imprimibles a partir de una calaverita, adaptadas a cada nivel. Las actividades no evalúan ni diagnostican a nadie: son material de apoyo.'),
    el('div', { class: 'split' },
      el('div', { class: 'card stack no-print' },
        field({ id: 'edu-perfil', label: 'Nivel', control: profileSelect }),
        field({ id: 'edu-tipo', label: 'Actividad', control: typeSelect }),
        field({ id: 'edu-fuente', label: 'Calaverita de base', control: sourceSelect }),
        field({ id: 'edu-instrucciones', label: 'Instrucciones (puedes editarlas)', control: instructions }),
        keyToggle,
        el('div', { class: 'row' },
          button('Otra versión de la actividad', { iconName: 'refresh', small: true, onClick: () => { state.seed = newSeed(); state.samplePoem = null; build(); } }),
          button('Imprimir', { variant: 'primary', iconName: 'print', small: true, onClick: () => printContent(renderSheet(state.activity, instructions.value, keyToggle.querySelector('input').checked)) }),
          button('Copiar como texto', { iconName: 'copy', small: true, onClick: async () => {
            const ok = await copyText(sheetToText(state.activity, instructions.value, keyToggle.querySelector('input').checked));
            app.toast(ok ? 'Actividad copiada al portapapeles.' : 'No se pudo copiar.', ok ? 'success' : 'error');
          } })),
        guide),
      el('div', {}, el('h2', {}, 'Vista previa'), preview)));
  build();
  return node;
}
