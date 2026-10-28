/**
 * Validación guiada de las frases libres del formulario.
 * Detecta si el gusto empieza con un verbo en infinitivo y si la defensa
 * empieza con un verbo en pasado, y propone una corrección. Son
 * heurísticas: la persona puede aceptar la sugerencia o dejar su texto.
 */
import { collapseSpaces, stripAccents } from '../../core/normalization.js';

/** Máximo de palabras por dato para que los versos conserven una medida razonable. */
export const WORD_LIMITS = { oficio: 3, gusto: 4, cualidad: 3, lugar: 4, anecdota: 8, defensa: 7 };

const CLITICS = new Set(['le', 'les', 'lo', 'la', 'los', 'las', 'se', 'me', 'te', 'nos']);
const ENCLITIC = /(se|le|les|lo|la|los|las|me|te|nos)+$/;
const IR_VERBS = new Set(['escribir', 'vivir', 'dormir', 'decir', 'pedir', 'salir', 'subir', 'abrir', 'construir', 'servir', 'sentir', 'seguir', 'repetir', 'competir', 'consumir', 'discutir', 'recibir', 'compartir', 'reír', 'sonreír', 'huir', 'medir', 'mentir', 'morir', 'oír', 'partir', 'permitir', 'prohibir', 'sufrir', 'unir', 'vestir', 'cumplir', 'describir', 'existir', 'decidir', 'imprimir', 'dirigir', 'elegir', 'corregir', 'conseguir', 'preferir', 'divertir', 'convertir', 'producir', 'conducir', 'traducir', 'ir']);
const NOUN_VERBS = {
  futbol: 'jugar', fútbol: 'jugar', basquetbol: 'jugar', beisbol: 'jugar', ajedrez: 'jugar', videojuegos: 'jugar', lotería: 'jugar', canicas: 'jugar', voleibol: 'jugar',
  cumbia: 'bailar', salsa: 'bailar', danzón: 'bailar', baile: 'bailar', bachata: 'bailar', reguetón: 'bailar',
  canciones: 'cantar', rancheras: 'cantar', karaoke: 'cantar', boleros: 'cantar',
  libros: 'leer', cuentos: 'leer', novelas: 'leer', historietas: 'leer', revistas: 'leer',
  tamales: 'hacer', pasteles: 'hacer', galletas: 'hacer', pan: 'hacer', tortillas: 'hacer',
  tacos: 'comer', dulces: 'comer', helado: 'comer', chocolate: 'comer', pizza: 'comer',
  guitarra: 'tocar', piano: 'tocar', violín: 'tocar', trompeta: 'tocar', tambor: 'tocar',
  plantas: 'cuidar', flores: 'cuidar', perros: 'pasear', gatos: 'cuidar', bicicleta: 'andar en', películas: 'ver', series: 'ver', telenovelas: 'ver',
};
const PRETERITE = {
  dar: 'dio', hacer: 'hizo', decir: 'dijo', poner: 'puso', tener: 'tuvo', venir: 'vino', querer: 'quiso', traer: 'trajo', ir: 'fue', ser: 'fue', ver: 'vio', saber: 'supo', poder: 'pudo', estar: 'estuvo', andar: 'anduvo', leer: 'leyó', creer: 'creyó', oír: 'oyó', caer: 'cayó', construir: 'construyó', huir: 'huyó', pedir: 'pidió', servir: 'sirvió', dormir: 'durmió', sentir: 'sintió', mentir: 'mintió', reír: 'rio', sonreír: 'sonrió', seguir: 'siguió', preferir: 'prefirió', competir: 'compitió', conseguir: 'consiguió', vestir: 'vistió', repetir: 'repitió', conducir: 'condujo', traducir: 'tradujo', producir: 'produjo', morir: 'murió', elegir: 'eligió', corregir: 'corrigió', medir: 'midió', divertir: 'divirtió',
};
const STRONG_PAST = new Set(['fue', 'dio', 'vio', 'rio', 'hizo', 'dijo', 'puso', 'tuvo', 'vino', 'quiso', 'trajo', 'supo', 'pudo', 'estuvo', 'anduvo', 'cupo', 'hubo']);

const words = (text) => collapseSpaces(text).split(' ').filter(Boolean);

/** ¿La palabra es un infinitivo (con o sin pronombre pegado: «echarse», «verla»)? */
export function isInfinitive(word) {
  const w = stripAccents(word.toLowerCase()).replace(ENCLITIC, '');
  return w === 'ir' || (/(ar|er|ir)$/.test(w) && w.length > 2);
}

/** ¿La palabra es pretérito de tercera persona («ofreció», «hizo», «se puso»)? */
export function isPreterite(word) {
  const w = word.toLowerCase();
  // Regulares en -ó/-ió y pretéritos fuertes: tuvo, detuvo, dijo, quiso, supo, pudo, puso, hizo, vino, trajo, condujo…
  return /ó$/.test(w) || STRONG_PAST.has(w) || /(uvo|ijo|ujo|iso|upo|udo|uso|izo|ajo)$/.test(w) || /^(vino|previno|intervino|convino)$/.test(w);
}

/** Infinitivo probable de una forma conjugada o gerundio (para sugerir). */
function infinitiveOf(word) {
  const w = word.toLowerCase();
  if (/ando$/.test(w)) return w.replace(/ando$/, 'ar');
  if (/iendo$/.test(w)) { const stem = w.replace(/iendo$/, ''); return IR_VERBS.has(`${stem}ir`) ? `${stem}ir` : `${stem}er`; }
  if (/a$/.test(w)) return w.replace(/a$/, 'ar');
  if (/e$/.test(w)) { const stem = w.slice(0, -1); return IR_VERBS.has(`${stem}ir`) ? `${stem}ir` : `${stem}er`; }
  return null;
}

/** Pretérito de tercera persona a partir de un infinitivo. */
export function preteriteOf(infinitive) {
  const inf = infinitive.toLowerCase();
  if (PRETERITE[inf]) return PRETERITE[inf];
  if (/ar$/.test(inf)) return `${inf.slice(0, -2)}ó`;
  if (/(er|ir)$/.test(inf)) return `${inf.slice(0, -2)}ió`;
  return null;
}

/** Sugerencia para el gusto: debe empezar con un verbo en infinitivo. */
export function suggestGusto(text) {
  const list = words(text);
  if (!list.length || isInfinitive(list[0])) return null;
  const first = list[0].toLowerCase();
  const ARTICLES = ['el', 'la', 'los', 'las', 'un', 'una', 'su', 'sus'];
  // 1) La primera palabra ya es un verbo (gerundio o conjugado): «bailando cumbia», «escribe cuentos».
  const looksVerbal = /(ando|iendo)$/.test(first) || (!ARTICLES.includes(first) && !NOUN_VERBS[first] && /[ae]$/.test(first));
  if (looksVerbal) {
    const inf = infinitiveOf(first);
    if (inf) return [inf, ...list.slice(1)].join(' ');
  }
  // 2) Empieza con un sustantivo conocido: «el futbol» → «jugar futbol», «la guitarra» → «tocar la guitarra».
  const noun = list.find((w) => NOUN_VERBS[w.toLowerCase()]);
  if (noun) {
    const verb = NOUN_VERBS[noun.toLowerCase()];
    const keepArticle = verb === 'tocar' || verb === 'andar en';
    const rest = keepArticle ? list : list.filter((w) => !ARTICLES.includes(w.toLowerCase()));
    return `${verb} ${rest.join(' ')}`;
  }
  return '';
}

/** Sugerencia para la defensa: debe empezar con un verbo en pasado. */
export function suggestDefensa(text) {
  const list = words(text);
  const verbIndex = list.findIndex((w) => !CLITICS.has(w.toLowerCase()));
  if (verbIndex < 0) return '';
  const verb = list[verbIndex];
  if (isPreterite(verb)) return null;
  const pre = list.slice(0, verbIndex);
  const after = list.slice(verbIndex + 1);
  // Infinitivo con pronombres pegados: «ofrecerle un tamal» → «le ofreció un tamal».
  const lower = verb.toLowerCase();
  const match = stripAccents(lower).match(/^(.*?(ar|er|ir))((?:se|le|les|lo|la|los|las|me|te|nos)*)$/);
  if (match && match[1].length > 2) {
    const base = lower.slice(0, match[1].length).replace(/[áé]/g, (c) => ({ á: 'a', é: 'e' }[c]));
    const clitics = match[3] ? match[3].match(/se|les|le|los|las|lo|la|me|te|nos/g) : [];
    const past = preteriteOf(base);
    if (past) return [...pre, ...clitics, past, ...after].join(' ');
  }
  // Presente: «le ofrece un tamal» → «le ofreció un tamal».
  if (/a$/.test(lower)) return [...pre, `${lower.slice(0, -1)}ó`, ...after].join(' ');
  if (/e$/.test(lower)) return [...pre, `${lower.slice(0, -1)}ió`, ...after].join(' ');
  return '';
}

/**
 * Revisa los datos libres. Devuelve { errors, suggestions } por campo.
 * `acceptAsIs` permite conservar el texto aunque la forma no parezca la esperada.
 */
export function checkPhrases(params, acceptAsIs = {}) {
  const errors = {};
  const suggestions = {};
  for (const [field, max] of Object.entries(WORD_LIMITS)) {
    const count = words(params[field] || '').length;
    if (count > max) errors[field] = `Usa como máximo ${max} palabras para que el verso no quede demasiado largo (ahora hay ${count}).`;
  }
  if (!errors.gusto && params.gusto && !acceptAsIs.gusto) {
    const fix = suggestGusto(params.gusto);
    if (fix !== null) {
      errors.gusto = 'El gusto debe empezar con un verbo en infinitivo (terminado en -ar, -er o -ir), por ejemplo «jugar futbol».';
      if (fix && fix !== params.gusto) suggestions.gusto = fix;
    }
  }
  if (!errors.defensa && params.defensa && !acceptAsIs.defensa) {
    const fix = suggestDefensa(params.defensa);
    if (fix !== null) {
      errors.defensa = 'Escríbelo como algo que ya pasó, empezando con el verbo: «le ofreció un tamal», «se escondió en la alacena».';
      if (fix && fix !== params.defensa) suggestions.defensa = fix;
    }
  }
  return { errors, suggestions };
}
