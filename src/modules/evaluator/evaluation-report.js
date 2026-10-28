/** Orquesta todas las comprobaciones. Solo lee el poema: nunca lo modifica. */
import { checkStructure } from './structure-checker.js';
import { checkRepetition } from './repetition-checker.js';
import { checkRhyme, checkRhythm, checkOctosyllables } from './rhyme-checker.js';
import { checkContent } from './content-checker.js';
import { nowISO } from '../../core/ids.js';

export function evaluatePoem(poem) {
  const checks = [
    ...checkStructure(poem),
    ...checkRhyme(poem),
    ...checkRhythm(poem),
    checkOctosyllables(poem),
    ...checkRepetition(poem),
    ...checkContent(poem),
  ];
  const summary = { ok: 0, revisar: 0, 'no-verificable': 0 };
  checks.forEach((c) => { summary[c.status] += 1; });
  return { createdAt: nowISO(), summary, checks };
}
