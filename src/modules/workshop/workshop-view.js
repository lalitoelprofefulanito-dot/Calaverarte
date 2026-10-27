import { el, clear } from '../../core/dom.js';
import { viewHeader, field, textInput } from '../../core/ui-kit.js';
import { syllabify, stressIndex, stressType, rhymeKey, assonantKey, schemeLetters } from '../literary-engine/rhyme-engine.js';
import { meterOf } from '../literary-engine/rhythm-checker.js';
import { findRhymes } from '../literary-engine/vocabulary.js';
import { tokenize } from '../../core/normalization.js';
import { STAGE_LABELS, STAGES } from '../literary-engine/narrative-builder.js';

const TYPE_LABEL = { aguda: 'aguda', llana: 'llana (grave)', esdrujula: 'esdrújula', sobresdrujula: 'sobresdrújula' };

function syllableView(word) {
  const syllables = syllabify(word);
  const stressed = stressIndex(word);
  return el('span', { class: 'syllables' }, syllables.map((s, i) => el('span', { class: `syl${i === stressed ? ' syl--stress' : ''}` }, s)));
}

export function renderWorkshop() {
  const rhymeInput = textInput('calavera', { id: 'rima-palabra', maxlength: '40' });
  const rhymeOut = el('div', { 'aria-live': 'polite' });
  function showRhymes() {
    const word = tokenize(rhymeInput.value)[0] || '';
    clear(rhymeOut);
    if (!word) { rhymeOut.append(el('p', { class: 'field-error' }, 'Escribe una palabra.')); return; }
    const { consonant, assonant } = findRhymes(word);
    rhymeOut.append(
      el('p', {}, 'Sílabas: ', syllableView(word), ` · palabra ${TYPE_LABEL[stressType(word)]} · terminación que rima: «-${rhymeKey(word)}» · vocales de la asonancia: «${assonantKey(word)}»`),
      el('h3', {}, `Rima consonante (${consonant.length})`),
      consonant.length ? el('ul', { class: 'word-list' }, consonant.slice(0, 60).map((w) => el('li', {}, w))) : el('p', {}, 'No hay palabras del banco con esa terminación exacta. Prueba con la rima asonante.'),
      el('h3', {}, `Rima asonante (${assonant.length})`),
      assonant.length ? el('ul', { class: 'word-list' }, assonant.slice(0, 60).map((w) => el('li', {}, w))) : el('p', {}, 'Sin coincidencias en el banco de palabras.'));
  }

  const verseInput = textInput('La Muerte llegó una noche', { id: 'verso-medida', maxlength: '200' });
  const verseOut = el('div', { 'aria-live': 'polite' });
  function showMeter() {
    clear(verseOut);
    const words = tokenize(verseInput.value).filter((w) => /\p{L}/u.test(w));
    if (!words.length) { verseOut.append(el('p', { class: 'field-error' }, 'Escribe un verso.')); return; }
    const m = meterOf(verseInput.value);
    const adjust = m.ending === 'aguda' ? '+1 por terminar en aguda' : m.ending === 'esdrujula' ? '−1 por terminar en esdrújula' : 'sin ajuste (termina en llana)';
    verseOut.append(
      el('p', { class: 'syllables' }, words.map((w) => el('span', { style: { marginRight: '0.6em' } }, syllableView(w)))),
      el('p', {}, `Sílabas gramaticales: ${m.syllables} · sinalefas: ${m.synalephas} · ${adjust}.`),
      el('p', {}, el('strong', {}, `Medida aproximada: ${m.metric} sílabas métricas`), m.metric === 8 ? ' (octosílabo, la medida más común en calaveritas).' : '.'),
      el('p', { class: 'hint' }, 'El conteo no resuelve todos los hiatos ni las licencias poéticas. Léelo en voz alta para confirmar.'));
  }
  const form = (onSubmit, ...children) => el('form', { class: 'card', novalidate: true, on: { submit: (e) => { e.preventDefault(); onSubmit(); } } }, ...children);

  const node = el('div', { class: 'stack' },
    viewHeader('Taller literario', 'Herramientas para escribir a mano: rimas, medida de los versos y estructura.'),
    el('div', { class: 'grid grid--2' },
      form(showRhymes, el('h2', {}, 'Buscador de rimas'),
        field({ id: 'rima-palabra', label: 'Palabra', hint: 'Busca en un banco de unas 400 palabras de la app.', control: rhymeInput }),
        el('button', { type: 'submit', class: 'btn btn--primary' }, 'Buscar rimas'), rhymeOut),
      form(showMeter, el('h2', {}, 'Contador de sílabas'),
        field({ id: 'verso-medida', label: 'Verso', control: verseInput }),
        el('button', { type: 'submit', class: 'btn btn--primary' }, 'Contar sílabas'), verseOut)),
    el('section', { class: 'card' }, el('h2', {}, 'Esquemas de rima'),
      el('p', {}, 'Las letras iguales marcan los versos que riman entre sí.'),
      el('div', { class: 'table-scroll' }, el('table', { class: 'activity-sheet', style: { padding: 0 } },
        el('thead', {}, el('tr', {}, el('th', {}, 'Esquema'), el('th', {}, '4 versos'), el('th', {}, 'Ejemplo'))),
        el('tbody', {},
          [['Pareada', 'pareada', 'Llegó la Calaca un día / con mucha puntería…'], ['Alternada', 'alternada', 'el verso 1 rima con el 3, y el 2 con el 4'], ['Abrazada', 'abrazada', 'el 1 rima con el 4, y el 2 con el 3'], ['Libre', 'libre', 'los versos no están obligados a rimar']]
            .map(([label, id, example]) => el('tr', {}, el('td', {}, label), el('td', {}, schemeLetters(id, 4).replace(/-/g, '—')), el('td', {}, example))))))),
    el('section', { class: 'card' }, el('h2', {}, 'Estructura de una calaverita'),
      el('ol', {}, STAGES.map((s) => el('li', {}, STAGE_LABELS[s]))),
      el('p', {}, 'No todas siguen este orden, pero casi todas presentan a alguien, hacen intervenir a la Muerte y cierran con un remate gracioso o inesperado.')));
  showRhymes();
  showMeter();
  return node;
}
