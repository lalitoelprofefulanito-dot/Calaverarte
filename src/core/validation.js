/** Utilidades de validación reutilizables. */
export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Contiene letras y no solo signos o números. */
export function hasLetters(value) {
  return /\p{L}/u.test(String(value));
}
