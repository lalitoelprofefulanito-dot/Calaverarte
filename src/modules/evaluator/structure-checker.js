/** Estructura: número de estrofas y versos, versos vacíos. */
import { STATUS, check } from './check.js';

export function checkStructure(poem) {
  const params = poem.params || {};
  const results = [];
  const stanzaCount = poem.stanzas.length;
  const expected = params.stanzas;
  results.push(
    !expected || stanzaCount === expected
      ? check('estrofas', 'Número de estrofas', STATUS.OK, `El poema tiene ${stanzaCount} estrofa${stanzaCount === 1 ? '' : 's'}.`)
      : check('estrofas', 'Número de estrofas', STATUS.REVIEW, `Tiene ${stanzaCount} estrofas y se pidieron ${expected}.`),
  );
  const mismatched = poem.stanzas
    .map((s, i) => ({ i, n: s.verses.length }))
    .filter(({ n }) => params.verses && n !== params.verses);
  results.push(
    mismatched.length === 0
      ? check('versos', 'Versos por estrofa', STATUS.OK, params.verses ? `Todas las estrofas tienen ${params.verses} versos.` : 'Sin extensión de referencia.')
      : check('versos', 'Versos por estrofa', STATUS.REVIEW,
        `Estrofas con un número de versos distinto de ${params.verses}: ${mismatched.map(({ i, n }) => `estrofa ${i + 1} (${n})`).join(', ')}.`),
  );
  const empty = [];
  poem.stanzas.forEach((s, i) => s.verses.forEach((v, j) => { if (!v.trim() || v.trim() === '…') empty.push({ stanzaIndex: i, verseIndex: j, text: `Escribe el verso ${j + 1} de la estrofa ${i + 1}.` }); }));
  results.push(
    empty.length === 0
      ? check('vacios', 'Versos completos', STATUS.OK, 'No hay versos vacíos.')
      : check('vacios', 'Versos completos', STATUS.REVIEW, `Hay ${empty.length} verso${empty.length === 1 ? '' : 's'} vacío${empty.length === 1 ? '' : 's'}.`, empty),
  );
  return results;
}
