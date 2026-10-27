import { createId, nowISO } from './ids.js';

/**
 * Esquema de datos de CalaverArte. Cualquier cambio de forma incrementa
 * SCHEMA_VERSION y requiere una migración en storage/migrations.js.
 */
export const SCHEMA_VERSION = 2;
export const POEM_STATUS = ['borrador', 'final'];

export const DEFAULT_DESIGN = Object.freeze({
  preset: 'tradicional',
  fontFamily: 'georgia',
  fontSize: 22,
  align: 'center',
  lineHeight: 1.6,
  border: 'preset',
  ornaments: true,
  layout: 'clasica',
});

export function createStanza(verses = [], { locked = false, id } = {}) {
  return { id: id || createId('est'), locked: Boolean(locked), verses: verses.map(String) };
}

export function createPoem({ title, params, protagonists = [], stanzas = [], engine = null }) {
  const timestamp = nowISO();
  return {
    id: createId('obra'),
    schemaVersion: SCHEMA_VERSION,
    title: title || 'Calaverita sin título',
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'borrador',
    favorite: false,
    params: params ? structuredClone(params) : {},
    engine: engine ? structuredClone(engine) : null,
    protagonists: [...protagonists],
    stanzas: stanzas.map((stanza) => createStanza(stanza.verses, stanza)),
    versions: [],
    evaluation: null,
    design: { ...DEFAULT_DESIGN },
  };
}

/** Instantánea completa del contenido para guardar una versión. */
export function snapshotOf(poem) {
  return structuredClone({
    title: poem.title,
    stanzas: poem.stanzas,
    params: poem.params,
    engine: poem.engine,
  });
}

/** Texto plano con una línea en blanco entre estrofas. */
export function poemToPlainText(poem, { includeTitle = true } = {}) {
  const body = poem.stanzas.map((stanza) => stanza.verses.join('\n')).join('\n\n');
  return includeTitle ? `${poem.title}\n\n${body}` : body;
}

export function countVerses(poem) {
  return poem.stanzas.reduce((sum, stanza) => sum + stanza.verses.length, 0);
}
