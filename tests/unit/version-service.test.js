import { describe, it, expect } from 'vitest';
import { saveVersion, restoreVersion, diffStates, MAX_VERSIONS } from '../../src/modules/editor/version-service.js';
import { createPoem } from '../../src/core/poem-model.js';

const poem = () => createPoem({ title: 'Original', stanzas: [{ verses: ['uno', 'dos'] }] });

describe('versiones', () => {
  it('guarda una instantánea sin mutar el poema', () => {
    const p = poem();
    const next = saveVersion(p, 'Primera');
    expect(p.versions).toHaveLength(0);
    expect(next.versions[0].snapshot.stanzas[0].verses).toEqual(['uno', 'dos']);
  });
  it('restaura y guarda antes un punto de recuperación', () => {
    let p = saveVersion(poem(), 'Primera');
    p.stanzas[0].verses = ['cambiado', 'dos'];
    p.title = 'Cambiado';
    const restored = restoreVersion(p, p.versions[0].id);
    expect(restored.title).toBe('Original');
    expect(restored.stanzas[0].verses).toEqual(['uno', 'dos']);
    expect(restored.versions.at(-1).label).toMatch(/Antes de restaurar/);
    expect(restored.versions.at(-1).snapshot.title).toBe('Cambiado');
  });
  it('limita el número de versiones', () => {
    let p = poem();
    for (let i = 0; i < MAX_VERSIONS + 5; i += 1) p = saveVersion(p, `v${i}`);
    expect(p.versions).toHaveLength(MAX_VERSIONS);
    expect(p.versions.at(-1).label).toBe(`v${MAX_VERSIONS + 4}`);
  });
  it('compara dos estados línea por línea', () => {
    const diff = diffStates({ title: 'T', stanzas: [{ verses: ['a', 'b'] }] }, { title: 'T', stanzas: [{ verses: ['a', 'c'] }] });
    expect(diff.filter((d) => d.type === 'removed').map((d) => d.text)).toEqual(['b']);
    expect(diff.filter((d) => d.type === 'added').map((d) => d.text)).toEqual(['c']);
  });
});
