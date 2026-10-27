/** Gestor de vocabulario: figuras de la Muerte, títulos y banco de rimas. */
import vocabulary from '../../data/vocabulary.json';
import { getFamilies } from './templates.js';
import { compareRhyme } from './rhyme-engine.js';
import { stripAccents, lastWord } from '../../core/normalization.js';

export const VOCABULARY = vocabulary;

export function deathFiguresFor(tone) {
  return vocabulary.deathFigures[tone] || vocabulary.deathFigures.tradicional;
}

export function titlePatternsFor(tone) {
  return vocabulary.titlePatterns[tone] || vocabulary.titlePatterns.tradicional;
}

let bank = null;

/** Banco de palabras: lista propia + palabras finales de todas las plantillas. */
export function wordBank() {
  if (bank) return bank;
  const words = new Set(vocabulary.wordBank.map((w) => w.toLowerCase()));
  for (const family of getFamilies()) {
    for (const lines of Object.values(family.lines)) {
      for (const line of lines) {
        const word = lastWord(line.text.replace(/\{\w+\}/g, ''));
        if (word && word.length > 2) words.add(word);
      }
    }
  }
  bank = [...words].sort((a, b) => a.localeCompare(b, 'es'));
  return bank;
}

/** Palabras del banco que riman con la palabra dada. */
export function findRhymes(word) {
  const target = String(word).trim().toLowerCase();
  const consonant = [];
  const assonant = [];
  if (!target) return { consonant, assonant };
  for (const candidate of wordBank()) {
    if (stripAccents(candidate) === stripAccents(target)) continue;
    const kind = compareRhyme(target, candidate);
    if (kind === 'consonante') consonant.push(candidate);
    else if (kind === 'asonante') assonant.push(candidate);
  }
  return { consonant, assonant };
}

/** ¿El texto contiene alguna palabra no apta para público infantil? */
export function kidsUnsafeTerms(text) {
  const normalized = stripAccents(String(text).toLowerCase());
  return vocabulary.kidsAvoid.filter((term) => normalized.includes(stripAccents(term)));
}
