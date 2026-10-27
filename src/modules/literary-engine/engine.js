/**
 * Motor literario local de CalaverArte.
 *
 * Funciona con reglas, plantillas y vocabulario propios; no usa modelos de
 * lenguaje ni servicios externos. Sus composiciones son combinaciones
 * guiadas de versos con huecos, ordenadas por una estructura narrativa.
 */
import { createRng, newSeed } from '../../core/rng.js';
import { AppError } from '../../core/errors.js';
import { splitNames, joinNames, normalizeForSearch, collapseSpaces, capitalizeFirst } from '../../core/normalization.js';
import { stagesByStanza, chooseEnding, toneCode } from './narrative-builder.js';
import { buildStanza } from './stanza-builder.js';
import { deathFiguresFor, titlePatternsFor } from './vocabulary.js';
import { getProfile } from '../education/grade-profiles.js';

export const ENGINE_VERSION = 1;

const WARNING_MESSAGES = {
  'rima-no-disponible': 'En alguna estrofa no hubo una rima natural con los datos dados; esos versos quedaron sin rimar en lugar de forzar palabras.',
  'verso-no-disponible': 'Algún verso quedó vacío («…») porque las restricciones eliminaron todas las opciones. Escríbelo a mano o quita alguna palabra de la lista de evitar.',
};

/** Primera letra en minúscula si la frase va en medio del verso. */
function midSentence(text) {
  const clean = collapseSpaces(text || '');
  if (!clean) return null;
  if (clean.length > 1 && clean[1] === clean[1].toLowerCase()) return clean[0].toLowerCase() + clean.slice(1);
  return clean;
}

const splitList = (text) => collapseSpaces(text || '').split(/\s*[,;]\s*/).map((t) => t.trim()).filter(Boolean);

export function buildContext(params, { ending, figure }) {
  const names = splitNames(params.names);
  const isGroup = names.length > 1;
  const gender = isGroup ? 'a' : params.gender === 'a' ? 'a' : 'o';
  const profile = params.audience === 'educativo' ? getProfile(params.level) : null;
  return {
    names,
    ending,
    figure,
    toneCode: toneCode(params.tone),
    kidsSafe: params.tone === 'infantil' || Boolean(profile?.kidsSafe),
    preferDialogue: Boolean(params.preferDialogue),
    avoid: splitList(params.avoid).map(normalizeForSearch).filter(Boolean),
    mustInclude: splitList(params.mustInclude),
    shortName: isGroup ? 'la pandilla' : null,
    slots: {
      N: isGroup ? `la pandilla de ${joinNames(names)}` : names[0],
      o: gender,
      el: gender === 'a' ? 'ella' : 'él',
      lo: gender === 'a' ? 'la' : 'lo',
      oficio: midSentence(params.oficio),
      gusto: midSentence(params.gusto),
      cualidad: midSentence(params.cualidad),
      lugar: midSentence(params.lugar),
      anecdota: midSentence(params.anecdota),
      figura: figure,
    },
  };
}

function newMemory(context, existingVerses = []) {
  const memory = { texts: new Set(), endWords: new Set(), slotUses: new Map(), wordCounts: new Map(), pendingElements: [] };
  const existingText = normalizeForSearch(existingVerses.join(' '));
  for (const verse of existingVerses) {
    memory.texts.add(normalizeForSearch(verse));
    for (const word of normalizeForSearch(verse).split(' ')) if (word.length > 4) memory.wordCounts.set(word, (memory.wordCounts.get(word) || 0) + 1);
  }
  memory.arrived = existingVerses.some((v) => normalizeForSearch(v).includes(normalizeForSearch(context.figure)));
  memory.pendingElements = context.mustInclude.filter((item) => !existingText.includes(normalizeForSearch(item)));
  return memory;
}

function collectWarnings(codes, context, memory) {
  const messages = [...new Set(codes)].map((code) => WARNING_MESSAGES[code]).filter(Boolean);
  if (memory.pendingElements.length) {
    messages.push(`No se pudo incorporar de forma natural: ${memory.pendingElements.join(', ')}. Añádelo a mano en el editor.`);
  }
  const userData = normalizeForSearch([context.slots.N, context.slots.gusto, context.slots.cualidad, context.slots.oficio, context.slots.lugar, context.slots.anecdota].join(' '));
  const conflicts = context.avoid.filter((word) => userData.includes(word));
  if (conflicts.length) {
    messages.push(`Restricciones incompatibles: pediste evitar «${conflicts.join(', ')}», pero aparece en los datos del protagonista.`);
  }
  return messages;
}

function makeTitle(params, context, rng) {
  const pattern = rng.pick(titlePatternsFor(params.tone));
  // Con varios nombres el sujeto es «la pandilla de…», que concuerda en singular.
  const subject = context.names.length > 1 ? context.slots.N : joinNames(context.names);
  return capitalizeFirst(pattern.replace('{N}', subject));
}

/** Genera una calaverita completa. */
export function generate(params, seed = newSeed()) {
  const rng = createRng(seed);
  const ending = chooseEnding(params.ending, params.tone, rng);
  const figure = rng.pick(deathFiguresFor(params.tone));
  const context = buildContext(params, { ending, figure });
  const memory = newMemory(context);
  const lengths = Array.from({ length: params.stanzas }, () => params.verses);
  const codes = [];
  const stageList = stagesByStanza(lengths);
  const stanzas = stageList.map((stages, i) => {
    const result = buildStanza({ stages, scheme: params.scheme, context, memory, rng, isFinalStanza: i === stageList.length - 1 });
    codes.push(...result.warnings);
    return { verses: result.verses };
  });
  return {
    title: makeTitle(params, context, rng),
    stanzas,
    engine: { seed, ending, figure, engineVersion: ENGINE_VERSION },
    warnings: collectWarnings(codes, context, memory),
  };
}

/** Regenera una sola estrofa; las bloqueadas no se tocan. */
export function regenerateStanza(poem, index, seed = newSeed()) {
  const target = poem.stanzas[index];
  if (!target) throw new AppError('La estrofa indicada no existe.');
  if (target.locked) throw new AppError('La estrofa está bloqueada. Desbloquéala para regenerarla.', { code: 'STANZA_LOCKED' });
  const rng = createRng(seed);
  const context = buildContext(poem.params, { ending: poem.engine?.ending || 'F', figure: poem.engine?.figure || 'la Catrina' });
  const others = poem.stanzas.filter((_, i) => i !== index).flatMap((s) => s.verses);
  const memory = newMemory(context, others);
  const lengths = poem.stanzas.map((s) => Math.max(1, s.verses.length));
  const stages = stagesByStanza(lengths)[index];
  const result = buildStanza({ stages, scheme: poem.params.scheme, context, memory, rng, isFinalStanza: index === poem.stanzas.length - 1 });
  return { verses: result.verses, warnings: collectWarnings(result.warnings, context, memory) };
}

/**
 * Nueva variante del poema completo. Conserva estrofas bloqueadas y, si
 * existen, también el desenlace y la figura para no romper la coherencia.
 */
export function generateVariant(poem, seed = newSeed()) {
  const rng = createRng(seed);
  const hasLocked = poem.stanzas.some((s) => s.locked);
  const ending = hasLocked || !poem.engine ? poem.engine?.ending || chooseEnding(poem.params.ending, poem.params.tone, rng) : chooseEnding(poem.params.ending, poem.params.tone, rng);
  const figure = hasLocked && poem.engine?.figure ? poem.engine.figure : rng.pick(deathFiguresFor(poem.params.tone));
  const context = buildContext(poem.params, { ending, figure });
  const lockedVerses = poem.stanzas.filter((s) => s.locked).flatMap((s) => s.verses);
  const memory = newMemory(context, lockedVerses);
  const lengths = poem.stanzas.map((s) => Math.max(1, s.verses.length));
  const stageList = stagesByStanza(lengths);
  const codes = [];
  const stanzas = poem.stanzas.map((stanza, i) => {
    if (stanza.locked) return structuredClone(stanza);
    const result = buildStanza({ stages: stageList[i], scheme: poem.params.scheme, context, memory, rng, isFinalStanza: i === stageList.length - 1 });
    codes.push(...result.warnings);
    return { ...structuredClone(stanza), verses: result.verses };
  });
  return { stanzas, engine: { seed, ending, figure, engineVersion: ENGINE_VERSION }, warnings: collectWarnings(codes, context, memory) };
}
