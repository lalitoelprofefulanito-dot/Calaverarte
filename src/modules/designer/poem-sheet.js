/** Hoja de presentación de la calaverita, usada en el diseñador y al imprimir. */
import { el, svgFromString } from '../../core/dom.js';
import { sanitizeDesign, fontCss } from './design-presets.js';

// Adornos originales de CalaverArte (SVG propio, licencia MIT del proyecto).
const PAPEL_PICADO = (color) => `<svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4h600" stroke="#1E1D1A" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => {
  const x = i * 60;
  const fill = [color, '#D98E04', '#0F6E6A', '#5B2A86'][i % 4];
  return `<path d="M${x + 2} 4h56v40l-7 8-7-8-7 8-7-8-7 8-7-8-7 8-7-8z" fill="${fill}"/><circle cx="${x + 30}" cy="20" r="6" fill="#FFFBF0"/><path d="M${x + 14} 30l6 6 6-6M${x + 34} 30l6 6 6-6" stroke="#FFFBF0" stroke-width="2.5" fill="none"/>`;
}).join('')}</svg>`;

const MARIGOLD = '<svg viewBox="0 0 64 64" aria-hidden="true">' +
  Array.from({ length: 12 }, (_, i) => `<ellipse cx="32" cy="15" rx="7" ry="13" fill="${i % 2 ? '#D98E04' : '#F2A900'}" transform="rotate(${i * 30} 32 32)"/>`).join('') +
  '<circle cx="32" cy="32" r="9" fill="#8A4B00"/></svg>';

const SKULL = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6C18 6 9 16 9 28c0 7 3 12 8 16v8c0 3 2 5 5 5h20c3 0 5-2 5-5v-8c5-4 8-9 8-16C55 16 46 6 32 6z" fill="#FFFBF0" stroke="currentColor" stroke-width="3"/><circle cx="23" cy="29" r="7" fill="currentColor"/><circle cx="41" cy="29" r="7" fill="currentColor"/><path d="M32 36l-4 6h8z" fill="currentColor"/></svg>';

const RULE = '<svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 15h260M340 15h260" stroke="currentColor" stroke-width="2"/><circle cx="300" cy="15" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

function ornamentsFor(preset) {
  switch (preset) {
    case 'papel-picado': return [['top', PAPEL_PICADO('#B5175E')]];
    case 'tradicional': return [['top', PAPEL_PICADO('#B5175E')], ['corner', SKULL]];
    case 'cempasuchil': return [['top', `<svg viewBox="0 0 600 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<g transform="translate(${i * 68 + 4} 2) scale(0.9)">${MARIGOLD.replace(/<\/?svg[^>]*>/g, '')}</g>`).join('')}</svg>`], ['corner', MARIGOLD]];
    case 'catrina': return [['corner', SKULL]];
    case 'grabado': return [['top', RULE]];
    default: return [];
  }
}

export function renderPoemSheet(poem, rawDesign) {
  const design = sanitizeDesign(rawDesign);
  const borderClass = design.border === 'preset' ? '' : ` sheet--border-${design.border}`;
  const sheet = el('article', {
    class: `sheet sheet--${design.preset} sheet--layout-${design.layout}${borderClass}`,
    'aria-label': `Hoja de la calaverita «${poem.title}»`,
  });
  sheet.style.setProperty('--sheet-font', fontCss(design.fontFamily));
  sheet.style.setProperty('--sheet-size', `${design.fontSize}px`);
  sheet.style.setProperty('--sheet-align', design.align);
  sheet.style.setProperty('--sheet-leading', String(design.lineHeight));
  if (design.ornaments) {
    for (const [position, markup] of ornamentsFor(design.preset)) {
      sheet.append(el('div', { class: `sheet__ornament sheet__ornament--${position}` }, svgFromString(markup)));
    }
  }
  const inner = el('div', { class: 'sheet__inner' },
    el('h2', { class: 'sheet__title' }, poem.title),
    el('div', { class: 'sheet__body' }, poem.stanzas.map((stanza) => el('div', { class: 'sheet__stanza' }, stanza.verses.map((v) => el('p', {}, v))))));
  sheet.append(inner);
  return sheet;
}
