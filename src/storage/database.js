/** Apertura de IndexedDB. Es el único archivo que conoce la API nativa de apertura. */
import { upgradeDatabase, DB_VERSION } from './migrations.js';
import { toStorageError } from '../core/errors.js';

export const DB_NAME = 'calaverarte';
export const STORE = 'poems';

export function openDatabase({ factory = globalThis.indexedDB, name = DB_NAME } = {}) {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(toStorageError(new Error('IndexedDB no disponible')));
      return;
    }
    let request;
    try {
      request = factory.open(name, DB_VERSION);
    } catch (error) {
      reject(toStorageError(error));
      return;
    }
    request.onupgradeneeded = (event) => upgradeDatabase(request.result, event.oldVersion, request.transaction);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toStorageError(request.error));
    request.onblocked = () => reject(toStorageError(new Error('La base de datos está abierta en otra pestaña con una versión anterior.')));
  });
}

/** Convierte una petición de IndexedDB en promesa. */
export function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Espera a que una transacción termine (o falle). */
export function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada'));
  });
}
