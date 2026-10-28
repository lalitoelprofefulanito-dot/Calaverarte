/** Esquema y validación de los parámetros de generación. */
import { sanitizeText, splitNames } from '../../core/normalization.js';
import { hasLetters } from '../../core/validation.js';
import { getProfile } from '../education/grade-profiles.js';
import { checkPhrases } from './phrase-guide.js';

export const TONES = [
  { id: 'tradicional', label: 'Tradicional mexicano' },
  { id: 'humoristico', label: 'Humorístico' },
  { id: 'infantil', label: 'Infantil y escolar' },
  { id: 'satirico', label: 'Satírico' },
  { id: 'tierno', label: 'Tierno y familiar' },
  { id: 'fantastico', label: 'Fantástico' },
  { id: 'narrativo', label: 'Narrativo' },
];

export const SCHEMES = [
  { id: 'pareada', label: 'Pareada (AABB)' },
  { id: 'alternada', label: 'Alternada (ABAB)' },
  { id: 'abrazada', label: 'Abrazada (ABBA)' },
  { id: 'libre', label: 'Libre (sin rima obligatoria)' },
];

export const ENDING_OPTIONS = [
  { id: 'auto', label: 'Que lo decida el tono' },
  { id: 'L', label: 'La Muerte se lo lleva (tradicional)' },
  { id: 'E', label: 'Escapa de la Muerte' },
  { id: 'F', label: 'Termina en fiesta con la Muerte' },
];

export const LIMITS = { stanzas: [2, 8], verses: [2, 8], names: 3, text: 120 };

export const DEFAULT_PARAMS = Object.freeze({
  names: '',
  gender: 'o',
  oficio: '',
  gusto: '',
  cualidad: '',
  lugar: '',
  anecdota: '',
  defensa: '',
  tone: 'tradicional',
  audience: 'general',
  level: 'general',
  stanzas: 4,
  verses: 4,
  scheme: 'alternada',
  ending: 'auto',
  preferDialogue: false,
  mustInclude: '',
  avoid: '',
});

const TEXT_FIELDS = ['names', 'oficio', 'gusto', 'cualidad', 'lugar', 'anecdota', 'defensa', 'mustInclude', 'avoid'];

/**
 * Valida y normaliza los parámetros. Nunca lanza: devuelve
 * { ok, params, errors } con un mensaje por campo.
 */
export function validateParams(raw = {}) {
  const errors = {};
  const params = { ...DEFAULT_PARAMS };
  for (const field of TEXT_FIELDS) params[field] = sanitizeText(raw[field] ?? '', LIMITS.text);

  const names = splitNames(params.names);
  if (names.length === 0) errors.names = 'Escribe al menos un nombre para el protagonista.';
  else if (names.length > LIMITS.names) errors.names = `Escribe como máximo ${LIMITS.names} nombres.`;
  else if (names.some((n) => !hasLetters(n))) errors.names = 'Cada nombre debe contener letras.';
  else if (names.some((n) => n.length > 40)) errors.names = 'Cada nombre debe tener como máximo 40 caracteres.';

  params.gender = raw.gender === 'a' ? 'a' : 'o';
  params.tone = TONES.some((t) => t.id === raw.tone) ? raw.tone : (raw.tone ? (errors.tone = 'Elige un tono de la lista.', DEFAULT_PARAMS.tone) : DEFAULT_PARAMS.tone);
  params.scheme = SCHEMES.some((s) => s.id === raw.scheme) ? raw.scheme : (raw.scheme ? (errors.scheme = 'Elige un esquema de rima de la lista.', DEFAULT_PARAMS.scheme) : DEFAULT_PARAMS.scheme);
  params.ending = ENDING_OPTIONS.some((e) => e.id === raw.ending) ? raw.ending : 'auto';
  params.audience = raw.audience === 'educativo' ? 'educativo' : 'general';
  params.level = getProfile(raw.level) ? raw.level : 'general';
  params.preferDialogue = Boolean(raw.preferDialogue);

  for (const field of ['stanzas', 'verses']) {
    const value = Number(raw[field] ?? DEFAULT_PARAMS[field]);
    const [min, max] = LIMITS[field];
    if (!Number.isInteger(value) || value < min || value > max) {
      errors[field] = `Elige un número entero entre ${min} y ${max}.`;
      params[field] = DEFAULT_PARAMS[field];
    } else params[field] = value;
  }

  if (params.audience === 'educativo' && !errors.stanzas && !errors.verses) {
    const { limits, label } = getProfile(params.level);
    if (params.stanzas > limits.maxStanzas) errors.stanzas = `Para ${label} se recomiendan como máximo ${limits.maxStanzas} estrofas.`;
    if (params.verses > limits.maxVerses) errors.verses = `Para ${label} se recomiendan como máximo ${limits.maxVerses} versos por estrofa.`;
  }
  if (params.audience === 'educativo' && getProfile(params.level)?.kidsSafe && params.tone === 'satirico' && params.level !== 'secundaria') {
    errors.tone = 'El tono satírico no está disponible para preescolar ni primaria. Elige otro tono.';
  }
  const phrases = checkPhrases(params, raw.acceptAsIs || {});
  for (const [field, message] of Object.entries(phrases.errors)) if (!errors[field]) errors[field] = message;
  return { ok: Object.keys(errors).length === 0, params, errors, suggestions: phrases.suggestions };
}
