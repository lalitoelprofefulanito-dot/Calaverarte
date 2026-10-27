/**
 * Migraciones de la base (estructura) y de los registros (datos).
 *
 * Historial del esquema de datos:
 *  v1 → estrofas como arreglos de texto, sin identificador ni bloqueo;
 *       sin diseño, favoritos ni versiones.
 *  v2 → estrofas { id, locked, verses }, diseño, favoritos, versiones y motor.
 */
import { SCHEMA_VERSION, DEFAULT_DESIGN } from '../core/poem-model.js';
import { createId, nowISO } from '../core/ids.js';
import { isPlainObject } from '../core/validation.js';

export const DB_VERSION = 1;

export function upgradeDatabase(db, oldVersion) {
  if (oldVersion < 1) {
    const store = db.createObjectStore('poems', { keyPath: 'id' });
    store.createIndex('updatedAt', 'updatedAt');
  }
}

function migrateStanzas(stanzas) {
  return (Array.isArray(stanzas) ? stanzas : []).map((stanza) => {
    if (Array.isArray(stanza)) return { id: createId('est'), locked: false, verses: stanza.map(String) };
    return {
      id: typeof stanza?.id === 'string' && stanza.id ? stanza.id : createId('est'),
      locked: Boolean(stanza?.locked),
      verses: Array.isArray(stanza?.verses) ? stanza.verses.map(String) : [],
    };
  });
}

/** Lleva un registro de cualquier versión anterior a la actual. No muta la entrada. */
export function migratePoem(raw) {
  if (!isPlainObject(raw)) throw new Error('Registro con formato no válido.');
  const version = Number(raw.schemaVersion) || 1;
  if (version > SCHEMA_VERSION) {
    const error = new Error('Registro de una versión más reciente de CalaverArte.');
    error.name = 'VersionError';
    throw error;
  }
  const poem = structuredClone(raw);
  if (version < 2) {
    poem.stanzas = migrateStanzas(poem.stanzas);
    poem.design = { ...DEFAULT_DESIGN, ...(isPlainObject(poem.design) ? poem.design : {}) };
    poem.favorite = Boolean(poem.favorite);
    poem.versions = Array.isArray(poem.versions)
      ? poem.versions.map((v) => ({ ...v, snapshot: { ...v.snapshot, stanzas: migrateStanzas(v.snapshot?.stanzas) } }))
      : [];
    poem.engine = poem.engine ?? null;
    poem.evaluation = null;
    poem.status = poem.status === 'final' ? 'final' : 'borrador';
    poem.protagonists = Array.isArray(poem.protagonists) ? poem.protagonists : [];
    poem.params = isPlainObject(poem.params) ? poem.params : {};
    poem.createdAt = poem.createdAt || nowISO();
    poem.updatedAt = poem.updatedAt || poem.createdAt;
    poem.schemaVersion = 2;
  }
  return poem;
}
