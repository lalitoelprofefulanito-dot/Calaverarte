import { describe, it, expect } from 'vitest';
import { migratePoem } from '../../src/storage/migrations.js';
import { SCHEMA_VERSION } from '../../src/core/poem-model.js';

describe('migraciones de datos', () => {
  const v1 = { id: 'obra_1', schemaVersion: 1, title: 'Antigua', createdAt: '2025-10-30T12:00:00.000Z', stanzas: [['uno', 'dos'], ['tres', 'cuatro']] };
  it('convierte estrofas v1 a objetos con identificador y bloqueo', () => {
    const p = migratePoem(v1);
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.stanzas[0]).toMatchObject({ locked: false, verses: ['uno', 'dos'] });
    expect(p.stanzas[0].id).toMatch(/^est_/);
    expect(p.design.preset).toBe('tradicional');
    expect(p.versions).toEqual([]);
    expect(p.updatedAt).toBe(v1.createdAt);
  });
  it('no muta la entrada y es idempotente', () => {
    const copy = structuredClone(v1);
    const once = migratePoem(v1);
    expect(v1).toEqual(copy);
    expect(migratePoem(once)).toEqual(once);
  });
  it('rechaza registros de una versión futura', () => {
    expect(() => migratePoem({ ...v1, schemaVersion: 99 })).toThrow(/más reciente/);
  });
});
