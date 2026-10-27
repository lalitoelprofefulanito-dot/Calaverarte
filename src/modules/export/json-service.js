/**
 * Exportación e importación JSON. La importación valida el esquema, migra
 * registros antiguos y nunca sobrescribe sin una estrategia explícita.
 */
import { ValidationError } from '../../core/errors.js';
import { createId, nowISO } from '../../core/ids.js';
import { SCHEMA_VERSION, DEFAULT_DESIGN } from '../../core/poem-model.js';
import { migratePoem } from '../../storage/migrations.js';
import { isPlainObject, isISODate } from '../../core/validation.js';

export const EXPORT_FORMAT = 'calaverarte-respaldo';
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_POEMS_PER_IMPORT = 2000;
const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

export function buildExport(poems) {
  return JSON.stringify({
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowISO(),
    app: 'CalaverArte',
    poems,
  }, null, 2);
}

export function exportFileName(poems) {
  const date = new Date().toISOString().slice(0, 10);
  if (poems.length === 1) {
    const slug = poems[0].title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40);
    return `calaverita-${slug || 'sin-titulo'}-${date}.json`;
  }
  return `calaverarte-respaldo-${date}.json`;
}

const str = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

/** Conserva solo parámetros simples (texto, número, booleano) con longitud acotada. */
function cleanParamsOf(params) {
  const clean = {};
  if (!isPlainObject(params)) return clean;
  for (const [key, value] of Object.entries(params)) {
    if (['string', 'number', 'boolean'].includes(typeof value)) clean[key.slice(0, 40)] = typeof value === 'string' ? value.slice(0, 200) : value;
  }
  return clean;
}

/** Valida un registro y devuelve solo los campos conocidos (lista blanca). */
export function sanitizeImportedPoem(raw, index) {
  const where = `Obra ${index + 1}`;
  if (!isPlainObject(raw)) throw new Error(`${where}: no es un objeto.`);
  if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) throw new Error(`${where}: identificador ausente o no válido.`);
  if (typeof raw.title !== 'string' || !raw.title.trim()) throw new Error(`${where}: falta el título.`);
  if (!Array.isArray(raw.stanzas) || raw.stanzas.length < 1 || raw.stanzas.length > 8) throw new Error(`${where}: debe tener entre 1 y 8 estrofas.`);
  const migrated = migratePoem(raw);
  for (const [i, stanza] of migrated.stanzas.entries()) {
    if (!Array.isArray(stanza.verses) || stanza.verses.length < 1 || stanza.verses.length > 8) throw new Error(`${where}, estrofa ${i + 1}: debe tener entre 1 y 8 versos.`);
    if (stanza.verses.some((v) => typeof v !== 'string' || v.length > 300)) throw new Error(`${where}, estrofa ${i + 1}: versos no válidos.`);
    if (!ID_RE.test(stanza.id)) throw new Error(`${where}, estrofa ${i + 1}: identificador no válido.`);
  }
  if (!isISODate(migrated.createdAt) || !isISODate(migrated.updatedAt)) throw new Error(`${where}: fechas no válidas (se espera ISO 8601).`);
  const cleanParams = cleanParamsOf(migrated.params);
  const design = { ...DEFAULT_DESIGN };
  if (isPlainObject(migrated.design)) {
    for (const key of Object.keys(DEFAULT_DESIGN)) {
      if (typeof migrated.design[key] === typeof DEFAULT_DESIGN[key]) design[key] = migrated.design[key];
    }
  }
  return {
    id: migrated.id,
    schemaVersion: SCHEMA_VERSION,
    title: str(migrated.title, 120),
    createdAt: migrated.createdAt,
    updatedAt: migrated.updatedAt,
    status: migrated.status === 'final' ? 'final' : 'borrador',
    favorite: Boolean(migrated.favorite),
    params: cleanParams,
    engine: isPlainObject(migrated.engine)
      ? { seed: Number(migrated.engine.seed) || 0, ending: str(migrated.engine.ending, 2), figure: str(migrated.engine.figure, 40), engineVersion: Number(migrated.engine.engineVersion) || 1 }
      : null,
    protagonists: (migrated.protagonists || []).filter((p) => typeof p === 'string').map((p) => p.slice(0, 60)).slice(0, 10),
    stanzas: migrated.stanzas.map((s) => ({ id: s.id, locked: Boolean(s.locked), verses: s.verses.map(String) })),
    versions: (migrated.versions || []).filter((v) => isPlainObject(v) && isPlainObject(v.snapshot) && Array.isArray(v.snapshot.stanzas)).slice(-50).map((v) => ({
      id: ID_RE.test(v.id) ? v.id : createId('ver'),
      label: str(v.label, 80) || 'Versión',
      createdAt: isISODate(v.createdAt) ? v.createdAt : migrated.updatedAt,
      snapshot: {
        title: str(v.snapshot.title, 120),
        stanzas: v.snapshot.stanzas.filter(isPlainObject).map((s) => ({ id: str(s.id, 100) || createId('est'), locked: Boolean(s.locked), verses: (Array.isArray(s.verses) ? s.verses : []).map((x) => String(x).slice(0, 300)) })),
        params: cleanParamsOf(v.snapshot.params),
        engine: null,
      },
    })),
    evaluation: null,
    design,
  };
}

/**
 * Lee el texto de un archivo de respaldo.
 * Lanza ValidationError si el archivo entero no sirve; devuelve las obras
 * válidas y la lista de errores de las que se descartaron.
 */
export function parseImport(text, { maxBytes = MAX_IMPORT_BYTES } = {}) {
  const size = new Blob([text]).size;
  if (size > maxBytes) throw new ValidationError(`El archivo pesa ${(size / 1048576).toFixed(1)} MB; el máximo es ${(maxBytes / 1048576).toFixed(0)} MB.`);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ValidationError('El archivo no es un JSON válido.');
  }
  let list;
  if (isPlainObject(data) && data.format === EXPORT_FORMAT && Array.isArray(data.poems)) {
    if (Number(data.schemaVersion) > SCHEMA_VERSION) throw new ValidationError('El respaldo se creó con una versión más reciente de CalaverArte.');
    list = data.poems;
  } else {
    throw new ValidationError('El archivo no es un respaldo de CalaverArte (falta el campo «format»).');
  }
  if (list.length > MAX_POEMS_PER_IMPORT) throw new ValidationError(`El respaldo contiene ${list.length} obras; el máximo por importación es ${MAX_POEMS_PER_IMPORT}.`);
  const poems = [];
  const errors = [];
  const seen = new Set();
  list.forEach((raw, i) => {
    try {
      const poem = sanitizeImportedPoem(raw, i);
      if (seen.has(poem.id)) throw new Error(`Obra ${i + 1}: identificador repetido dentro del mismo archivo.`);
      seen.add(poem.id);
      poems.push(poem);
    } catch (error) {
      errors.push(error.message);
    }
  });
  return { poems, errors };
}

/** Separa obras nuevas de las que chocan con identificadores existentes. */
export function planImport(poems, existingIds) {
  const ids = new Set(existingIds);
  return {
    fresh: poems.filter((p) => !ids.has(p.id)),
    conflicts: poems.filter((p) => ids.has(p.id)),
  };
}

/**
 * Estrategias para los conflictos:
 *  omitir     → conserva la obra local y descarta la importada
 *  copia      → guarda la importada como obra nueva con otro identificador
 *  reemplazar → sustituye la obra local (requiere confirmación en la interfaz)
 */
export function resolveConflicts(conflicts, strategy) {
  if (strategy === 'omitir') return [];
  if (strategy === 'reemplazar') return conflicts.map((p) => structuredClone(p));
  if (strategy === 'copia') {
    return conflicts.map((p) => ({ ...structuredClone(p), id: createId('obra'), title: `${p.title} (importada)`.slice(0, 120) }));
  }
  throw new ValidationError('Elige qué hacer con las obras repetidas.');
}
