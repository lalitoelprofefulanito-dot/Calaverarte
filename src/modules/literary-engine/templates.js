/**
 * Plantillas de verso: interpreta las etiquetas de rhyme-families.json y
 * rellena los huecos con los datos del protagonista.
 */
import familiesData from '../../data/rhyme-families.json';
import { capitalizeFirst, lastWord } from '../../core/normalization.js';

const SLOT_RE = /\{(\w+)\}/g;
const TONE_CODES = new Set(['tra', 'hum', 'inf', 'sat', 'tie', 'fan', 'nar']);
const ENDING_CODES = new Set(['L', 'E', 'F']);

/** Datos personales: usarlos aumenta la personalización. */
export const PERSONAL_SLOTS = ['gusto', 'cualidad', 'oficio', 'lugar', 'anecdota', 'elemento'];

export function parseLine(raw, familyId, stage, index) {
  const match = raw.match(/^\[([^\]]+)\]\s*/);
  const codes = match ? match[1].split(',').map((c) => c.trim()) : [];
  const text = match ? raw.slice(match[0].length) : raw;
  const slots = [...new Set([...text.matchAll(SLOT_RE)].map((m) => m[1]))];
  return {
    id: `${familyId}:${stage}:${index}`,
    familyId,
    stage,
    text,
    ending: codes.find((c) => ENDING_CODES.has(c)) || null,
    tones: codes.filter((c) => TONE_CODES.has(c)),
    adult: codes.includes('adu'),
    dialogue: codes.includes('dia') || text.includes('«'),
    closing: codes.includes('fin'),
    slots,
  };
}

let cache = null;

/** Familias con sus versos ya interpretados (se calculan una vez). */
export function getFamilies() {
  if (cache) return cache;
  cache = familiesData.families.map((family) => {
    const lines = {};
    for (const [stage, list] of Object.entries(family.lines)) {
      lines[stage] = list.map((raw, i) => parseLine(raw, family.id, stage, i));
    }
    return { id: family.id, gendered: Boolean(family.gendered), lines };
  });
  return cache;
}

/** ¿El contexto tiene todos los datos que exige el verso? */
export function slotsAvailable(line, slots) {
  return line.slots.every((slot) => slots[slot] !== null && slots[slot] !== undefined && slots[slot] !== '');
}

/** Rellena los huecos de un verso. */
export function fillLine(line, slots) {
  const filled = line.text.replace(SLOT_RE, (_, slot) => slots[slot] ?? '');
  return capitalizeFirst(filled.replace(/\s+/g, ' ').trim());
}

export function endWordOf(text) {
  return lastWord(text);
}
