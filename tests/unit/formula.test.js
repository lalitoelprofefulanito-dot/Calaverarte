import { describe, it, expect } from 'vitest';
import { MODEL_POEM, STAGE_GUIDE, STAGE_ORDER, GOLDEN_RULES } from '../../src/modules/workshop/formula.js';
import { meterOf } from '../../src/modules/literary-engine/rhythm-checker.js';
import { compareRhyme } from '../../src/modules/literary-engine/rhyme-engine.js';
import { lastWord } from '../../src/core/normalization.js';
import { STAGES } from '../../src/modules/literary-engine/narrative-builder.js';

describe('guía de la fórmula', () => {
  it('cubre las seis etapas del motor en el mismo orden', () => {
    expect(STAGE_ORDER).toEqual(STAGES);
    STAGE_ORDER.forEach((id) => expect(STAGE_GUIDE[id].questions.length).toBeGreaterThan(0));
    expect(GOLDEN_RULES.length).toBeGreaterThanOrEqual(5);
  });
  it('la calaverita modelo está en octosílabos', () => {
    const counts = MODEL_POEM.stanzas.flatMap((s) => s.verses.map((v) => [v, meterOf(v).metric]));
    const off = counts.filter(([, n]) => n !== 8);
    expect(off).toEqual([]);
  });
  it('la calaverita modelo tiene rima alternada consonante', () => {
    for (const { verses } of MODEL_POEM.stanzas) {
      expect(compareRhyme(lastWord(verses[0]), lastWord(verses[2]))).toBe('consonante');
      expect(compareRhyme(lastWord(verses[1]), lastWord(verses[3]))).toBe('consonante');
    }
  });
});
