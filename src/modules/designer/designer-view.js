import { el, clear } from '../../core/dom.js';
import { button, viewHeader, field, select, checkbox, emptyState } from '../../core/ui-kit.js';
import { PRESETS, FONTS, ALIGNS, BORDERS, LAYOUTS, LIMITS, sanitizeDesign } from './design-presets.js';
import { renderPoemSheet } from './poem-sheet.js';
import { printContent } from '../export/print-service.js';

export function renderDesigner(app) {
  if (!app.session) {
    return el('div', {}, viewHeader('Diseñador'), emptyState('No hay ninguna calaverita abierta', 'Abre o genera una calaverita para darle formato e imprimirla.',
      [button('Crear una calaverita', { variant: 'primary', onClick: () => app.go('crear') }), button('Abrir la biblioteca', { onClick: () => app.go('biblioteca') })]));
  }
  const session = app.session;
  let design = sanitizeDesign(session.poem.design);
  const preview = el('div');
  const range = (value, [min, max], step) => { const input = el('input', { type: 'range', min: String(min), max: String(max), step: String(step) }); input.value = String(value); return input; };
  const controls = {
    preset: select(PRESETS, design.preset),
    fontFamily: select(FONTS, design.fontFamily),
    fontSize: range(design.fontSize, LIMITS.fontSize, 1),
    align: select(ALIGNS, design.align),
    lineHeight: range(design.lineHeight, LIMITS.lineHeight, 0.1),
    border: select(BORDERS, design.border),
    layout: select(LAYOUTS, design.layout),
  };
  const ornaments = checkbox('Mostrar adornos (papel picado, flores, calaverita)', design.ornaments);
  const sizeOut = el('output', { for: 'dis-tamano' });
  const leadOut = el('output', { for: 'dis-interlineado' });

  function read() {
    return sanitizeDesign({
      preset: controls.preset.value, fontFamily: controls.fontFamily.value, fontSize: Number(controls.fontSize.value),
      align: controls.align.value, lineHeight: Number(controls.lineHeight.value), border: controls.border.value,
      layout: controls.layout.value, ornaments: ornaments.querySelector('input').checked,
    });
  }
  function update() {
    design = read();
    sizeOut.textContent = `${design.fontSize} px`;
    leadOut.textContent = design.lineHeight.toFixed(1);
    clear(preview).append(renderPoemSheet(session.poem, design));
  }
  controls.preset.addEventListener('change', () => {
    const preset = PRESETS.find((p) => p.id === controls.preset.value);
    controls.fontFamily.value = preset.fontFamily;
    update();
  });
  Object.entries(controls).filter(([k]) => k !== 'preset').forEach(([, c]) => c.addEventListener('input', update));
  ornaments.querySelector('input').addEventListener('change', update);

  async function saveDesign() {
    try {
      session.poem.design = design;
      session.dirty = true;
      await app.saveSession();
      app.toast('Diseño guardado con la obra.', 'success');
    } catch (error) {
      app.reportError(error);
    }
  }

  const node = el('div', {},
    viewHeader('Diseñador', 'Elige cómo se verá tu calaverita al imprimirla. El texto no cambia: solo su presentación.'),
    el('div', { class: 'split' },
      el('div', { class: 'card stack no-print' },
        field({ id: 'dis-estilo', label: 'Estilo', control: controls.preset }),
        field({ id: 'dis-letra', label: 'Tipografía', control: controls.fontFamily }),
        el('div', {}, field({ id: 'dis-tamano', label: 'Tamaño de letra', control: controls.fontSize }), sizeOut),
        field({ id: 'dis-alineacion', label: 'Alineación', control: controls.align }),
        el('div', {}, field({ id: 'dis-interlineado', label: 'Espacio entre líneas', control: controls.lineHeight }), leadOut),
        field({ id: 'dis-borde', label: 'Borde', control: controls.border }),
        field({ id: 'dis-distribucion', label: 'Distribución', control: controls.layout }),
        ornaments,
        el('div', { class: 'row' },
          button('Guardar diseño', { variant: 'primary', iconName: 'save', onClick: saveDesign }),
          button('Imprimir o guardar como PDF', { iconName: 'print', onClick: () => printContent(renderPoemSheet(session.poem, design)) })),
        el('p', { class: 'hint' }, 'Para obtener un PDF, elige «Guardar como PDF» como impresora en el diálogo que abre tu navegador. La app no crea el archivo por sí misma.')),
      el('div', {}, el('h2', {}, 'Vista previa'), preview)));
  update();
  return node;
}
