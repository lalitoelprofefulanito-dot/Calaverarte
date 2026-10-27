/**
 * Verificador aproximado del ritmo.
 *
 * Cuenta sílabas métricas con:
 * - sinalefa entre palabras (vocal final + vocal inicial, con «h» muda);
 * - ley del acento final (aguda +1, esdrújula −1).
 *
 * No resuelve: dialefas expresivas, sinéresis o diéresis voluntarias,
 * ni la sinalefa bloqueada por vocal tónica fuerte. Por eso los resultados
 * se presentan como «aproximados».
 */
import { syllabify, stressType } from './rhyme-engine.js';
import { tokenize } from '../../core/normalization.js';

const VOWEL_END = /[aeiouáéíóúü]$/;
const VOWEL_START = /^h?[aeiouáéíóúü]/;

/** Conteo de sílabas métricas de un verso. */
export function meterOf(verse) {
  const words = tokenize(verse).filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) return { syllables: 0, metric: 0, synalephas: 0, ending: null };
  let syllables = 0;
  let synalephas = 0;
  words.forEach((word, i) => {
    syllables += Math.max(1, syllabify(word).length);
    const next = words[i + 1];
    const endsInVowel = VOWEL_END.test(word) || word === 'y';
    if (next && endsInVowel && (VOWEL_START.test(next) || next === 'y') && !/^h[iu][aeo]/.test(next)) synalephas += 1;
  });
  const ending = stressType(words[words.length - 1]);
  const adjustment = ending === 'aguda' ? 1 : ending === 'esdrujula' || ending === 'sobresdrujula' ? -1 : 0;
  const metric = syllables - synalephas + adjustment;
  return { syllables, metric, synalephas, ending };
}

/** Mediana de sílabas métricas de una lista de versos. */
export function medianMeter(verses) {
  const values = verses.map((v) => meterOf(v).metric).filter((n) => n > 0).sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2);
}

/**
 * Revisa una estrofa: señala versos que se alejan más de `tolerance`
 * sílabas de la mediana de la estrofa.
 */
export function checkStanzaRhythm(verses, tolerance = 3) {
  const median = medianMeter(verses);
  return verses.map((verse, index) => {
    const { metric } = meterOf(verse);
    return { index, metric, median, offBy: metric - median, flagged: Math.abs(metric - median) > tolerance };
  });
}
