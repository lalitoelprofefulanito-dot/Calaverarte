import { describe, it, expect } from 'vitest';
import { buildActivity, ACTIVITY_TYPES } from '../../src/modules/education/activity-builder.js';
import { generate } from '../../src/modules/literary-engine/engine.js';
import { validateParams } from '../../src/modules/generator/generation-schema.js';
import { createPoem } from '../../src/core/poem-model.js';

const p = validateParams({ names: 'Mateo', tone: 'infantil', stanzas: 3, verses: 4, scheme: 'pareada', audience: 'educativo', level: 'primaria-baja' }).params;
const out = generate(p, 8);
const poem = createPoem({ title: out.title, params: p, stanzas: out.stanzas, engine: out.engine });

describe('actividades educativas', () => {
  it.each(ACTIVITY_TYPES.map((a) => a.id))('construye la actividad «%s» para cada perfil', (type) => {
    for (const profileId of ['preescolar', 'primaria-baja', 'primaria-alta', 'secundaria', 'general']) {
      const activity = buildActivity(type, poem, { profileId, seed: 3 });
      expect(activity.instructions.length).toBeGreaterThan(20);
      expect(activity.blocks.length).toBeGreaterThan(0);
    }
  });
  it('completar versos ofrece banco de palabras y clave de respuestas', () => {
    const a = buildActivity('completar', poem, { profileId: 'primaria-baja' });
    expect(a.blocks[0].items.length).toBe(a.answerKey.length);
    expect(a.blocks[1].stanzas.flatMap((s) => s.verses).some((v) => v.includes('______'))).toBe(true);
  });
  it('ordenar estrofas incluye todas las estrofas y su orden correcto', () => {
    const a = buildActivity('ordenar', poem, { seed: 4 });
    expect(a.blocks[1].items).toHaveLength(poem.stanzas.length);
    expect(a.answerKey.map((s) => Number(s.split(': ')[1])).sort()).toEqual([1, 2, 3]);
  });
  it('no modifica el poema original', () => {
    const before = structuredClone(poem);
    ACTIVITY_TYPES.forEach(({ id }) => buildActivity(id, poem, { seed: 2 }));
    expect(poem).toEqual(before);
  });
});
