import { describe, it, expect } from 'vitest';
import { evaluatePoem } from '../../src/modules/evaluator/evaluation-report.js';
import { createPoem } from '../../src/core/poem-model.js';
import { generate } from '../../src/modules/literary-engine/engine.js';
import { validateParams } from '../../src/modules/generator/generation-schema.js';

const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v)); return Object.freeze(o); };
const statusOf = (report, id) => report.checks.find((c) => c.id === id)?.status;

describe('evaluador', () => {
  const p = validateParams({ names: 'Mateo', gusto: 'jugar futbol', tone: 'infantil', stanzas: 3, verses: 4, scheme: 'pareada' }).params;
  const out = generate(p, 21);
  const poem = createPoem({ title: out.title, params: p, stanzas: out.stanzas, engine: out.engine });

  it('no modifica el poema (objeto congelado)', () => {
    const frozen = deepFreeze(structuredClone(poem));
    expect(() => evaluatePoem(frozen)).not.toThrow();
    expect(frozen).toEqual(poem);
  });
  it('usa solo los tres estados permitidos', () => {
    const report = evaluatePoem(poem);
    report.checks.forEach((c) => expect(['ok', 'revisar', 'no-verificable']).toContain(c.status));
    expect(statusOf(report, 'calidad')).toBe('no-verificable');
  });
  it('da por buena una calaverita generada en lo estructural', () => {
    const report = evaluatePoem(poem);
    expect(statusOf(report, 'estrofas')).toBe('ok');
    expect(statusOf(report, 'muerte')).toBe('ok');
    expect(statusOf(report, 'protagonista')).toBe('ok');
  });
  it('detecta rima rota, ausencia de la Muerte, versos vacíos y repeticiones', () => {
    const bad = createPoem({
      title: 'Mal', params: { names: 'Rosa', stanzas: 2, verses: 2, scheme: 'pareada' },
      stanzas: [{ verses: ['Rosa caminaba por la calle', 'Rosa caminaba por la calle'] }, { verses: ['comía una manzana roja', ''] }],
    });
    const report = evaluatePoem(bad);
    expect(statusOf(report, 'rima')).toBe('revisar');
    expect(statusOf(report, 'muerte')).toBe('revisar');
    expect(statusOf(report, 'vacios')).toBe('revisar');
    expect(statusOf(report, 'versos-repetidos')).toBe('revisar');
  });
  it('señala términos no aptos para público infantil', () => {
    const p2 = createPoem({ title: 'x', params: { names: 'Lalo', tone: 'infantil', scheme: 'libre' }, stanzas: [{ verses: ['Lalo tomó tequila', 'y la Calaca se reía'] }] });
    expect(statusOf(evaluatePoem(p2), 'publico')).toBe('revisar');
  });
  it('sugiere palabras que riman cuando una pareja falla', () => {
    const p3 = createPoem({ title: 'x', params: { names: 'Ana', scheme: 'pareada' }, stanzas: [{ verses: ['Ana fue al panteón', 'con su mesa'] }] });
    const rhyme = evaluatePoem(p3).checks.find((c) => c.id === 'rima');
    expect(rhyme.suggestions[0].text).toMatch(/riman con «panteón»/);
  });
});

describe('comprobación de octosílabos', () => {
  it('aprueba la calaverita modelo y marca versos largos', async () => {
    const { MODEL_POEM } = await import('../../src/modules/workshop/formula.js');
    const model = createPoem({ title: MODEL_POEM.title, params: { scheme: 'alternada' }, stanzas: MODEL_POEM.stanzas });
    expect(evaluatePoem(model).checks.find((c) => c.id === 'octosilabos').status).toBe('ok');
    const long = createPoem({ title: 'x', params: { scheme: 'libre' }, stanzas: [{ verses: ['Este verso tiene muchísimas más sílabas de las que debería', 'y este también es demasiado largo para una calaverita'] }] });
    const result = evaluatePoem(long).checks.find((c) => c.id === 'octosilabos');
    expect(result.status).toBe('revisar');
    expect(result.suggestions.length).toBe(2);
  });
});

