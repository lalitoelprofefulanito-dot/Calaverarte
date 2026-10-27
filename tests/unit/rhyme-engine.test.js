import { describe, it, expect } from 'vitest';
import { syllabify, stressType, rhymeKey, compareRhyme, schemeLetters } from '../../src/modules/literary-engine/rhyme-engine.js';

describe('separación silábica', () => {
  it.each([
    ['calavera', 'ca-la-ve-ra'], ['panteón', 'pan-te-ón'], ['día', 'dí-a'], ['guitarra', 'gui-ta-rra'],
    ['queso', 'que-so'], ['pingüino', 'pin-güi-no'], ['aliento', 'a-lien-to'], ['construcción', 'cons-truc-ción'],
    ['teatro', 'te-a-tro'], ['huesuda', 'hue-su-da'], ['chocolate', 'cho-co-la-te'], ['llanto', 'llan-to'],
  ])('%s → %s', (word, expected) => {
    expect(syllabify(word).join('-')).toBe(expected);
  });
});

describe('acentuación', () => {
  it.each([['llegó', 'aguda'], ['calavera', 'llana'], ['pájaro', 'esdrujula'], ['ciudad', 'aguda'], ['árbol', 'llana'], ['examen', 'llana']])('%s es %s', (w, t) => {
    expect(stressType(w)).toBe(t);
  });
});

describe('rimas por sonido', () => {
  it('rima consonante desde la vocal tónica', () => {
    expect(rhymeKey('puntería')).toBe('ia');
    expect(compareRhyme('panteón', 'corazón')).toBe('consonante');
    expect(compareRhyme('cuento', 'aliento')).toBe('consonante');
  });
  it('considera equivalencias sonoras (b/v, z/s, c/s)', () => {
    expect(compareRhyme('vez', 'es')).toBe('consonante');
    expect(compareRhyme('nube', 'tuve')).toBe('consonante');
    expect(compareRhyme('cocina', 'piscina')).toBe('consonante');
  });
  it('distingue r y rr', () => {
    expect(compareRhyme('guerra', 'tierra')).toBe('consonante');
    expect(compareRhyme('guerra', 'calavera')).toBe('asonante');
  });
  it('detecta rima asonante y ausencia de rima', () => {
    expect(compareRhyme('casa', 'mañana')).toBe('asonante');
    expect(compareRhyme('flor', 'mesa')).toBe(null);
  });
  it('señala la misma palabra como rima idéntica, con o sin tilde', () => {
    expect(compareRhyme('día', 'Dia')).toBe('identica');
  });
  it('no confunde terminaciones escritas iguales con distinto acento', () => {
    expect(compareRhyme('cantó', 'canto')).not.toBe('consonante');
  });
});

describe('esquemas de rima', () => {
  it('genera la longitud exacta para 2 a 8 versos', () => {
    for (const scheme of ['pareada', 'alternada', 'abrazada', 'libre']) {
      for (let n = 2; n <= 8; n += 1) expect(schemeLetters(scheme, n)).toHaveLength(n);
    }
  });
  it('produce los patrones clásicos con 4 versos', () => {
    expect(schemeLetters('pareada', 4)).toBe('AABB');
    expect(schemeLetters('alternada', 4)).toBe('ABAB');
    expect(schemeLetters('abrazada', 4)).toBe('ABBA');
  });
});
