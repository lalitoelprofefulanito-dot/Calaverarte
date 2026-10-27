import { describe, it, expect } from 'vitest';
import { validateParams } from '../../src/modules/generator/generation-schema.js';

describe('validación del formulario', () => {
  it('exige al menos un nombre', () => {
    const r = validateParams({ names: '   ' });
    expect(r.ok).toBe(false);
    expect(r.errors.names).toMatch(/nombre/);
  });
  it('limita estrofas y versos entre 2 y 8', () => {
    expect(validateParams({ names: 'Ana', stanzas: 1 }).errors.stanzas).toBeTruthy();
    expect(validateParams({ names: 'Ana', verses: 9 }).errors.verses).toBeTruthy();
    expect(validateParams({ names: 'Ana', stanzas: 8, verses: 8 }).ok).toBe(true);
    expect(validateParams({ names: 'Ana', stanzas: 2.5 }).errors.stanzas).toBeTruthy();
  });
  it('acepta campos opcionales vacíos', () => {
    const r = validateParams({ names: 'Ana' });
    expect(r.ok).toBe(true);
    expect(r.params.oficio).toBe('');
  });
  it('rechaza valores fuera de las listas', () => {
    expect(validateParams({ names: 'Ana', tone: 'gore' }).errors.tone).toBeTruthy();
    expect(validateParams({ names: 'Ana', scheme: 'rara' }).errors.scheme).toBeTruthy();
  });
  it('aplica los límites del perfil educativo', () => {
    const r = validateParams({ names: 'Ana', audience: 'educativo', level: 'preescolar', stanzas: 5, verses: 4 });
    expect(r.errors.stanzas).toMatch(/Preescolar/);
  });
  it('no permite el tono satírico en primaria', () => {
    expect(validateParams({ names: 'Ana', audience: 'educativo', level: 'primaria-alta', tone: 'satirico' }).errors.tone).toBeTruthy();
  });
  it('limita a 3 protagonistas', () => {
    expect(validateParams({ names: 'A, B, C, D' }).errors.names).toBeTruthy();
  });
});
