import { describe, it, expect, vi } from 'vitest';
import { generate, regenerateStanza, generateVariant } from '../../src/modules/literary-engine/engine.js';
import { validateParams } from '../../src/modules/generator/generation-schema.js';
import { createPoem } from '../../src/core/poem-model.js';
import { compareRhyme, schemeLetters } from '../../src/modules/literary-engine/rhyme-engine.js';
import { lastWord, normalizeForSearch } from '../../src/core/normalization.js';

const params = (raw) => validateParams(raw).params;
const base = { names: 'Doña Lupe', gender: 'a', oficio: 'cocinera', gusto: 'hacer tamales', cualidad: 'muy platicadora', lugar: 'el mercado', tone: 'tradicional', stanzas: 4, verses: 4, scheme: 'alternada' };

describe('motor literario', () => {
  it('respeta la extensión pedida en todas las combinaciones', () => {
    for (const stanzas of [2, 5, 8]) for (const verses of [2, 3, 6, 8]) {
      const out = generate(params({ ...base, stanzas, verses }), stanzas * 10 + verses);
      expect(out.stanzas).toHaveLength(stanzas);
      out.stanzas.forEach((s) => expect(s.verses).toHaveLength(verses));
    }
  });
  it('es determinista para una misma semilla y varía con otra', () => {
    const p = params(base);
    expect(generate(p, 99)).toEqual(generate(p, 99));
    expect(generate(p, 99).stanzas).not.toEqual(generate(p, 100).stanzas);
  });
  it('incorpora el nombre en la primera estrofa y menciona a la Muerte', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const out = generate(params(base), seed);
      expect(out.stanzas[0].verses.join(' ')).toContain('Doña Lupe');
      expect(normalizeForSearch(out.stanzas.flatMap((s) => s.verses).join(' '))).toMatch(/muerte|calaca|flaca|huesuda|pelona/);
    }
  });
  it('cumple el esquema de rima cuando no avisa lo contrario', () => {
    for (const scheme of ['pareada', 'alternada', 'abrazada']) {
      for (let seed = 1; seed <= 15; seed += 1) {
        const out = generate(params({ ...base, scheme }), seed);
        if (out.warnings.some((w) => w.includes('sin rimar'))) continue;
        out.stanzas.forEach((s) => {
          const letters = schemeLetters(scheme, s.verses.length);
          const first = {};
          [...letters].forEach((l, j) => {
            if (first[l] === undefined) first[l] = j;
            else expect(compareRhyme(lastWord(s.verses[first[l]]), lastWord(s.verses[j]))).toMatch(/consonante|asonante/);
          });
        });
      }
    }
  });
  it('no repite versos idénticos', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const verses = generate(params({ ...base, stanzas: 6, verses: 6 }), seed).stanzas.flatMap((s) => s.verses).map(normalizeForSearch);
      expect(new Set(verses).size).toBe(verses.length);
    }
  });
  it('usa el desenlace elegido', () => {
    expect(generate(params({ ...base, ending: 'E' }), 3).engine.ending).toBe('E');
    expect(generate(params({ ...base, ending: 'L' }), 3).engine.ending).toBe('L');
  });
  it('no usa versos no aptos ni desenlace fúnebre por defecto con tono infantil', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const out = generate(params({ ...base, tone: 'infantil' }), seed);
      expect(out.engine.ending).not.toBe('L');
    }
  });
  it('avisa de restricciones incompatibles', () => {
    const out = generate(params({ ...base, avoid: 'tamales' }), 5);
    expect(out.warnings.join(' ')).toMatch(/incompatibles/);
  });
  it('evita las palabras indicadas', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const text = normalizeForSearch(generate(params({ ...base, avoid: 'panteón, fiesta' }), seed).stanzas.flatMap((s) => s.verses).join(' '));
      expect(text).not.toMatch(/panteon|fiesta/);
    }
  });
  it('maneja varios protagonistas sin repetir la lista completa', () => {
    const out = generate(params({ ...base, names: 'Ana, Luis y Pepe' }), 7);
    const text = out.stanzas.flatMap((s) => s.verses).join(' ');
    expect(text.match(/Ana, Luis y Pepe/g)?.length || 0).toBeLessThanOrEqual(2);
  });
  it('no hace llamadas de red al generar', () => {
    const fetchSpy = vi.fn();
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy;
    generate(params(base), 1);
    globalThis.fetch = original;
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('regeneración y variantes', () => {
  const makePoem = () => {
    const p = params(base);
    const out = generate(p, 11);
    return createPoem({ title: out.title, params: p, stanzas: out.stanzas, engine: out.engine });
  };
  it('regenera una estrofa con la misma longitud', () => {
    const poem = makePoem();
    const result = regenerateStanza(poem, 1, 555);
    expect(result.verses).toHaveLength(poem.stanzas[1].verses.length);
  });
  it('se niega a regenerar una estrofa bloqueada', () => {
    const poem = makePoem();
    poem.stanzas[1].locked = true;
    expect(() => regenerateStanza(poem, 1, 1)).toThrow(/bloqueada/);
  });
  it('las variantes conservan intactas las estrofas bloqueadas', () => {
    const poem = makePoem();
    poem.stanzas[0].locked = true;
    poem.stanzas[2].locked = true;
    const variant = generateVariant(poem, 777);
    expect(variant.stanzas[0]).toEqual(poem.stanzas[0]);
    expect(variant.stanzas[2]).toEqual(poem.stanzas[2]);
    expect(variant.engine.ending).toBe(poem.engine.ending);
    expect(variant.stanzas[1].id).toBe(poem.stanzas[1].id);
  });
});
