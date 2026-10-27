import { describe, it, expect } from 'vitest';
import { meterOf, checkStanzaRhythm } from '../../src/modules/literary-engine/rhythm-checker.js';

describe('métrica aproximada', () => {
  it('aplica sinalefa', () => {
    expect(meterOf('La Muerte llegó una noche').metric).toBe(8);
    expect(meterOf('con su guadaña y su puntería').metric).toBe(10);
  });
  it('aplica la ley del acento final', () => {
    expect(meterOf('y la Muerte se llevó').ending).toBe('aguda');
    expect(meterOf('y la Muerte se llevó').metric).toBe(8);
    expect(meterOf('era de huesos el pájaro').metric).toBe(8);
  });
  it('marca versos muy distintos de la mediana', () => {
    const result = checkStanzaRhythm(['La Muerte llegó una noche', 'a buscar a Don Ramón', 'y el pobre señor que estaba en la tienda comprando tortillas para la cena', 'se escondió en el panteón']);
    expect(result.find((r) => r.index === 2).flagged).toBe(true);
    expect(result.find((r) => r.index === 0).flagged).toBe(false);
  });
});
