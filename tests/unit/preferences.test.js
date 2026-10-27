import { describe, it, expect } from 'vitest';
import { createPreferencesService, DEFAULT_PREFERENCES } from '../../src/modules/settings/preferences-service.js';
import { sanitizeDesign } from '../../src/modules/designer/design-presets.js';

const memoryStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

describe('preferencias y diseño', () => {
  it('guarda y recupera preferencias válidas', () => {
    const storage = memoryStorage();
    createPreferencesService(storage).set({ theme: 'oscuro', fontScale: 1.3 });
    expect(createPreferencesService(storage).get()).toMatchObject({ theme: 'oscuro', fontScale: 1.3 });
  });
  it('ignora valores corruptos', () => {
    const storage = memoryStorage();
    storage.setItem('calaverarte:preferencias', '{roto');
    expect(createPreferencesService(storage).get()).toEqual({ ...DEFAULT_PREFERENCES });
    storage.setItem('calaverarte:preferencias', JSON.stringify({ theme: 'neón', fontScale: 9 }));
    expect(createPreferencesService(storage).get()).toEqual({ ...DEFAULT_PREFERENCES });
  });
  it('funciona aunque el almacenamiento falle', () => {
    const failing = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    const service = createPreferencesService(failing);
    expect(service.get().theme).toBe('claro');
    expect(service.set({ theme: 'oscuro' })).toBe(false);
  });
  it('limita los valores de diseño', () => {
    expect(sanitizeDesign({ fontSize: 99, lineHeight: 0, preset: 'x' })).toMatchObject({ fontSize: 34, lineHeight: 1.3, preset: 'tradicional' });
  });
});
