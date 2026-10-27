/** Normalización de texto en español: conserva la ñ y las tildes cuando importan. */

const PUNCTUATION = /[¡!¿?«»"“”'‘’,.;:()[\]{}—–\-…]/g;

export function collapseSpaces(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

/** Quita tildes y diéresis pero conserva la ñ. */
export function stripAccents(text = '') {
  return String(text)
    .replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ');
}

/** Forma para comparar y buscar: minúsculas, sin tildes, sin signos. */
export function normalizeForSearch(text = '') {
  return collapseSpaces(stripAccents(String(text).toLowerCase()).replace(PUNCTUATION, ' '));
}

export function removePunctuation(text = '') {
  return String(text).replace(PUNCTUATION, ' ');
}

/** Palabras de un texto, en minúsculas y sin signos (con tildes). */
export function tokenize(text = '') {
  return removePunctuation(String(text).toLowerCase())
    .split(/\s+/)
    .filter(Boolean);
}

export function lastWord(verse = '') {
  const words = tokenize(verse);
  return words[words.length - 1] || '';
}

export function capitalizeFirst(text = '') {
  const match = String(text).match(/^([¡¿«"\s]*)(\p{L})/u);
  if (!match) return text;
  const index = match[1].length;
  return text.slice(0, index) + text[index].toUpperCase() + text.slice(index + 1);
}

/** Separa una lista de nombres escrita con comas o «y». */
export function splitNames(text = '') {
  return collapseSpaces(text)
    .split(/\s*,\s*|\s+y\s+|\s+e\s+/i)
    .map((name) => collapseSpaces(name))
    .filter(Boolean);
}

export function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

/** Elimina caracteres de control y recorta la longitud. */
export function sanitizeText(text = '', maxLength = 500) {
  return collapseSpaces(String(text).replace(/[\u0000-\u001f\u007f]/g, ' ')).slice(0, maxLength);
}
