/** Búsqueda, filtros y orden de la biblioteca (funciones puras). */
import { normalizeForSearch } from '../../core/normalization.js';

export const SORT_OPTIONS = [
  { id: 'recientes', label: 'Modificadas recientemente' },
  { id: 'antiguas', label: 'Más antiguas primero' },
  { id: 'titulo', label: 'Título (A–Z)' },
];

export const SEARCH_FIELDS = [
  { id: 'todo', label: 'Todo' },
  { id: 'titulo', label: 'Título' },
  { id: 'protagonista', label: 'Protagonista' },
  { id: 'texto', label: 'Palabras del poema' },
];

/** Búsqueda tolerante: además de tildes y mayúsculas, iguala ñ y n. */
const loose = (text) => normalizeForSearch(text).replace(/ñ/g, 'n');

function haystack(poem, field) {
  const title = poem.title;
  const protagonist = [poem.params?.names, ...(poem.protagonists || [])].join(' ');
  const text = poem.stanzas.flatMap((s) => s.verses).join(' ');
  if (field === 'titulo') return loose(title);
  if (field === 'protagonista') return loose(protagonist);
  if (field === 'texto') return loose(text);
  return loose(`${title} ${protagonist} ${text}`);
}

export function searchPoems(poems, { query = '', field = 'todo', tone = '', from = '', to = '', favoritesOnly = false, sort = 'recientes' } = {}) {
  const terms = loose(query).split(' ').filter(Boolean);
  const fromTime = from ? Date.parse(`${from}T00:00:00`) : null;
  const toTime = to ? Date.parse(`${to}T23:59:59.999`) : null;
  const filtered = poems.filter((poem) => {
    if (favoritesOnly && !poem.favorite) return false;
    if (tone && poem.params?.tone !== tone) return false;
    const updated = Date.parse(poem.updatedAt);
    if (fromTime !== null && updated < fromTime) return false;
    if (toTime !== null && updated > toTime) return false;
    if (terms.length === 0) return true;
    const text = haystack(poem, field);
    return terms.every((term) => text.includes(term));
  });
  const sorted = [...filtered];
  if (sort === 'titulo') sorted.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  else if (sort === 'antiguas') sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sorted;
}
