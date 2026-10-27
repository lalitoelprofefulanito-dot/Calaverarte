/** Repeticiones: versos idénticos y palabras de contenido demasiado frecuentes. */
import { STATUS, check } from './check.js';
import { normalizeForSearch, splitNames } from '../../core/normalization.js';
import { VOCABULARY } from '../literary-engine/vocabulary.js';

const STOP = new Set(VOCABULARY.stopwords.map(normalizeForSearch));
const DEATH = new Set(VOCABULARY.deathKeywords.map(normalizeForSearch));

export function checkRepetition(poem) {
  const verses = poem.stanzas.flatMap((s, i) => s.verses.map((v, j) => ({ v, i, j }))).filter(({ v }) => v.trim());
  const seen = new Map();
  const duplicates = [];
  for (const { v, i, j } of verses) {
    const key = normalizeForSearch(v);
    if (seen.has(key)) duplicates.push({ stanzaIndex: i, verseIndex: j, text: `El verso ${j + 1} de la estrofa ${i + 1} repite otro verso: cámbialo.` });
    else seen.set(key, true);
  }
  const names = new Set(splitNames(poem.params?.names || '').flatMap((n) => normalizeForSearch(n).split(' ')));
  const counts = new Map();
  for (const { v } of verses) {
    for (const word of normalizeForSearch(v).split(' ')) {
      if (word.length < 4 || STOP.has(word) || names.has(word) || DEATH.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(verses.length / 6));
  const frequent = [...counts.entries()].filter(([, n]) => n > threshold).sort((a, b) => b[1] - a[1]);
  return [
    duplicates.length === 0
      ? check('versos-repetidos', 'Versos repetidos', STATUS.OK, 'No hay versos idénticos.')
      : check('versos-repetidos', 'Versos repetidos', STATUS.REVIEW, `Hay ${duplicates.length} verso${duplicates.length === 1 ? '' : 's'} repetido${duplicates.length === 1 ? '' : 's'}.`, duplicates),
    frequent.length === 0
      ? check('palabras-repetidas', 'Palabras repetidas', STATUS.OK, `Ninguna palabra de contenido aparece más de ${threshold} veces.`)
      : check('palabras-repetidas', 'Palabras repetidas', STATUS.REVIEW,
        `Palabras muy repetidas: ${frequent.map(([w, n]) => `«${w}» (${n} veces)`).join(', ')}. Considera usar sinónimos.`),
  ];
}
