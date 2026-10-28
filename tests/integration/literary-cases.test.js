/**
 * 30 casos literarios. Comprueba criterios medibles y escribe todos los
 * poemas en docs/informe-casos-literarios.md para su lectura humana.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import { generatePoem } from '../../src/modules/generator/generation-service.js';
import { schemeLetters, compareRhyme } from '../../src/modules/literary-engine/rhyme-engine.js';
import { lastWord, normalizeForSearch } from '../../src/core/normalization.js';
import { kidsUnsafeTerms } from '../../src/modules/literary-engine/vocabulary.js';

const CASES = [
  { names: 'Doña Lupe', gender: 'a', oficio: 'cocinera', gusto: 'hacer tamales', cualidad: 'muy platicadora', lugar: 'el mercado', defensa: 'le ofreció un tamal de rajas', tone: 'tradicional', stanzas: 4, verses: 4, scheme: 'alternada' },
  { names: 'Mateo', gusto: 'jugar futbol', cualidad: 'muy distraído', lugar: 'la escuela', tone: 'infantil', stanzas: 3, verses: 4, scheme: 'pareada', mustInclude: 'un balón', audience: 'educativo', level: 'primaria-baja' },
  { names: 'Ana, Luis y Pepe', tone: 'humoristico', stanzas: 2, verses: 6, scheme: 'abrazada', preferDialogue: true },
  { names: 'el profe Eduardo', oficio: 'bibliotecario', gusto: 'leer cuentos', cualidad: 'muy paciente', lugar: 'la biblioteca', defensa: 'le prestó un libro de cuentos', tone: 'tierno', stanzas: 4, verses: 4, scheme: 'pareada' },
  { names: 'Don Chucho', oficio: 'taxista', gusto: 'tocar el claxon', anecdota: 'se pasó un alto', tone: 'satirico', stanzas: 5, verses: 4, scheme: 'abrazada' },
  { names: 'Valeria', gender: 'a', gusto: 'bailar cumbia', lugar: 'la fiesta', tone: 'fantastico', stanzas: 3, verses: 4, scheme: 'alternada', ending: 'E' },
  { names: 'el abuelo Ramón', oficio: 'carpintero', gusto: 'contar chistes', tone: 'narrativo', stanzas: 6, verses: 4, scheme: 'alternada' },
  { names: 'Sofía', gender: 'a', tone: 'infantil', stanzas: 2, verses: 4, scheme: 'pareada', audience: 'educativo', level: 'preescolar' },
  { names: 'Panchito', gusto: 'comer dulces', tone: 'infantil', stanzas: 2, verses: 2, scheme: 'pareada', audience: 'educativo', level: 'preescolar' },
  { names: 'la directora Toña', gender: 'a', oficio: 'directora', cualidad: 'muy organizada', lugar: 'la dirección', tone: 'humoristico', stanzas: 4, verses: 4, scheme: 'alternada' },
  { names: 'Jorge', oficio: 'doctor', gusto: 'recetar jarabes', tone: 'satirico', stanzas: 5, verses: 4, scheme: 'pareada', audience: 'educativo', level: 'secundaria' },
  { names: 'Lucía', gender: 'a', gusto: 'pintar paisajes', cualidad: 'muy soñadora', tone: 'fantastico', stanzas: 4, verses: 6, scheme: 'abrazada' },
  { names: 'Tío Beto', anecdota: 'se comió el pan de la ofrenda', tone: 'tradicional', stanzas: 3, verses: 4, scheme: 'alternada', ending: 'L' },
  { names: 'Camila', gender: 'a', gusto: 'cantar rancheras', lugar: 'el patio', tone: 'tierno', stanzas: 3, verses: 4, scheme: 'pareada', ending: 'F' },
  { names: 'Rodrigo', cualidad: 'muy presumido', tone: 'humoristico', stanzas: 2, verses: 8, scheme: 'alternada' },
  { names: 'María José', gender: 'a', oficio: 'enfermera', lugar: 'el hospital', tone: 'narrativo', stanzas: 5, verses: 5, scheme: 'pareada' },
  { names: 'el equipo de basquetbol', tone: 'humoristico', stanzas: 3, verses: 4, scheme: 'libre' },
  { names: 'Don Polo', oficio: 'panadero', gusto: 'hornear conchas', lugar: 'la panadería', tone: 'tradicional', stanzas: 8, verses: 8, scheme: 'alternada' },
  { names: 'Ximena', gender: 'a', gusto: 'jugar ajedrez', tone: 'fantastico', stanzas: 2, verses: 3, scheme: 'abrazada' },
  { names: 'Kevin', gusto: 'jugar videojuegos', anecdota: 'olvidó la tarea', tone: 'infantil', stanzas: 4, verses: 4, scheme: 'alternada', audience: 'educativo', level: 'primaria-alta' },
  { names: 'la maestra Ruth', gender: 'a', oficio: 'maestra', gusto: 'revisar cuadernos', tone: 'tierno', stanzas: 4, verses: 4, scheme: 'abrazada', audience: 'educativo', level: 'primaria-alta' },
  { names: 'Ñoño', cualidad: 'muy glotón', tone: 'humoristico', stanzas: 3, verses: 4, scheme: 'pareada', avoid: 'panteón, tumba' },
  { names: 'Martha y Julieta', oficio: 'maestras', tone: 'narrativo', stanzas: 3, verses: 4, scheme: 'alternada' },
  { names: 'El Güero', gusto: 'vender elotes', lugar: 'la esquina', tone: 'tradicional', stanzas: 4, verses: 4, scheme: 'pareada', mustInclude: 'una canasta' },
  { names: 'Renata', gender: 'a', tone: 'satirico', stanzas: 3, verses: 4, scheme: 'alternada', audience: 'educativo', level: 'secundaria', preferDialogue: true },
  { names: 'Óscar', oficio: 'portero', cualidad: 'muy valiente', defensa: 'le detuvo un penal', tone: 'fantastico', stanzas: 4, verses: 4, scheme: 'pareada', ending: 'E', mustInclude: 'una espada' },
  { names: 'Abuela Chela', gender: 'a', gusto: 'tejer bufandas', tone: 'tierno', stanzas: 5, verses: 4, scheme: 'alternada', ending: 'L' },
  { names: 'Iker', tone: 'tradicional', stanzas: 2, verses: 4, scheme: 'libre' },
  { names: 'Fernanda', gender: 'a', gusto: 'nadar', lugar: 'la alberca', tone: 'infantil', stanzas: 3, verses: 4, scheme: 'pareada', audience: 'educativo', level: 'primaria-baja' },
  { names: 'Don Fernando', oficio: 'electricista', anecdota: 'se quedó sin luz en la boda', tone: 'humoristico', stanzas: 6, verses: 6, scheme: 'abrazada' },
];

const rows = [];
const allPoems = [];

describe('30 casos literarios', () => {
  CASES.forEach((raw, index) => {
    it(`caso ${index + 1}: ${raw.names} (${raw.tone}, ${raw.stanzas}×${raw.verses}, ${raw.scheme})`, () => {
      const { poem, warnings } = generatePoem(raw, 1000 + index);
      const verses = poem.stanzas.flatMap((s) => s.verses);
      const text = normalizeForSearch(verses.join(' '));

      expect(poem.stanzas).toHaveLength(raw.stanzas);
      poem.stanzas.forEach((s) => expect(s.verses).toHaveLength(raw.verses));
      expect(verses.every((v) => v.trim() && v !== '…')).toBe(true);
      expect(new Set(verses.map(normalizeForSearch)).size).toBe(verses.length);

      let pairs = 0;
      let ok = 0;
      if (raw.scheme !== 'libre') {
        poem.stanzas.forEach((s) => {
          const letters = schemeLetters(raw.scheme, s.verses.length);
          const first = {};
          [...letters].forEach((l, j) => {
            if (first[l] === undefined) { first[l] = j; return; }
            pairs += 1;
            if (/consonante|asonante/.test(compareRhyme(lastWord(s.verses[first[l]]), lastWord(s.verses[j])) || '')) ok += 1;
          });
        });
      }
      const fields = ['oficio', 'gusto', 'cualidad', 'lugar', 'anecdota', 'defensa', 'mustInclude'].filter((f) => raw[f]);
      const used = fields.filter((f) => normalizeForSearch(raw[f]).split(' ').filter((w) => w.length > 3).some((w) => text.includes(w)));
      const kids = raw.tone === 'infantil' || raw.audience === 'educativo';
      const unsafe = kids ? kidsUnsafeTerms(verses.join(' ')) : [];
      const avoided = (raw.avoid || '').split(',').map((w) => normalizeForSearch(w)).filter(Boolean).filter((w) => text.includes(w));
      const nameIn1 = normalizeForSearch(poem.stanzas[0].verses.join(' ')).includes(normalizeForSearch(raw.names.split(/,| y /)[0]));
      const death = /muerte|calaca|catrina|flaca|huesuda|pelona|dientona|calaquita/.test(text);
      const evalOk = poem.evaluation.checks.filter((c) => c.status === 'ok').length;
      const evalReview = poem.evaluation.checks.filter((c) => c.status === 'revisar').map((c) => c.label);

      expect(unsafe).toEqual([]);
      expect(avoided).toEqual([]);
      expect(death).toBe(true);
      expect(nameIn1 || raw.names.includes(',') || raw.names.includes(' y ')).toBe(true);

      rows.push({ index: index + 1, raw, pairs, ok, fields, used, warnings, evalOk, evalReview, ending: poem.engine.ending, hook: poem.engine.hook, thread: poem.engine.closingThread > 0 });
      allPoems.push({ index: index + 1, raw, poem, warnings });
    });
  });

  afterAll(() => {
    rows.sort((a, b) => a.index - b.index);
    allPoems.sort((a, b) => a.index - b.index);
    const totalPairs = rows.reduce((n, r) => n + r.pairs, 0);
    const totalOk = rows.reduce((n, r) => n + r.ok, 0);
    const totalFields = rows.reduce((n, r) => n + r.fields.length, 0);
    const totalUsed = rows.reduce((n, r) => n + r.used.length, 0);
    const lines = [
      '# Informe de 30 casos literarios',
      '',
      `Generado automáticamente por \`tests/integration/literary-cases.test.js\` (semillas fijas 1000–1029, reproducible).`,
      '',
      '## Resultados medibles',
      '',
      `- Parejas de versos que debían rimar: ${totalPairs}; riman según el motor de rimas: ${totalOk} (${((100 * totalOk) / Math.max(1, totalPairs)).toFixed(1)} %).`,
      `- Datos personales proporcionados: ${totalFields}; reconocibles en el poema: ${totalUsed} (${((100 * totalUsed) / Math.max(1, totalFields)).toFixed(1)} %).`,
      `- Hilo conductor: ${rows.filter((r) => r.hook).length} casos con gancho; en ${rows.filter((r) => r.hook && r.thread).length} el gancho reaparece en el conflicto, la resolución o el remate.`,
      '- Versos vacíos o repetidos: 0 (la prueba falla si aparece alguno).',
      '- Términos no aptos en casos infantiles o escolares: 0. Palabras pedidas para evitar que aparecieron: 0.',
      '',
      '| # | Protagonista | Tono | Extensión | Rima | Rimas OK | Datos usados | Gancho (¿vuelve al final?) | Desenlace | Avisos | El evaluador pide revisar |',
      '|---|---|---|---|---|---|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.index} | ${r.raw.names} | ${r.raw.tone} | ${r.raw.stanzas}×${r.raw.verses} | ${r.raw.scheme} | ${r.raw.scheme === 'libre' ? 'n/a' : `${r.ok}/${r.pairs}`} | ${r.used.length}/${r.fields.length}${r.fields.length > r.used.length ? ` (falta: ${r.fields.filter((f) => !r.used.includes(f)).join(', ')})` : ''} | ${r.hook ? `${r.hook} (${r.thread ? 'sí' : 'no'})` : '—'} | ${{ L: 'se lo lleva', E: 'escapa', F: 'fiesta' }[r.ending]} | ${r.warnings.length} | ${r.evalReview.join(', ') || '—'} |`),
      '',
      '## Poemas generados',
      '',
      ...allPoems.flatMap(({ index, raw, poem, warnings }) => [
        `### ${index}. ${poem.title}`,
        '',
        `*Parámetros:* ${Object.entries(raw).map(([k, v]) => `${k}: ${v}`).join('; ')}`,
        '',
        ...poem.stanzas.flatMap((s) => [...s.verses.map((v) => `${v}  `), '']),
        ...(warnings.length ? [`> Avisos: ${warnings.join(' ')}`, ''] : []),
      ]),
    ];
    fs.mkdirSync('docs', { recursive: true });
    fs.writeFileSync('docs/informe-casos-literarios.md', lines.join('\n'));
  });
});
