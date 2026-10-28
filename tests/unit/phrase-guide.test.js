import { describe, it, expect } from 'vitest';
import { suggestGusto, suggestDefensa, checkPhrases, isInfinitive, isPreterite } from '../../src/modules/generator/phrase-guide.js';
import { validateParams } from '../../src/modules/generator/generation-schema.js';

describe('validación guiada de frases', () => {
  it.each([['el futbol', 'jugar futbol'], ['los tamales', 'hacer tamales'], ['bailando cumbia', 'bailar cumbia'], ['baila salsa', 'bailar salsa'], ['escribe cuentos', 'escribir cuentos'], ['la guitarra', 'tocar la guitarra']])('gusto «%s» → «%s»', (input, expected) => {
    expect(suggestGusto(input)).toBe(expected);
  });
  it('acepta gustos que ya empiezan con infinitivo', () => {
    for (const g of ['hacer tamales', 'echarse una siesta', 'reír', 'ir al cine']) expect(suggestGusto(g)).toBeNull();
    expect(isInfinitive('verla')).toBe(true);
  });
  it.each([['ofrecerle un tamal', 'le ofreció un tamal'], ['esconderse en la alacena', 'se escondió en la alacena'], ['darle un abrazo', 'le dio un abrazo'], ['contarle un chiste', 'le contó un chiste'], ['le ofrece un tamal', 'le ofreció un tamal']])('defensa «%s» → «%s»', (input, expected) => {
    expect(suggestDefensa(input)).toBe(expected);
  });
  it('acepta defensas en pasado, incluidos los pretéritos irregulares', () => {
    for (const d of ['le ofreció un tamal', 'se escondió', 'hizo un trato', 'le detuvo un penal', 'le dijo un chiste', 'le puso una trampa', 'vino corriendo', 'se mantuvo firme']) expect(suggestDefensa(d)).toBeNull();
    expect(isPreterite('anduvo')).toBe(true);
  });
  it('limita la longitud de cada dato', () => {
    const { errors } = checkPhrases({ oficio: 'maestra de inglés de secundaria' });
    expect(errors.oficio).toMatch(/máximo 3 palabras/);
  });
  it('permite conservar el texto propio con «Dejarlo así»', () => {
    expect(validateParams({ names: 'Ana', gusto: 'el futbol' }).errors.gusto).toBeTruthy();
    expect(validateParams({ names: 'Ana', gusto: 'el futbol' }).suggestions.gusto).toBe('jugar futbol');
    expect(validateParams({ names: 'Ana', gusto: 'el futbol', acceptAsIs: { gusto: true } }).ok).toBe(true);
  });
});
