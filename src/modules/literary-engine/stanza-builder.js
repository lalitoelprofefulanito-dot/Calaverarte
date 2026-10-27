/**
 * Constructor de estrofas. Para cada grupo de versos que deben rimar entre
 * sí elige una familia de rima con versos adecuados a la etapa narrativa de
 * cada posición. Si no existe una combinación natural, no fuerza la rima:
 * usa versos sueltos y lo informa como advertencia.
 */
import { getFamilies, slotsAvailable, fillLine, endWordOf, PERSONAL_SLOTS } from './templates.js';
import { STAGE_FALLBACKS } from './narrative-builder.js';
import { schemeLetters } from './rhyme-engine.js';
import { stripAccents, normalizeForSearch } from '../../core/normalization.js';

/**
 * @param {object} options
 * @param {string[]} options.stages  etapa de cada verso
 * @param {string} options.scheme    pareada | alternada | abrazada | libre
 * @param {object} options.context   contexto creado por engine.buildContext
 * @param {object} options.memory    { texts:Set, endWords:Set, slotUses:Map, pendingElements:string[] }
 * @param {object} options.rng
 */
export function buildStanza({ stages, scheme, context, memory, rng, isFinalStanza = false }) {
  const finalPosition = isFinalStanza ? stages.length - 1 : -1;
  // La Muerte debe aparecer a más tardar en el último verso de llegada.
  const arrivalPosition = stages.lastIndexOf('llegada');
  const letters = schemeLetters(scheme, stages.length).split('');
  const verses = new Array(stages.length).fill(null);
  const warnings = [];
  const familiesInStanza = new Set();

  const groups = new Map();
  letters.forEach((letter, index) => {
    const key = letter === '-' ? `libre-${index}` : letter;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(index);
  });

  for (const positions of groups.values()) {
    const chosen = chooseGroup(positions, stages, context, memory, rng, familiesInStanza, positions.length > 1, false, finalPosition, verses, arrivalPosition);
    if (chosen) {
      chosen.forEach(({ position, line, text }) => commit(verses, position, line, text, memory, familiesInStanza));
      continue;
    }
    // Sin familia que cubra el grupo completo: versos sueltos, sin forzar rima.
    if (positions.length > 1) warnings.push('rima-no-disponible');
    for (const position of positions) {
      const single = chooseGroup([position], stages, context, memory, rng, familiesInStanza, false, false, finalPosition, verses, arrivalPosition)
        || chooseGroup([position], stages, context, memory, rng, new Set(), false, true, finalPosition, verses, arrivalPosition);
      if (single) single.forEach(({ line, text }) => commit(verses, position, line, text, memory, familiesInStanza));
      else {
        verses[position] = '…';
        warnings.push('verso-no-disponible');
      }
    }
  }
  return { verses: punctuate(verses), warnings };
}

// Palabras de enlace que no cuentan al comparar cómo empiezan los versos.
const LINKING = new Set(['y', 'e', 'pero', 'que', 'con', 'a', 'de', 'la', 'el', 'lo', 'le', 'se', 'en', 'por', 'su', 'ni', 'o', 'quien']);
const startsWithY = (text) => /^[¡¿«]*y\b/i.test(text);
const endsWithComma = (text) => /,\s*$/.test(text);
const ARRIVAL_VERB = /lleg|apareci|entr[oó]|sali[oó] de|baj[oó]|toc[oó]|son[oó]/i;

/** ¿Puede `next` seguir a `prev` dentro de la misma estrofa? */
function continues(prev, next) {
  if (!endsWithComma(prev.text)) return true;
  return !startsWithY(next.text) && !/^[¡¿«]/.test(next.text) && !next.line.slots.includes('N') && !next.line.slots.includes('figura') && !next.line.dialogue && !endsWithComma(next.text);
}

/** Comprueba la compatibilidad con los versos ya colocados a ambos lados. */
function neighbourOk(candidate, position, placed, picks) {
  const at = (i) => picks.find((p) => p.position === i) || (placed[i] ? { text: placed[i], line: placed.lines?.[i] || { slots: [], dialogue: false } } : null);
  const prev = at(position - 1);
  const next = at(position + 1);
  if (prev && !continues(prev, candidate)) return false;
  if (next && !continues(candidate, next)) return false;
  return true;
}

const firstWord = (text) => normalizeForSearch(text).split(' ').find((w) => !LINKING.has(w)) || '';

function commit(verses, position, line, text, memory, familiesInStanza) {
  verses[position] = text;
  if (!verses.lines) verses.lines = [];
  verses.lines[position] = line;
  if (line.stage === 'llegada' && line.slots.includes('figura')) memory.arrived = true;
  memory.texts.add(normalizeForSearch(text));
  memory.endWords.add(stripAccents(endWordOf(text)));
  familiesInStanza.add(line.familyId);
  for (const slot of line.slots) memory.slotUses.set(slot, (memory.slotUses.get(slot) || 0) + 1);
  if (line.dialogue) memory.slotUses.set('dialogo', (memory.slotUses.get('dialogo') || 0) + 1);
  for (const word of normalizeForSearch(text).split(' ')) if (word.length > 4) memory.wordCounts.set(word, (memory.wordCounts.get(word) || 0) + 1);
  if (line.slots.includes('elemento')) memory.pendingElements.shift();
}

function chooseGroup(positions, stages, context, memory, rng, familiesInStanza, needsRhyme, relaxed = false, finalPosition = -1, placed = [], arrivalPosition = -1) {
  const families = rng.shuffle(getFamilies()).filter((f) => relaxed || !familiesInStanza.has(f.id));
  const options = [];
  for (const family of families) {
    const usedEnds = new Set();
    const picks = [];
    let elementTaken = false;
    let score = 1;
    for (const position of positions) {
      const mustName = position === 0 && !memory.slotUses.has('N') && !elementTaken && picks.length === 0;
      const mustFigure = position === arrivalPosition && !memory.slotUses.has('figura') && !picks.some((p) => p.line.slots.includes('figura'));
      const arrived = memory.arrived || picks.some((p) => p.position < position && p.line.stage === 'llegada' && p.line.slots.includes('figura'));
      const candidates = candidatesFor(family, stages[position], context, memory, usedEnds, relaxed, arrived)
        .filter((c) => !(elementTaken && c.line.slots.includes('elemento')))
        .filter((c) => !mustName || c.line.slots.includes('N'))
        .filter((c) => !mustFigure || c.line.slots.includes('figura'))
        .filter((c) => !c.line.closing || position === finalPosition)
        .filter((c) => !picks.some((p) => firstWord(p.text) === firstWord(c.text)))
        .filter((c) => !(endsWithComma(c.text) && position === stages.length - 1))
        .filter((c) => neighbourOk(c, position, placed, picks))
        .filter((c) => ![placed[position - 1], placed[position + 1]].some((v) => v && firstWord(v) === firstWord(c.text)));
      if (candidates.length === 0) break;
      const figureTaken = picks.some((p) => p.line.slots.includes('figura'));
      const pick = rng.weighted(candidates, (c) => c.weight * (figureTaken && c.line.slots.includes('figura') ? 0.15 : 1));
      if (pick.line.slots.includes('elemento')) elementTaken = true;
      usedEnds.add(pick.endWord);
      picks.push({ position, line: pick.line, text: pick.text });
      score *= pick.weight;
    }
    if (picks.length === positions.length) {
      if (memory.pendingElements.length && picks.some((p) => p.line.slots.includes('elemento'))) score *= 25;
      options.push({ picks, score: Math.pow(score, 1 / positions.length) });
    }
    if (options.length >= 6) break;
  }
  if (options.length === 0) return null;
  if (!needsRhyme && options.length === 1) return options[0].picks;
  return rng.weighted(options, (o) => o.score).picks;
}

function candidatesFor(family, stage, context, memory, usedEnds, relaxed, arrived = false) {
  const stagesToTry = stage === 'llegada' && arrived
    ? [['conflicto', 1], ['llegada', 0.05]]
    : [[stage, 1], ...(STAGE_FALLBACKS[stage] || []).map((s) => [s, 0.25])];
  const result = [];
  for (const [tryStage, stageWeight] of stagesToTry) {
    for (const line of family.lines[tryStage] || []) {
      if (!lineAllowed(line, context, relaxed)) continue;
      const slots = {
        ...context.slots,
        N: memory.slotUses.has('N') && context.shortName ? context.shortName : context.slots.N,
        elemento: memory.pendingElements[0] ?? null,
      };
      if (!slotsAvailable(line, slots)) continue;
      // Cada dato personal se usa como máximo dos veces en todo el poema.
      if (!relaxed && line.slots.some((slot) => PERSONAL_SLOTS.includes(slot) && slot !== 'elemento' && (memory.slotUses.get(slot) || 0) >= 2)) continue;
      const text = fillLine(line, slots);
      const normalized = normalizeForSearch(text);
      const endWord = stripAccents(endWordOf(text));
      if (memory.texts.has(normalized) || usedEnds.has(endWord)) continue;
      if (context.avoid.some((word) => normalized.includes(word))) continue;
      const reusePenalty = memory.endWords.has(endWord) ? 0.12 : 1;
      const omenPenalty = arrived && line.stage === 'llegada' && !line.slots.includes('figura') ? 0.02 : 1;
      const repeatArrival = arrived && line.slots.includes('figura') && ARRIVAL_VERB.test(line.text) ? 0.05 : 1;
      const repeatedWords = normalized.split(' ').filter((w) => w.length > 4 && (memory.wordCounts.get(w) || 0) >= 2).length;
      const wordPenalty = repeatedWords ? 0.25 ** repeatedWords : 1;
      const dialoguePenalty = line.dialogue && !context.preferDialogue && (memory.slotUses.get('dialogo') || 0) >= 2 ? 0.1 : 1;
      result.push({ line, text, endWord, weight: wordPenalty * dialoguePenalty * weightOf(line, context, memory) * stageWeight * reusePenalty * omenPenalty * repeatArrival * (startsWithY(text) ? 0.6 : 1) });
    }
  }
  return result;
}

function lineAllowed(line, context, relaxed) {
  if (line.ending && line.ending !== context.ending) return false;
  if (line.adult && context.kidsSafe) return false;
  if (!relaxed && line.tones.length && !line.tones.includes(context.toneCode)) return false;
  return true;
}

function weightOf(line, context, memory) {
  let weight = 1;
  if (line.tones.includes(context.toneCode)) weight *= 3;
  if (line.ending) weight *= 1.5;
  if (line.dialogue && context.preferDialogue) weight *= 3;
  if (line.slots.includes('elemento')) weight *= 8;
  if (line.slots.includes('N')) {
    const uses = memory.slotUses.get('N') || 0;
    weight *= uses === 0 ? 3 : uses === 1 ? 0.6 : uses === 2 ? 0.15 : 0.05;
  }
  for (const slot of line.slots) {
    if (!PERSONAL_SLOTS.includes(slot) || slot === 'elemento') continue;
    weight *= (memory.slotUses.get(slot) || 0) === 0 ? 7 : 0.08;
  }
  if (line.slots.includes('figura') && (memory.slotUses.get('figura') || 0) >= 2) weight *= 0.4;
  return weight;
}

/** Puntuación final: cada estrofa termina con signo de cierre. */
function punctuate(verses) {
  const result = verses.map((v) => v ?? '…');
  const last = result.length - 1;
  if (last >= 0) {
    result[last] = result[last].replace(/[,;:]$/, '');
    if (!/[.!?»…]$/.test(result[last])) result[last] += '.';
  }
  return result;
}
