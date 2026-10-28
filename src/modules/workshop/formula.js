/**
 * «La fórmula de la calaverita»: guía didáctica usada en el Taller literario,
 * en el editor (pista por estrofa) y en las actividades educativas.
 */

export const FORMULA_INTRO = [
  'La calaverita literaria es un poema breve y burlón que se escribe para el Día de Muertos. Imagina que la Muerte viene por alguien que conocemos y cuenta, con rima y con humor, qué pasa en ese encuentro.',
  'Nació en el siglo XIX en los periódicos de la Ciudad de México, donde se publicaban epitafios en broma sobre políticos y personajes conocidos. José Guadalupe Posada ilustró muchas de ellas con sus calaveras; su «Calavera Garbancera» es la figura que después conocimos como la Catrina.',
];

/** Una entrada por etapa narrativa, en el orden del relato. */
export const STAGE_GUIDE = {
  presentacion: {
    title: 'Presenta al protagonista',
    purpose: 'Di quién es y dónde lo encontramos, para que quien lee lo reconozca desde el primer verso.',
    questions: ['¿Cómo se llama?', '¿A qué se dedica?', '¿Dónde suele estar?'],
    tip: 'Pon el nombre en el primer o segundo verso.',
  },
  rasgo: {
    title: 'Cuenta lo que lo hace único',
    purpose: 'Elige un gusto, una costumbre o una anécdota. De aquí saldrá el humor de toda la calaverita.',
    questions: ['¿Qué le encanta hacer?', '¿Qué hace que nadie más hace?', '¿Qué le pasó una vez que todos recuerdan?'],
    tip: 'Escoge un solo detalle y guárdalo: lo vas a necesitar al final.',
  },
  llegada: {
    title: 'Llega la Muerte',
    purpose: 'Aparece la Muerte como si fuera una persona: camina, habla, toca la puerta. A eso se le llama personificación.',
    questions: ['¿Cómo la vas a llamar: Catrina, Calaca, Flaca, Huesuda?', '¿Cómo llega y qué la atrae hasta ahí?'],
    tip: 'Lo más gracioso es que llegue atraída por el detalle que elegiste antes.',
  },
  conflicto: {
    title: 'Plantea el conflicto',
    purpose: 'La Muerte quiere llevárselo y el protagonista reacciona a su manera: discute, se esconde, hace un trato.',
    questions: ['¿Qué haría esta persona frente a la Muerte?', '¿Cómo usaría su gusto u oficio para defenderse?'],
    tip: 'Usa un diálogo corto entre comillas: «Vine por ti», le advirtió.',
  },
  resolucion: {
    title: 'Resuelve la historia',
    purpose: 'Cuenta cómo termina el encuentro: se lo lleva, logra escapar o terminan de fiesta.',
    questions: ['¿Quién gana?', '¿Cómo ayuda el detalle del principio a resolverlo?'],
    tip: 'Si el final usa el mismo detalle del principio, la calaverita se siente redonda.',
  },
  remate: {
    title: 'Cierra con un remate',
    purpose: 'El último verso es la sorpresa o el chiste final. Es lo que la gente repite después.',
    questions: ['¿Qué frase final haría reír o sorprendería?', '¿Cómo queda el protagonista después de todo?'],
    tip: 'Guarda la mejor rima y la idea más ingeniosa para el último verso.',
  },
};

export const STAGE_ORDER = ['presentacion', 'rasgo', 'llegada', 'conflicto', 'resolucion', 'remate'];

export const GOLDEN_RULES = [
  ['Hilo conductor', 'El detalle que presentas al principio regresa en el conflicto o el final. Si Lupe hace tamales, la Muerte termina vendiendo tamales.'],
  ['Estrofas de cuatro versos', 'Es la forma más común. Separa cada estrofa con una línea en blanco.'],
  ['Versos de ocho sílabas', 'El octosílabo es la medida tradicional. Cuenta las sílabas en voz alta; si una palabra termina en vocal y la siguiente empieza con vocal, se cuentan juntas (sinalefa).'],
  ['Rima constante', 'Con rima alternada (ABAB) riman el verso 1 con el 3 y el 2 con el 4. Busca palabras que suenen igual desde la vocal fuerte: tamalera / primera.'],
  ['La Muerte es un personaje', 'Dale un apodo y hazla actuar como persona: llega, habla, se ríe, se equivoca.'],
  ['Humor con cariño', 'Se vale burlarse de las costumbres, no de lo que lastima: el cuerpo, una enfermedad o una tristeza real. Si la persona no se reiría, cambia el chiste.'],
];

/** Calaverita modelo original de CalaverArte, en octosílabos con rima ABAB. */
export const MODEL_POEM = {
  title: 'Doña Lupe y la Catrina',
  stanzas: [
    {
      stages: ['presentacion', 'rasgo'],
      note: 'Presenta a la protagonista y su rasgo: los tamales serán el hilo conductor.',
      verses: ['En el mercado vivía', 'la gran Lupe tamalera,', 'y vendía todo el día', 'con su salsa de primera.'],
    },
    {
      stages: ['llegada'],
      note: 'La Catrina llega atraída justamente por el detalle del principio.',
      verses: ['Una noche, la Catrina', 'siguió el aroma a cebolla', 'y se coló a la cocina', 'a robarse un tamal de olla.'],
    },
    {
      stages: ['conflicto'],
      note: 'Diálogo y reacción del personaje: en vez de huir, la invita a comer.',
      verses: ['«Vine por ti», le advirtió;', 'pero Lupe, muy tranquila,', 'con un tamal la invitó,', 'y la Catrina hizo fila.'],
    },
    {
      stages: ['resolucion', 'remate'],
      note: 'El final retoma los tamales y remata con la sorpresa: ahora la Catrina trabaja con ella.',
      verses: ['Le gustó tanto el guisado', 'que se quedó de ayudante:', 'la Catrina, en el mercado,', 'vende tamales. ¡Qué aguante!'],
    },
  ],
};
