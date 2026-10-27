import { describe, it, expect } from 'vitest';
import { buildExport, parseImport, planImport, resolveConflicts, exportFileName } from '../../src/modules/export/json-service.js';
import { createPoem } from '../../src/core/poem-model.js';
import { saveVersion } from '../../src/modules/editor/version-service.js';

const sample = () => saveVersion(createPoem({ title: 'Ñandú y la Catrina «especial»', params: { names: 'José María', tone: 'tradicional' }, stanzas: [{ verses: ['¡Ay, José María!', 'qué puntería'] }] }), 'v1');

describe('exportación e importación JSON', () => {
  it('conserva acentos, signos, orden, versiones y metadatos', () => {
    const poem = sample();
    const { poems, errors } = parseImport(buildExport([poem]));
    expect(errors).toEqual([]);
    expect(poems[0].title).toBe(poem.title);
    expect(poems[0].stanzas).toEqual(poem.stanzas);
    expect(poems[0].versions[0].label).toBe('v1');
    expect(poems[0].params.names).toBe('José María');
    expect(poems[0].createdAt).toBe(poem.createdAt);
  });
  it('rechaza archivos que no son JSON, que no son respaldos o demasiado grandes', () => {
    expect(() => parseImport('no json')).toThrow(/JSON válido/);
    expect(() => parseImport('{"a":1}')).toThrow(/respaldo de CalaverArte/);
    expect(() => parseImport(buildExport([sample()]), { maxBytes: 10 })).toThrow(/máximo/);
  });
  it('descarta obras inválidas y avisa sin perder las válidas', () => {
    const good = sample();
    const text = JSON.stringify({ format: 'calaverarte-respaldo', schemaVersion: 2, poems: [good, { id: 'x y', title: '' }, { ...good, id: 'otra', stanzas: [] }] });
    const { poems, errors } = parseImport(text);
    expect(poems).toHaveLength(1);
    expect(errors).toHaveLength(2);
  });
  it('elimina campos desconocidos y trata el texto como datos', () => {
    const good = { ...sample(), malicious: '<img src=x onerror=alert(1)>' };
    good.stanzas[0].verses[0] = '<script>alert(1)</script>';
    const { poems } = parseImport(buildExport([good]));
    expect(poems[0].malicious).toBeUndefined();
    expect(poems[0].stanzas[0].verses[0]).toBe('<script>alert(1)</script>');
  });
  it('detecta conflictos y aplica estrategias explícitas', () => {
    const a = sample();
    const b = sample();
    const plan = planImport([a, b], [a.id]);
    expect(plan.fresh.map((p) => p.id)).toEqual([b.id]);
    expect(plan.conflicts.map((p) => p.id)).toEqual([a.id]);
    expect(resolveConflicts(plan.conflicts, 'omitir')).toEqual([]);
    const copies = resolveConflicts(plan.conflicts, 'copia');
    expect(copies[0].id).not.toBe(a.id);
    expect(copies[0].title).toMatch(/importada/);
    expect(resolveConflicts(plan.conflicts, 'reemplazar')[0].id).toBe(a.id);
    expect(() => resolveConflicts(plan.conflicts, '')).toThrow();
  });
  it('genera nombres de archivo legibles', () => {
    expect(exportFileName([sample()])).toMatch(/^calaverita-nandu-y-la-catrina-especial-\d{4}-\d{2}-\d{2}\.json$/);
    expect(exportFileName([sample(), sample()])).toMatch(/^calaverarte-respaldo-/);
  });
});
