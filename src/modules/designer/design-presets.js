/** Temas gráficos de la hoja de la calaverita (CSS y SVG propios). */
export const PRESETS = [
  { id: 'tradicional', label: 'Tradicional mexicano', fontFamily: 'georgia' },
  { id: 'papel-picado', label: 'Papel picado', fontFamily: 'georgia' },
  { id: 'cempasuchil', label: 'Cempasúchil', fontFamily: 'palatino' },
  { id: 'catrina', label: 'Catrina elegante', fontFamily: 'didot' },
  { id: 'cuaderno', label: 'Cuaderno escolar', fontFamily: 'escolar' },
  { id: 'grabado', label: 'Tinta y grabado', fontFamily: 'courier' },
  { id: 'minimalista', label: 'Minimalista', fontFamily: 'arial' },
];

export const FONTS = [
  { id: 'georgia', label: 'Georgia (con remates)', css: 'Georgia, "Times New Roman", serif' },
  { id: 'palatino', label: 'Palatino', css: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif' },
  { id: 'didot', label: 'Didot elegante', css: 'Didot, "Bodoni MT", "Hoefler Text", Georgia, serif' },
  { id: 'escolar', label: 'Escolar redondeada', css: '"Comic Sans MS", "Chalkboard SE", "Trebuchet MS", Arial, sans-serif' },
  { id: 'courier', label: 'Máquina de escribir', css: '"Courier New", Courier, monospace' },
  { id: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { id: 'verdana', label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
];

export const ALIGNS = [
  { id: 'center', label: 'Centrado' },
  { id: 'left', label: 'A la izquierda' },
  { id: 'justify', label: 'Justificado' },
];

export const BORDERS = [
  { id: 'preset', label: 'El del tema' },
  { id: 'ninguno', label: 'Sin borde' },
  { id: 'simple', label: 'Línea sencilla' },
  { id: 'doble', label: 'Línea doble' },
];

export const LAYOUTS = [
  { id: 'clasica', label: 'Título arriba' },
  { id: 'titulo-abajo', label: 'Título al pie, como epitafio' },
  { id: 'dos-columnas', label: 'Estrofas en dos columnas' },
];

export const LIMITS = { fontSize: [16, 34], lineHeight: [1.3, 2.2] };

export const fontCss = (id) => (FONTS.find((f) => f.id === id) || FONTS[0]).css;

/** Normaliza un objeto de diseño a valores permitidos. */
export function sanitizeDesign(design = {}) {
  const pick = (list, value, fallback) => (list.some((x) => x.id === value) ? value : fallback);
  const clamp = (n, [min, max], fallback) => (Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : fallback);
  return {
    preset: pick(PRESETS, design.preset, 'tradicional'),
    fontFamily: pick(FONTS, design.fontFamily, 'georgia'),
    fontSize: clamp(design.fontSize, LIMITS.fontSize, 22),
    align: pick(ALIGNS, design.align, 'center'),
    lineHeight: clamp(design.lineHeight, LIMITS.lineHeight, 1.6),
    border: pick(BORDERS, design.border, 'preset'),
    ornaments: design.ornaments !== false,
    layout: pick(LAYOUTS, design.layout, 'clasica'),
  };
}
