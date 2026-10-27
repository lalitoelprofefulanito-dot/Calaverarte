/** Rima y ritmo según el esquema elegido (comprobación aproximada). */
import { STATUS, check } from './check.js';
import { schemeLetters, compareRhyme } from '../literary-engine/rhyme-engine.js';
import { checkStanzaRhythm } from '../literary-engine/rhythm-checker.js';
import { findRhymes } from '../literary-engine/vocabulary.js';
import { lastWord } from '../../core/normalization.js';

export function checkRhyme(poem) {
  const scheme = poem.params?.scheme || 'libre';
  if (scheme === 'libre') {
    return [check('rima', 'Rima', STATUS.OK, 'Elegiste rima libre: no se exige que los versos rimen.')];
  }
  const problems = [];
  let pairs = 0;
  let assonant = 0;
  poem.stanzas.forEach((stanza, i) => {
    const letters = schemeLetters(scheme, stanza.verses.length);
    const groups = new Map();
    [...letters].forEach((letter, j) => {
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(j);
    });
    for (const positions of groups.values()) {
      const [first, ...rest] = positions;
      for (const j of rest) {
        pairs += 1;
        const a = lastWord(stanza.verses[first]);
        const b = lastWord(stanza.verses[j]);
        const kind = compareRhyme(a, b);
        if (kind === 'asonante') assonant += 1;
        if (kind === 'identica') {
          problems.push({ stanzaIndex: i, verseIndex: j, text: `Estrofa ${i + 1}: los versos ${first + 1} y ${j + 1} terminan con la misma palabra («${b}»). Busca otra que rime.` });
        } else if (!kind) {
          const options = findRhymes(a).consonant.slice(0, 8);
          problems.push({
            stanzaIndex: i,
            verseIndex: j,
            text: `Estrofa ${i + 1}: «${a}» (verso ${first + 1}) y «${b}» (verso ${j + 1}) no riman.${options.length ? ` Palabras que riman con «${a}»: ${options.join(', ')}.` : ''}`,
          });
        }
      }
    }
  });
  if (problems.length) {
    return [check('rima', 'Rima', STATUS.REVIEW, `${problems.length} de ${pairs} parejas de versos no cumplen el esquema ${scheme}. La detección se basa en el sonido aproximado de las terminaciones.`, problems)];
  }
  return [check('rima', 'Rima', STATUS.OK,
    `Las ${pairs} parejas de versos coinciden en sonido según el esquema ${scheme}${assonant ? ` (${assonant} con rima asonante)` : ''}. Es una comprobación aproximada.`)];
}

export function checkRhythm(poem) {
  const flagged = [];
  poem.stanzas.forEach((stanza, i) => {
    checkStanzaRhythm(stanza.verses.filter((v) => v.trim())).forEach(({ index, metric, median, flagged: off }) => {
      if (off) flagged.push({ stanzaIndex: i, verseIndex: index, text: `Estrofa ${i + 1}, verso ${index + 1}: unas ${metric} sílabas métricas frente a unas ${median} en el resto de la estrofa.` });
    });
  });
  return [
    flagged.length
      ? check('ritmo', 'Ritmo (aproximado)', STATUS.REVIEW, `${flagged.length} verso${flagged.length === 1 ? '' : 's'} se alejan mucho de la medida de su estrofa. El conteo considera sinalefas y acento final, pero puede fallar con hiatos o licencias poéticas.`, flagged)
      : check('ritmo', 'Ritmo (aproximado)', STATUS.OK, 'Los versos de cada estrofa tienen medidas parecidas (diferencia de 3 sílabas o menos). Conteo aproximado.'),
  ];
}
