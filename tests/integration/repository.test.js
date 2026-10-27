import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPoemRepository } from '../../src/storage/repositories.js';
import { createPoem } from '../../src/core/poem-model.js';
import { openDatabase } from '../../src/storage/database.js';

let factory;
beforeEach(() => { factory = new IDBFactory(); });

describe('repositorio IndexedDB', () => {
  it('crea, lee, actualiza, cuenta y elimina', async () => {
    const repo = createPoemRepository({ factory });
    const poem = createPoem({ title: 'Uno', stanzas: [{ verses: ['a'] }] });
    await repo.save(poem);
    expect((await repo.get(poem.id)).title).toBe('Uno');
    await repo.save({ ...poem, title: 'Uno editado' });
    expect((await repo.get(poem.id)).title).toBe('Uno editado');
    expect(await repo.count()).toBe(1);
    expect(await repo.exists(poem.id)).toBe(true);
    await repo.remove(poem.id);
    expect(await repo.get(poem.id)).toBeNull();
  });
  it('persiste entre conexiones (equivale a recargar la página)', async () => {
    const poem = createPoem({ title: 'Persistente', stanzas: [{ verses: ['x'] }] });
    await createPoemRepository({ factory }).save(poem);
    const reopened = createPoemRepository({ factory });
    expect((await reopened.list()).map((p) => p.title)).toEqual(['Persistente']);
  });
  it('migra registros antiguos al leerlos', async () => {
    const db = await openDatabase({ factory });
    await new Promise((resolve) => {
      const tx = db.transaction('poems', 'readwrite');
      tx.objectStore('poems').put({ id: 'viejo', schemaVersion: 1, title: 'V1', createdAt: '2025-10-01T00:00:00.000Z', stanzas: [['a', 'b']] });
      tx.oncomplete = resolve;
    });
    db.close();
    const poem = await createPoemRepository({ factory }).get('viejo');
    expect(poem.schemaVersion).toBe(2);
    expect(poem.stanzas[0].verses).toEqual(['a', 'b']);
  });
  it('guarda varias obras en una sola transacción y ordena por fecha', async () => {
    const repo = createPoemRepository({ factory });
    const a = { ...createPoem({ title: 'A', stanzas: [{ verses: ['a'] }] }), updatedAt: '2026-01-01T00:00:00.000Z' };
    const b = { ...createPoem({ title: 'B', stanzas: [{ verses: ['b'] }] }), updatedAt: '2026-02-01T00:00:00.000Z' };
    await repo.saveMany([a, b]);
    expect((await repo.list()).map((p) => p.title)).toEqual(['B', 'A']);
  });
  it('traduce la falta de IndexedDB a un error comprensible', async () => {
    const repo = createPoemRepository({ factory: null });
    await expect(repo.list()).rejects.toMatchObject({ name: 'StorageError', code: 'STORAGE_UNAVAILABLE' });
  });
  it('traduce un error de cuota', async () => {
    const quotaFactory = { open() { const e = new Error('lleno'); e.name = 'QuotaExceededError'; throw e; } };
    await expect(createPoemRepository({ factory: quotaFactory }).list()).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  });
});
