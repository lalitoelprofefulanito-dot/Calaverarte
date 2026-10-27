/** Constructor narrativo: reparte las etapas del relato entre los versos. */
import patterns from '../../data/narrative-patterns.json';

export const STAGES = patterns.stages.map((s) => s.id);
export const STAGE_LABELS = Object.fromEntries(patterns.stages.map((s) => [s.id, s.label]));
export const ENDINGS = patterns.endings;
export const STAGE_FALLBACKS = patterns.stageFallbacks;

/** Etapa narrativa para cada verso del poema (en orden). */
export function assignStages(totalVerses) {
  if (totalVerses <= 0) return [];
  if (totalVerses === 1) return ['remate'];
  if (totalVerses === 2) return ['presentacion', 'remate'];
  if (totalVerses === 3) return ['presentacion', 'llegada', 'remate'];
  const short = patterns.shortArcs[String(totalVerses)];
  if (short) return [...short];
  return Array.from({ length: totalVerses }, (_, k) => STAGES[Math.floor((k * STAGES.length) / totalVerses)]);
}

/** Etapas de cada estrofa, dadas las longitudes de todas las estrofas. */
export function stagesByStanza(lengths) {
  const all = assignStages(lengths.reduce((a, b) => a + b, 0));
  const result = [];
  let offset = 0;
  for (const length of lengths) {
    result.push(all.slice(offset, offset + length));
    offset += length;
  }
  return result;
}

/** Elige el desenlace según la preferencia o el tono. */
export function chooseEnding(preference, tone, rng) {
  if (['L', 'E', 'F'].includes(preference)) return preference;
  const weights = patterns.endingWeightsByTone[tone] || patterns.endingWeightsByTone.narrativo;
  return rng.weighted(['L', 'E', 'F'], (id) => weights[id] || 0) || 'F';
}

export function toneCode(tone) {
  return patterns.toneCodes[tone] || 'nar';
}
