/** Contenido: Muerte, protagonista, rasgos, desenlace, público y preferencias. */
import { STATUS, check } from './check.js';
import { normalizeForSearch, splitNames, collapseSpaces } from '../../core/normalization.js';
import { VOCABULARY, kidsUnsafeTerms } from '../literary-engine/vocabulary.js';
import { getProfile } from '../education/grade-profiles.js';

const STOP = new Set(VOCABULARY.stopwords.map(normalizeForSearch));
const contains = (haystack, needle) => ` ${haystack} `.includes(` ${normalizeForSearch(needle)} `);
const significantWords = (text) => normalizeForSearch(text).split(' ').filter((w) => w.length > 3 && !STOP.has(w));

export function checkContent(poem) {
  const params = poem.params || {};
  const text = normalizeForSearch(poem.stanzas.flatMap((s) => s.verses).join(' '));
  const firstStanza = normalizeForSearch((poem.stanzas[0]?.verses || []).join(' '));
  const lastStanza = normalizeForSearch((poem.stanzas[poem.stanzas.length - 1]?.verses || []).join(' '));
  const results = [];

  const deathHits = VOCABULARY.deathKeywords.filter((k) => contains(text, k));
  results.push(deathHits.length
    ? check('muerte', 'Presencia de la Muerte', STATUS.OK, `Aparece como: ${deathHits.join(', ')}.`)
    : check('muerte', 'Presencia de la Muerte', STATUS.REVIEW, 'No aparece la Muerte, la Calaca ni la Catrina. En una calaverita suele ser un personaje central.'));

  const names = splitNames(params.names || '');
  const missingNames = names.filter((n) => !contains(text, n));
  results.push(names.length === 0
    ? check('protagonista', 'Protagonista', STATUS.UNVERIFIABLE, 'No hay datos del protagonista con los que comparar.')
    : missingNames.length
      ? check('protagonista', 'Protagonista', STATUS.REVIEW, `No se menciona a: ${missingNames.join(', ')}.`)
      : check('protagonista', 'Protagonista', STATUS.OK, `Se menciona a ${names.join(', ')}.`));

  const traitFields = [['gusto', 'su gusto o hábito'], ['cualidad', 'su forma de ser'], ['oficio', 'su oficio'], ['lugar', 'el escenario'], ['anecdota', 'la anécdota'], ['defensa', 'lo que hace frente a la Muerte']];
  const provided = traitFields.filter(([field]) => collapseSpaces(params[field] || '') && !(field === 'oficio' && names.length > 1));
  const missingTraits = provided.filter(([field]) => {
    const words = significantWords(params[field]);
    return words.length > 0 && !words.some((w) => contains(text, w));
  });
  results.push(provided.length === 0
    ? check('rasgos', 'Características del protagonista', STATUS.UNVERIFIABLE, 'No se indicaron características.')
    : missingTraits.length
      ? check('rasgos', 'Características del protagonista', STATUS.REVIEW, `No se reconoce en el texto: ${missingTraits.map(([, label]) => label).join(', ')}.`)
      : check('rasgos', 'Características del protagonista', STATUS.OK, `Se incorporan ${provided.map(([, label]) => label).join(', ')}.`));

  const namedEarly = names.length === 0 || names.some((n) => contains(firstStanza, n)) || firstStanza.includes('pandilla');
  results.push(namedEarly && deathHits.length
    ? check('secuencia', 'Secuencia narrativa básica', STATUS.OK, 'El protagonista se presenta en la primera estrofa y después interviene la Muerte.')
    : check('secuencia', 'Secuencia narrativa básica', STATUS.REVIEW, namedEarly ? 'Falta la intervención de la Muerte.' : 'El protagonista no se presenta en la primera estrofa.'));

  const closure = VOCABULARY.closureKeywords.filter((k) => contains(lastStanza, k));
  results.push(closure.length
    ? check('desenlace', 'Desenlace', STATUS.OK, `La última estrofa contiene un cierre reconocible (${closure.slice(0, 3).join(', ')}).`)
    : check('desenlace', 'Desenlace', STATUS.REVIEW, 'La última estrofa no tiene un cierre reconocible (panteón, fiesta, escape, fin…). Revisa que la historia termine.'));

  const kids = params.tone === 'infantil' || (params.audience === 'educativo' && getProfile(params.level)?.kidsSafe);
  if (kids) {
    const unsafe = kidsUnsafeTerms(poem.stanzas.flatMap((s) => s.verses).join(' '));
    results.push(unsafe.length
      ? check('publico', 'Adecuación al público infantil', STATUS.REVIEW, `Contiene términos poco adecuados para niñas y niños: ${unsafe.join(', ')}.`)
      : check('publico', 'Adecuación al público infantil', STATUS.OK, 'No contiene términos de la lista de palabras no aptas. La lista no cubre todos los casos: revisa el sentido completo.'));
  } else {
    results.push(check('publico', 'Adecuación al público', STATUS.UNVERIFIABLE, 'Para público general la adecuación depende del contexto y de las personas mencionadas. Revísala tú.'));
  }

  const must = collapseSpaces(params.mustInclude || '').split(/\s*[,;]\s*/).filter(Boolean);
  const avoid = collapseSpaces(params.avoid || '').split(/\s*[,;]\s*/).filter(Boolean);
  const missing = must.filter((m) => !text.includes(normalizeForSearch(m)));
  const present = avoid.filter((a) => text.includes(normalizeForSearch(a)));
  if (must.length || avoid.length) {
    const problems = [missing.length ? `faltan: ${missing.join(', ')}` : '', present.length ? `aparecen palabras que pediste evitar: ${present.join(', ')}` : ''].filter(Boolean);
    results.push(problems.length
      ? check('preferencias', 'Elementos pedidos', STATUS.REVIEW, `En el texto ${problems.join('; ')}.`)
      : check('preferencias', 'Elementos pedidos', STATUS.OK, 'Aparecen los elementos pedidos y no aparecen los que pediste evitar.'));
  }

  results.push(check('calidad', 'Calidad literaria y coherencia global', STATUS.UNVERIFIABLE,
    'El humor, la originalidad, la intención y la coherencia completa del relato no se pueden medir con reglas. Léela en voz alta y decide.'));
  return results;
}
