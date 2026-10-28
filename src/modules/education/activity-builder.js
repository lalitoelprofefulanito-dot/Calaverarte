/**
 * Actividades educativas construidas a partir de una calaverita.
 * Cada actividad es un objeto de datos que la vista convierte en una hoja
 * imprimible: { type, title, instructions, blocks, answerKey }.
 */
import { createRng } from '../../core/rng.js';
import { lastWord, normalizeForSearch, splitNames, joinNames } from '../../core/normalization.js';
import { schemeLetters } from '../literary-engine/rhyme-engine.js';
import { regenerateStanza } from '../literary-engine/engine.js';
import { VOCABULARY } from '../literary-engine/vocabulary.js';
import { evaluatePoem } from '../evaluator/evaluation-report.js';
import { getProfile } from './grade-profiles.js';

export const ACTIVITY_TYPES = [
  { id: 'completar', label: 'Completar versos' },
  { id: 'rimas', label: 'Encontrar palabras que riman' },
  { id: 'estructura', label: 'Identificar estrofas y versos' },
  { id: 'recursos', label: 'Reconocer recursos literarios' },
  { id: 'remate', label: 'Elegir un remate' },
  { id: 'ordenar', label: 'Ordenar estrofas' },
  { id: 'mejorar', label: 'Mejorar una composición' },
  { id: 'crear', label: 'Crear una calaverita a partir de una situación' },
  { id: 'revisar', label: 'Revisar con una guía de criterios' },
  { id: 'espacios', label: 'Versión con espacios para completar' },
];

const BLANK = '__________';
const LETTERS = 'ABCDEFGH';
const poemBlock = (title, stanzas) => ({ kind: 'poem', title, stanzas });

const SITUATIONS = {
  preescolar: ['La Catrina llega a jugar al recreo.', 'Una calaca quiere probar el pan de muerto.', 'La Calaca pierde su sombrero en el jardín.'],
  'primaria-baja': ['La Calaca visita la biblioteca y no quiere devolver un libro.', 'La Catrina llega al festival y quiere bailar.', 'La Muerte se confunde y entra al salón equivocado.'],
  'primaria-alta': ['La Muerte llega a la escuela el día del examen.', 'La Calaca quiere entrar al equipo de futbol.', 'La Catrina organiza una ofrenda y se le olvida algo importante.'],
  secundaria: ['La Muerte intenta usar redes sociales.', 'La Calaca llega a la junta de padres de familia.', 'La Muerte se inscribe al torneo escolar y hace trampa.'],
  general: ['La Muerte llega al trabajo en plena junta.', 'La Calaca se queda atorada en el tráfico.', 'La Catrina organiza la fiesta del barrio.'],
};

export function buildActivity(type, poem, { profileId = 'general', seed = 1 } = {}) {
  const profile = getProfile(profileId) || getProfile('general');
  const rng = createRng(seed);
  const builders = { completar, rimas, estructura, recursos, remate, ordenar, mejorar, crear, revisar, espacios };
  const builder = builders[type];
  if (!builder) throw new Error('Tipo de actividad desconocido.');
  const activity = builder(poem, profile, rng);
  return { type, profile: profile.id, title: ACTIVITY_TYPES.find((a) => a.id === type).label, ...activity };
}

function completar(poem, profile, rng) {
  const bank = [];
  const answers = [];
  const stanzas = poem.stanzas.map((s, i) => ({
    verses: s.verses.map((verse, j) => {
      if (j % 2 === 0 || !verse.trim()) return verse;
      const word = lastWord(verse);
      if (!word) return verse;
      bank.push(word);
      answers.push(`Estrofa ${i + 1}, verso ${j + 1}: ${word}`);
      const index = verse.toLowerCase().lastIndexOf(word);
      return `${verse.slice(0, index)}${BLANK}${verse.slice(index + word.length)}`;
    }),
  }));
  const young = profile.id === 'preescolar' || profile.id === 'primaria-baja';
  return {
    instructions: young
      ? 'Lee la calaverita. Escribe en cada línea la palabra del recuadro que suena igual que el final del verso de arriba.'
      : 'Completa cada verso con una palabra del banco. Fíjate en la rima y en el sentido de la historia.',
    blocks: [{ kind: 'list', title: 'Banco de palabras', items: rng.shuffle(bank), inline: true }, poemBlock(poem.title, stanzas)],
    answerKey: answers,
  };
}

function rhymePairs(poem) {
  const pairs = [];
  const scheme = poem.params?.scheme || 'pareada';
  poem.stanzas.forEach((s) => {
    const letters = schemeLetters(scheme === 'libre' ? 'pareada' : scheme, s.verses.length);
    const groups = {};
    [...letters].forEach((l, j) => { (groups[l] = groups[l] || []).push(lastWord(s.verses[j])); });
    Object.values(groups).forEach((words) => { if (words.length > 1 && words[0] !== words[1]) pairs.push(words.slice(0, 2)); });
  });
  return pairs;
}

function rimas(poem, profile, rng) {
  const pairs = rhymePairs(poem).slice(0, profile.id === 'preescolar' ? 4 : 8);
  const left = pairs.map((p) => p[0]);
  const right = rng.shuffle(pairs.map((p) => p[1]));
  return {
    instructions: profile.id === 'preescolar'
      ? 'Escuchen cada palabra de la columna A y busquen en la columna B la que suena igual al final. Únanlas con una línea.'
      : 'Une con una línea cada palabra de la columna A con la palabra de la columna B que rima con ella. Después escribe otra palabra que también rime.',
    blocks: [{ kind: 'table', headers: ['Columna A', 'Columna B', 'Otra palabra que rime'], rows: left.map((w, i) => [w, right[i] || '', '']) }],
    answerKey: pairs.map(([a, b]) => `${a} — ${b}`),
  };
}

function estructura(poem, profile) {
  const names = joinNames(splitNames(poem.params?.names || '')) || 'el protagonista';
  const figure = poem.engine?.figure || 'la Muerte';
  const questions = [
    ['¿Cuál es el título de la calaverita?', poem.title],
    ['¿Cuántas estrofas tiene?', String(poem.stanzas.length)],
    ['¿Cuántos versos tiene la primera estrofa?', String(poem.stanzas[0]?.verses.length || 0)],
    ['¿Cuántos versos tiene en total?', String(poem.stanzas.reduce((n, s) => n + s.verses.length, 0))],
    ['¿Quién es el protagonista?', names],
    ['¿Con qué nombre aparece la Muerte?', figure],
  ];
  if (profile.id !== 'preescolar' && profile.id !== 'primaria-baja') {
    questions.push(['¿En qué estrofa llega la Muerte?', String(1 + poem.stanzas.findIndex((s) => VOCABULARY.deathKeywords.some((k) => normalizeForSearch(s.verses.join(' ')).includes(k))))]);
    questions.push(['¿Cómo termina la historia? Explícalo con tus palabras.', 'Respuesta abierta.']);
  }
  return {
    instructions: 'Lee la calaverita y responde. Recuerda: un verso es cada renglón; una estrofa es un grupo de versos separado por un espacio.',
    blocks: [poemBlock(poem.title, poem.stanzas), { kind: 'questions', items: questions.map(([q]) => q) }],
    answerKey: questions.map(([q, a]) => `${q} ${a}`),
  };
}

function recursos(poem, profile) {
  const verses = poem.stanzas.flatMap((s) => s.verses);
  const figureVerses = verses.filter((v) => VOCABULARY.deathKeywords.some((k) => normalizeForSearch(v).includes(k))).slice(0, 3);
  const dialogue = verses.filter((v) => v.includes('«')).slice(0, 2);
  const items = [
    'Personificación: la Muerte actúa como una persona (llega, habla, baila, se ríe). Copia un verso donde ocurra y subraya la acción humana.',
    'Rima: escribe dos palabras finales que suenen igual.',
    'Humor: ¿qué parte de la calaverita es graciosa o inesperada? ¿Por qué?',
  ];
  if (dialogue.length) items.push('Diálogo: ¿quién habla en los versos entre comillas latinas « »? ¿Qué quiere?');
  if (profile.id === 'secundaria' || profile.id === 'general') {
    items.push('Hipérbole o exageración: localiza una exageración y explica su efecto.');
    items.push('Sátira: ¿la calaverita critica alguna costumbre o comportamiento? Argumenta tu respuesta.');
  }
  return {
    instructions: 'Lee la calaverita y localiza en ella los recursos literarios que se describen.',
    blocks: [poemBlock(poem.title, poem.stanzas), { kind: 'questions', items }],
    answerKey: [
      figureVerses.length ? `Personificación, ejemplos: ${figureVerses.join(' / ')}` : 'Personificación: respuesta abierta.',
      ...(dialogue.length ? [`Diálogo: ${dialogue.join(' / ')}`] : []),
      'Las demás preguntas son de respuesta abierta.',
    ],
  };
}

function remate(poem, profile, rng) {
  const lastIndex = poem.stanzas.length - 1;
  const draft = { ...structuredClone(poem), stanzas: poem.stanzas.map((s) => ({ ...s, locked: false })) };
  const options = [poem.stanzas[lastIndex].verses];
  for (let attempt = 1; options.length < 3 && attempt <= 6; attempt += 1) {
    try {
      const alt = regenerateStanza(draft, lastIndex, rng.int(2 ** 30) + attempt).verses;
      if (!options.some((o) => o.join('|') === alt.join('|'))) options.push(alt);
    } catch { /* sin alternativa: se usan las disponibles */ }
  }
  const shuffled = rng.shuffle(options.map((verses, i) => ({ verses, original: i === 0 })));
  return {
    instructions: 'Lee el inicio de la calaverita. Elige el remate (estrofa final) que te parezca mejor y explica por qué: ¿cuál rima mejor, cuál es más gracioso, cuál cierra mejor la historia?',
    blocks: [
      poemBlock(poem.title, poem.stanzas.slice(0, lastIndex)),
      { kind: 'options', items: shuffled.map((o, i) => ({ label: `Remate ${LETTERS[i]}`, verses: o.verses })) },
      { kind: 'lines', label: 'Elegí el remate ___ porque…', count: 3 },
    ],
    answerKey: [`Respuesta abierta. El remate original es el ${LETTERS[shuffled.findIndex((o) => o.original)]}.`],
  };
}

function ordenar(poem, profile, rng) {
  const labeled = poem.stanzas.map((s, i) => ({ verses: s.verses, position: i + 1 }));
  const shuffled = rng.shuffle(labeled);
  return {
    instructions: 'Las estrofas están desordenadas. Escribe en cada recuadro el número que le corresponde para que la historia tenga sentido: presentación, llegada de la Muerte, conflicto y final.',
    blocks: [
      { kind: 'title', text: poem.title },
      { kind: 'options', items: shuffled.map((s, i) => ({ label: `Estrofa ${LETTERS[i]} — orden: ____`, verses: s.verses })) },
    ],
    answerKey: shuffled.map((s, i) => `Estrofa ${LETTERS[i]}: ${s.position}`),
  };
}

function mejorar(poem) {
  const report = evaluatePoem(poem);
  const prompts = report.checks
    .filter((c) => c.status === 'revisar')
    .flatMap((c) => (c.suggestions.length ? c.suggestions.slice(0, 2).map((s) => s.text) : [c.detail]));
  const items = prompts.length ? prompts : ['La revisión automática no encontró problemas. Mejora el humor: cambia un verso para que el final sea más sorpresivo.'];
  items.push('Agrega un detalle nuevo sobre el protagonista que lo haga más reconocible.');
  return {
    instructions: 'Lee la calaverita y mejórala. Usa las pistas: cada una señala algo que puedes cambiar. Reescribe la versión mejorada en las líneas.',
    blocks: [poemBlock(poem.title, poem.stanzas), { kind: 'questions', title: 'Pistas para mejorar', items }, { kind: 'lines', label: 'Mi versión mejorada', count: 12 }],
    answerKey: ['Respuesta abierta. Las pistas provienen de la revisión automática aproximada.'],
  };
}

function crear(poem, profile, rng) {
  const options = rng.shuffle(SITUATIONS[profile.id] || SITUATIONS.general);
  return {
    instructions: 'Elige una situación (o inventa otra) y planea tu calaverita con el organizador. Después escríbela con al menos dos estrofas que rimen.',
    blocks: [
      { kind: 'list', title: 'Situaciones', items: options },
      { kind: 'organizer', rows: ['¿Quién es el protagonista?', '¿Qué lo hace especial?', '¿Dónde está?', '¿Cómo llega la Muerte?', '¿Qué hace el protagonista frente a la Muerte?', '¿Cómo termina? (remate)', 'Hilo conductor: ¿qué detalle del principio regresa al final?'] },
      { kind: 'lines', label: 'Mi calaverita', count: profile.id === 'preescolar' ? 4 : 10 },
    ],
    answerKey: null,
  };
}

function revisar(poem, profile) {
  const young = profile.id === 'preescolar' || profile.id === 'primaria-baja';
  const criteria = young
    ? ['Tiene título.', 'Dice quién es el protagonista.', 'Aparece la Catrina o la Calaca.', 'Las palabras del final suenan igual (riman).', 'Tiene un final.']
    : ['Tiene título relacionado con la historia.', 'Presenta al protagonista y una característica.', 'La Muerte interviene en la historia.', 'Hay un conflicto o situación graciosa.', 'El final retoma un detalle del principio (hilo conductor).', 'Respeta el esquema de rima elegido.', 'Los versos tienen una medida parecida.', 'Tiene un remate que cierra la historia.', 'No ofende ni lastima a nadie.', 'Ortografía y puntuación cuidadas.'];
  return {
    instructions: 'Usa esta guía para revisar tu calaverita o la de un compañero. Marca una casilla en cada criterio.',
    blocks: [{ kind: 'table', headers: ['Criterio', 'Lo logré', 'Casi', 'Necesito ayuda'], rows: criteria.map((c) => [c, '☐', '☐', '☐']) }, { kind: 'lines', label: 'Lo que voy a mejorar', count: 3 }],
    answerKey: null,
  };
}

function espacios(poem) {
  const stanzas = poem.stanzas.map((s) => ({ verses: s.verses.map((v, j) => (j === 0 ? v : BLANK.repeat(4))) }));
  return {
    instructions: 'Cada estrofa conserva solo su primer verso. Escribe los demás versos para continuar la historia; procura que rimen.',
    blocks: [poemBlock(poem.title, stanzas)],
    answerKey: [`Respuesta abierta. Versión original: ${poem.stanzas.map((s) => s.verses.join(' / ')).join(' // ')}`],
  };
}
