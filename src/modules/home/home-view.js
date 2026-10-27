import { el, svgFromString, formatDate } from '../../core/dom.js';
import { button } from '../../core/ui-kit.js';
import { HERO_ART } from './hero-art.js';

export async function renderHome(app) {
  let recent = [];
  let storageProblem = null;
  try {
    recent = (await app.repo.list()).slice(0, 3);
  } catch (error) {
    storageProblem = error.message;
  }
  const hero = el('section', { class: 'hero', 'aria-labelledby': 'hero-title' },
    el('div', { class: 'hero__text' },
      el('p', { class: 'hero__eyebrow' }, 'Taller de calaveritas literarias'),
      el('h1', { id: 'hero-title', tabindex: '-1' }, 'CalaverArte'),
      el('p', { class: 'hero__motto' }, '«La Catrina pone la idea; tú pones la historia».'),
      el('p', {}, 'Escribe calaveritas literarias con rima, edítalas verso por verso, revísalas y prepáralas para imprimir.'),
      el('div', { class: 'row' },
        button('Crear una calaverita', { variant: 'accent', onClick: () => app.go('crear') }),
        button('Abrir la biblioteca', { variant: 'secondary', onClick: () => app.go('biblioteca') }))),
    el('div', { class: 'hero__art' }, svgFromString(HERO_ART)));

  const pasos = el('section', { 'aria-labelledby': 'como' },
    el('h2', { id: 'como' }, 'Así se arma una calaverita'),
    el('ol', { class: 'steps' },
      el('li', {}, el('h3', {}, 'Cuéntanos del personaje'), el('p', {}, 'Nombre, oficio, gustos y una travesura: con eso se escribe la historia.')),
      el('li', {}, el('h3', {}, 'La Catrina rima'), el('p', {}, 'Se genera la calaverita con reglas y plantillas propias, sin inteligencia artificial.')),
      el('li', {}, el('h3', {}, 'Edítala e imprímela'), el('p', {}, 'Cambia cada verso, revisa la rima y elige un diseño de papel picado o cempasúchil.'))));

  const recentSection = el('section', { 'aria-labelledby': 'recientes' },
    el('h2', { id: 'recientes' }, 'Creaciones recientes'),
    storageProblem
      ? el('p', { class: 'notice notice--warn' }, storageProblem)
      : recent.length
        ? el('ul', { class: 'recent-list' }, recent.map((poem) => el('li', { class: 'card' },
          el('h3', {}, poem.title),
          el('p', { class: 'hint' }, `Modificada: ${formatDate(poem.updatedAt)}`),
          button('Abrir en el editor', { small: true, onClick: () => app.openPoem(poem.id) }))))
        : el('p', {}, 'Todavía no hay calaveritas guardadas. La primera que generes aparecerá aquí.'));

  const links = [
    ['taller', 'Taller literario', 'Busca palabras que riman y cuenta las sílabas de tus versos.'],
    ['educacion', 'Modo educativo', 'Actividades imprimibles por nivel: completar versos, ordenar estrofas, guías de revisión.'],
    ['disenador', 'Diseñador e impresión', 'Elige un estilo gráfico, imprime o guarda como PDF desde tu navegador.'],
    ['configuracion', 'Configuración', 'Tamaño de letra, tema de colores y respaldo de tus datos.'],
  ];
  const quick = el('section', { 'aria-labelledby': 'accesos' },
    el('h2', { id: 'accesos' }, 'Más herramientas'),
    el('div', { class: 'grid grid--2' }, links.map(([id, title, text]) => el('a', { class: 'card card--link', href: `#/${id}` }, el('h3', {}, title), el('p', {}, text)))));

  return el('div', { class: 'stack' }, hero, pasos, recentSection, quick);
}
