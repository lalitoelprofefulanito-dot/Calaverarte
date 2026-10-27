import { describe, it, expect } from 'vitest';
import { normalizeForSearch, stripAccents, splitNames, joinNames, capitalizeFirst, lastWord, sanitizeText } from '../../src/core/normalization.js';

describe('normalización de texto', () => {
  it('quita tildes pero conserva la ñ', () => {
    expect(stripAccents('Muñeca, canción, pingüino')).toBe('Muñeca, cancion, pinguino');
  });
  it('normaliza para búsqueda sin signos ni mayúsculas', () => {
    expect(normalizeForSearch('¡La CATRINA llegó!  «Hola»')).toBe('la catrina llego hola');
  });
  it('separa nombres compuestos con comas e «y»', () => {
    expect(splitNames('María José, Juan Pablo y Ana')).toEqual(['María José', 'Juan Pablo', 'Ana']);
    expect(joinNames(['María José', 'Juan Pablo', 'Ana'])).toBe('María José, Juan Pablo y Ana');
  });
  it('capitaliza la primera letra respetando signos iniciales', () => {
    expect(capitalizeFirst('¡qué noche!')).toBe('¡Qué noche!');
    expect(capitalizeFirst('«ñandú»')).toBe('«Ñandú»');
  });
  it('obtiene la última palabra sin puntuación', () => {
    expect(lastWord('y la Catrina se reía.')).toBe('reía');
    expect(lastWord('«¡Yo no!»')).toBe('no');
  });
  it('elimina caracteres de control y recorta', () => {
    expect(sanitizeText('a\u0000b\n c', 10)).toBe('a b c');
    expect(sanitizeText('x'.repeat(20), 5)).toBe('xxxxx');
  });
});
