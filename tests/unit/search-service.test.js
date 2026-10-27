import { describe, it, expect } from 'vitest';
import { searchPoems } from '../../src/modules/library/search-service.js';

const mk = (id, title, names, verses, tone, updatedAt, favorite = false) => ({ id, title, params: { names, tone }, protagonists: [], stanzas: [{ verses }], updatedAt, favorite });
const poems = [
  mk('1', 'Calaverita para Doña Lupe', 'Doña Lupe', ['hacía tamales'], 'tradicional', '2026-10-01T10:00:00.000Z', true),
  mk('2', 'La aventura de Mateo', 'Mateo', ['jugaba futbol con un balón'], 'infantil', '2026-10-20T10:00:00.000Z'),
  mk('3', 'Epitafio del profe', 'Profe Eduardo', ['leía en la biblioteca'], 'satirico', '2026-09-15T10:00:00.000Z'),
];

describe('búsqueda en la biblioteca', () => {
  it('busca por título, protagonista y texto sin importar tildes', () => {
    expect(searchPoems(poems, { query: 'dona', field: 'titulo' }).map((p) => p.id)).toEqual(['1']);
    expect(searchPoems(poems, { query: 'mateo', field: 'protagonista' }).map((p) => p.id)).toEqual(['2']);
    expect(searchPoems(poems, { query: 'BALON', field: 'texto' }).map((p) => p.id)).toEqual(['2']);
    expect(searchPoems(poems, { query: 'biblioteca' }).map((p) => p.id)).toEqual(['3']);
  });
  it('filtra por tono, fechas y favoritos', () => {
    expect(searchPoems(poems, { tone: 'infantil' }).map((p) => p.id)).toEqual(['2']);
    expect(searchPoems(poems, { from: '2026-10-01', to: '2026-10-10' }).map((p) => p.id)).toEqual(['1']);
    expect(searchPoems(poems, { favoritesOnly: true }).map((p) => p.id)).toEqual(['1']);
  });
  it('ordena', () => {
    expect(searchPoems(poems).map((p) => p.id)).toEqual(['2', '1', '3']);
    expect(searchPoems(poems, { sort: 'antiguas' }).map((p) => p.id)).toEqual(['3', '1', '2']);
    expect(searchPoems(poems, { sort: 'titulo' }).map((p) => p.id)).toEqual(['1', '3', '2']);
  });
});
