/**
 * Motor de rimas del español (aproximación por reglas).
 *
 * - Separa en sílabas ortográficas considerando diptongos, triptongos,
 *   hiatos con tilde y grupos consonánticos inseparables.
 * - Localiza la sílaba tónica con las reglas generales de acentuación.
 * - Compara terminaciones por su sonido aproximado (b/v, s/z/c suave,
 *   h muda, ll/y, qu/c dura), no solo por las últimas letras.
 *
 * Limitaciones documentadas: no conoce excepciones léxicas (p. ej. palabras
 * extranjeras), trata «h» intercalada como consonante al silabear y no
 * distingue variantes dialectales (seseo se asume siempre).
 */
import { stripAccents, removePunctuation } from '../../core/normalization.js';

const STRONG = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'í', 'ú']);
const WEAK = new Set(['i', 'u', 'ü']);
const ACCENTED = new Set(['á', 'é', 'í', 'ó', 'ú']);
const INSEPARABLE = new Set(['pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'pl', 'bl', 'cl', 'gl', 'fl', 'kr', 'kl', 'tl']);

const isVowelChar = (ch) => STRONG.has(ch) || WEAK.has(ch);

/** Convierte una palabra en unidades fonológicas: vocales y consonantes. */
function toUnits(word) {
  const w = word.toLowerCase();
  const units = [];
  for (let i = 0; i < w.length; i += 1) {
    const ch = w[i];
    const next = w[i + 1];
    const after = w[i + 2];
    if ((ch === 'c' && next === 'h') || (ch === 'l' && next === 'l') || (ch === 'r' && next === 'r')) {
      units.push({ t: 'C', s: ch + next });
      i += 1;
    } else if ((ch === 'q' || ch === 'g') && next === 'u' && (after === 'e' || after === 'i' || after === 'é' || after === 'í')) {
      units.push({ t: 'C', s: ch + next });
      i += 1;
    } else if (ch === 'y') {
      const isVowel = i === w.length - 1 || (next && !isVowelChar(next) && i > 0);
      units.push({ t: isVowel ? 'V' : 'C', s: isVowel ? 'i' : 'y', raw: 'y' });
    } else if (isVowelChar(ch)) {
      units.push({ t: 'V', s: ch });
    } else if (/\p{L}/u.test(ch)) {
      units.push({ t: 'C', s: ch });
    }
  }
  return units;
}

/** ¿Dos vocales contiguas forman diptongo? */
function formsDiphthong(a, b) {
  if ((a === 'í' || a === 'ú') || (b === 'í' || b === 'ú')) return false;
  const aWeak = WEAK.has(a);
  const bWeak = WEAK.has(b);
  if (!aWeak && !bWeak) return false;
  if (aWeak && bWeak) return a !== b;
  return true;
}

/** Separa una palabra en sílabas. Devuelve un arreglo de cadenas. */
export function syllabify(word) {
  const clean = removePunctuation(String(word)).replace(/\s+/g, '').toLowerCase();
  if (!clean) return [];
  const units = toUnits(clean);
  // Agrupa vocales contiguas en núcleos, separando hiatos.
  const groups = [];
  for (const unit of units) {
    const last = groups[groups.length - 1];
    if (unit.t === 'V' && last && last.t === 'N') {
      const prev = last.vowels[last.vowels.length - 1];
      if (formsDiphthong(prev, unit.s) && last.vowels.length < 3) {
        last.vowels.push(unit.s);
        last.text += unit.raw || unit.s;
        continue;
      }
      groups.push({ t: 'N', vowels: [unit.s], text: unit.raw || unit.s });
    } else if (unit.t === 'V') {
      groups.push({ t: 'N', vowels: [unit.s], text: unit.raw || unit.s });
    } else {
      groups.push({ t: 'C', text: unit.s });
    }
  }
  const nucleusIdx = groups.map((g, i) => (g.t === 'N' ? i : -1)).filter((i) => i >= 0);
  if (nucleusIdx.length === 0) return [clean];

  const syllables = [];
  let start = 0;
  for (let n = 0; n < nucleusIdx.length; n += 1) {
    const current = nucleusIdx[n];
    const nextNucleus = nucleusIdx[n + 1];
    if (nextNucleus === undefined) {
      syllables.push(groups.slice(start).map((g) => g.text).join(''));
      break;
    }
    const consonants = groups.slice(current + 1, nextNucleus).map((g) => g.text);
    let keep;
    if (consonants.length === 0) keep = 0;
    else if (consonants.length === 1) keep = 0;
    else if (consonants.length === 2) keep = INSEPARABLE.has(consonants.join('')) ? 0 : 1;
    else if (consonants.length === 3) keep = INSEPARABLE.has(consonants.slice(1).join('')) ? 1 : 2;
    else keep = 2;
    const end = current + 1 + keep;
    syllables.push(groups.slice(start, end).map((g) => g.text).join(''));
    start = end;
  }
  return syllables;
}

const hasWrittenAccent = (text) => /[áéíóú]/.test(text);

/**
 * Índice de la sílaba tónica (0 = primera). Reglas: tilde escrita; si no,
 * llana cuando termina en vocal, n o s; aguda en los demás casos.
 */
export function stressIndex(word) {
  const syllables = syllabify(word);
  if (syllables.length <= 1) return 0;
  const accented = syllables.findIndex(hasWrittenAccent);
  if (accented >= 0) return accented;
  const clean = removePunctuation(String(word)).trim().toLowerCase();
  const lastChar = clean[clean.length - 1];
  if (/[aeiouns]/.test(lastChar)) return syllables.length - 2;
  return syllables.length - 1;
}

/** aguda | llana | esdrujula | sobresdrujula */
export function stressType(word) {
  const syllables = syllabify(word);
  const fromEnd = syllables.length - 1 - stressIndex(word);
  return ['aguda', 'llana', 'esdrujula'][fromEnd] || 'sobresdrujula';
}

/** Transcripción fonética aproximada para comparar sonidos. */
export function phonetic(text) {
  return stripAccents(String(text).toLowerCase())
    .replace(/qu([ei])/g, 'k$1')
    .replace(/gu([ei])/g, 'g$1')
    .replace(/gü/g, 'gu')
    .replace(/c([ei])/g, 's$1')
    .replace(/z/g, 's')
    .replace(/c/g, 'k')
    .replace(/v/g, 'b')
    .replace(/ll/g, 'y')
    .replace(/h/g, '')
    .replace(/x/g, 'ks')
    .replace(/y$/g, 'i');
}

/** Posición de la vocal tónica dentro del núcleo de la sílaba tónica. */
function stressedVowelOffset(syllable) {
  const chars = [...syllable];
  const vowelPositions = chars.map((ch, i) => (isVowelChar(ch) || (ch === 'y' && i === chars.length - 1) ? i : -1)).filter((i) => i >= 0);
  if (vowelPositions.length === 0) return 0;
  const accented = vowelPositions.find((i) => ACCENTED.has(chars[i]));
  if (accented !== undefined) return accented;
  const strong = vowelPositions.find((i) => STRONG.has(chars[i]));
  if (strong !== undefined) return strong;
  return vowelPositions[vowelPositions.length - 1];
}

/** Clave de rima consonante: sonidos desde la vocal tónica hasta el final. */
export function rhymeKey(word) {
  const syllables = syllabify(word);
  if (syllables.length === 0) return '';
  const index = stressIndex(word);
  const stressed = syllables[index];
  const tail = stressed.slice(stressedVowelOffset(stressed)) + syllables.slice(index + 1).join('');
  return phonetic(tail);
}

/** Clave asonante: vocal tónica y última vocal (se ignoran las débiles de diptongo). */
export function assonantKey(word) {
  const key = rhymeKey(word);
  const vowels = key.replace(/[^aeiou]/g, '');
  if (vowels.length <= 1) return vowels;
  // Elimina vocales débiles que forman diptongo tras la tónica.
  const first = vowels[0];
  const last = vowels[vowels.length - 1];
  const lastPair = key.slice(-2);
  const finalVowel = /[iu][aeo]$/.test(lastPair) ? key.slice(-1) : last;
  return first + finalVowel;
}

/**
 * Compara dos palabras finales de verso.
 * Devuelve 'identica' | 'consonante' | 'asonante' | null.
 */
export function compareRhyme(wordA, wordB) {
  const a = removePunctuation(String(wordA)).trim().toLowerCase();
  const b = removePunctuation(String(wordB)).trim().toLowerCase();
  if (!a || !b) return null;
  if (stripAccents(a) === stripAccents(b)) return 'identica';
  if (rhymeKey(a) && rhymeKey(a) === rhymeKey(b)) return 'consonante';
  if (assonantKey(a) && assonantKey(a) === assonantKey(b)) return 'asonante';
  return null;
}

/** Esquema de letras para una estrofa de n versos. */
export function schemeLetters(scheme, n) {
  const letters = 'ABCDEFGH';
  if (scheme === 'libre') return Array.from({ length: n }, () => '-').join('');
  if (n === 2) return 'AA';
  let result = '';
  if (scheme === 'pareada') {
    for (let i = 0; i < n; i += 1) result += letters[Math.floor(i / 2)];
    if (n % 2 === 1) result = result.slice(0, -1) + result[result.length - 2];
  } else if (scheme === 'alternada') {
    let base = 0;
    let i = 0;
    while (i < n) {
      const remaining = n - i;
      if (remaining === 3) { result += letters[base] + letters[base + 1] + letters[base]; break; }
      if (remaining === 1) { result += result[result.length - 1]; break; }
      const block = Math.min(4, remaining);
      const pattern = block === 4 ? [0, 1, 0, 1] : [0, 0];
      result += pattern.map((p) => letters[base + p]).join('');
      base += 2;
      i += block;
    }
  } else if (scheme === 'abrazada') {
    let base = 0;
    let i = 0;
    while (i < n) {
      const remaining = n - i;
      if (remaining === 3) { result += letters[base] + letters[base + 1] + letters[base]; break; }
      if (remaining === 1) { result += result[result.length - 1]; break; }
      const block = Math.min(4, remaining);
      const pattern = block === 4 ? [0, 1, 1, 0] : [0, 0];
      result += pattern.map((p) => letters[base + p]).join('');
      base += 2;
      i += block;
    }
  }
  return result;
}
