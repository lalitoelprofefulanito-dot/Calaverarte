/**
 * Repositorio de obras: única puerta de lectura y escritura de IndexedDB
 * para la interfaz.
 */
import { openDatabase, promisify, transactionDone, STORE } from './database.js';
import { migratePoem } from './migrations.js';
import { toStorageError } from '../core/errors.js';
import { nowISO } from '../core/ids.js';

export function createPoemRepository(options = {}) {
  let dbPromise = null;
  const db = () => {
    if (!dbPromise) dbPromise = openDatabase(options).catch((error) => { dbPromise = null; throw error; });
    return dbPromise;
  };

  async function run(mode, work) {
    try {
      const database = await db();
      const tx = database.transaction(STORE, mode);
      const result = await work(tx.objectStore(STORE));
      await transactionDone(tx);
      return result;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  return {
    async list() {
      const records = await run('readonly', (store) => promisify(store.getAll()));
      const poems = [];
      for (const record of records) {
        try { poems.push(migratePoem(record)); } catch { /* registro ilegible: se omite de la lista */ }
      }
      return poems.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async get(id) {
      const record = await run('readonly', (store) => promisify(store.get(id)));
      return record ? migratePoem(record) : null;
    },

    async exists(id) {
      const key = await run('readonly', (store) => promisify(store.getKey(id)));
      return key !== undefined;
    },

    /** Crea o actualiza; actualiza la fecha de modificación salvo que se pida conservarla. */
    async save(poem, { keepDates = false } = {}) {
      const record = structuredClone(poem);
      if (!keepDates) record.updatedAt = nowISO();
      await run('readwrite', (store) => promisify(store.put(record)));
      return record;
    },

    async saveMany(poems) {
      await run('readwrite', async (store) => {
        for (const poem of poems) store.put(structuredClone(poem));
      });
      return poems.length;
    },

    async remove(id) {
      await run('readwrite', (store) => promisify(store.delete(id)));
    },

    async count() {
      return run('readonly', (store) => promisify(store.count()));
    },
  };
}
