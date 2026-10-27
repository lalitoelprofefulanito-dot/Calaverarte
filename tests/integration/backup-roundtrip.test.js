import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, it, expect } from 'vitest';
import { createPoemRepository } from '../../src/storage/repositories.js';
import { buildExport, parseImport, planImport, resolveConflicts } from '../../src/modules/export/json-service.js';
import { generate } from '../../src/modules/literary-engine/engine.js';
import { validateParams } from '../../src/modules/generator/generation-schema.js';
import { createPoem } from '../../src/core/poem-model.js';
import { saveVersion } from '../../src/modules/editor/version-service.js';

describe('respaldo completo: exportar → importar en otro dispositivo', () => {
  it('reproduce la biblioteca sin pérdidas y resuelve conflictos', async () => {
    const source = createPoemRepository({ factory: new IDBFactory() });
    for (let i = 0; i < 5; i += 1) {
      const p = validateParams({ names: `Persona ${i}`, tone: 'humoristico', stanzas: 3, verses: 4 }).params;
      const out = generate(p, i + 1);
      await source.save(saveVersion(createPoem({ title: out.title, params: p, stanzas: out.stanzas, engine: out.engine }), 'Inicial'), { keepDates: true });
    }
    const original = await source.list();
    const backup = buildExport(original);

    const target = createPoemRepository({ factory: new IDBFactory() });
    await target.save(original[0], { keepDates: true });
    const { poems, errors } = parseImport(backup);
    expect(errors).toEqual([]);
    const plan = planImport(poems, (await target.list()).map((p) => p.id));
    expect(plan.conflicts).toHaveLength(1);
    await target.saveMany([...plan.fresh, ...resolveConflicts(plan.conflicts, 'omitir')]);
    const restored = await target.list();
    expect(restored).toHaveLength(5);
    for (const poem of original) {
      const copy = restored.find((p) => p.id === poem.id);
      expect(copy.stanzas).toEqual(poem.stanzas);
      expect(copy.title).toBe(poem.title);
      expect(copy.versions).toHaveLength(1);
    }
  });
});
