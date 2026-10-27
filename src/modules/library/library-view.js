import { el, clear, formatDate, downloadText } from '../../core/dom.js';
import { button, viewHeader, field, select, checkbox, emptyState } from '../../core/ui-kit.js';
import { searchPoems, SORT_OPTIONS, SEARCH_FIELDS } from './search-service.js';
import { TONES } from '../generator/generation-schema.js';
import { buildExport, exportFileName, parseImport, planImport, resolveConflicts, MAX_IMPORT_BYTES } from '../export/json-service.js';

export async function renderLibrary(app) {
  let poems = [];
  const listArea = el('div', { 'aria-live': 'polite' });
  const importArea = el('div');
  const filters = {
    query: el('input', { type: 'search', id: 'bib-buscar', autocomplete: 'off' }),
    field: select(SEARCH_FIELDS, 'todo'),
    tone: select([{ id: '', label: 'Todos los tonos' }, ...TONES], ''),
    from: el('input', { type: 'date' }),
    to: el('input', { type: 'date' }),
    sort: select(SORT_OPTIONS, 'recientes'),
  };
  const favorites = checkbox('Solo favoritas', false);

  async function load() {
    try {
      poems = await app.repo.list();
      renderList();
    } catch (error) {
      clear(listArea).append(el('p', { class: 'notice notice--warn', role: 'alert' }, error.message));
    }
  }

  function exportPoems(list) {
    downloadText(exportFileName(list), buildExport(list));
    app.toast(list.length === 1 ? 'Obra exportada como archivo JSON.' : `Respaldo de ${list.length} obras descargado.`, 'success');
  }

  async function toggleFavorite(poem) {
    try {
      await app.repo.save({ ...poem, favorite: !poem.favorite }, { keepDates: true });
      if (app.session?.poem.id === poem.id) app.session.poem.favorite = !poem.favorite;
      await load();
      listArea.querySelector(`[data-fav="${poem.id}"]`)?.focus();
    } catch (error) {
      app.reportError(error);
    }
  }

  async function remove(poem) {
    const ok = await app.confirm({ title: `¿Eliminar «${poem.title}»?`, message: 'Se borrará de este dispositivo junto con todas sus versiones. Esta acción no se puede deshacer. Si quieres conservar una copia, expórtala antes.', confirmLabel: 'Eliminar definitivamente', danger: true });
    if (!ok) return;
    try {
      await app.repo.remove(poem.id);
      if (app.session?.poem.id === poem.id) { app.session = null; app.prefs.set({ lastPoemId: null }); }
      app.toast(`Se eliminó «${poem.title}».`, 'success');
      await load();
    } catch (error) {
      app.reportError(error);
    }
  }

  function renderList() {
    const results = searchPoems(poems, {
      query: filters.query.value, field: filters.field.value, tone: filters.tone.value,
      from: filters.from.value, to: filters.to.value, favoritesOnly: favorites.querySelector('input').checked, sort: filters.sort.value,
    });
    clear(listArea);
    if (poems.length === 0) {
      listArea.append(emptyState('Tu biblioteca está vacía', 'Las calaveritas que generes se guardan aquí automáticamente. También puedes importar un respaldo.',
        [button('Crear una calaverita', { variant: 'primary', onClick: () => app.go('crear') })]));
      return;
    }
    listArea.append(el('p', { role: 'status' }, `${results.length} de ${poems.length} obra${poems.length === 1 ? '' : 's'}.`));
    if (!results.length) { listArea.append(el('p', {}, 'Ninguna obra coincide. Cambia o borra los filtros.')); return; }
    listArea.append(el('ul', { class: 'poem-list' }, results.map((poem) => {
      const tone = TONES.find((t) => t.id === poem.params?.tone)?.label || 'Sin tono';
      return el('li', { class: 'card poem-item' },
        el('h3', {}, poem.title),
        el('p', { class: 'meta' }, `${poem.params?.names || 'Sin protagonista'} · ${tone} · modificada ${formatDate(poem.updatedAt)} · ${poem.versions.length} versión(es)${poem.favorite ? ' · ★ favorita' : ''}`),
        el('p', { class: 'hint' }, poem.stanzas[0]?.verses.slice(0, 2).join(' / ') || ''),
        el('div', { class: 'row' },
          button('Abrir', { variant: 'primary', small: true, attrs: { 'aria-label': `Abrir «${poem.title}»` }, onClick: () => app.openPoem(poem.id) }),
          button('Versiones', { small: true, attrs: { 'aria-label': `Ver versiones de «${poem.title}»` }, onClick: () => app.openPoem(poem.id, { focusVersions: true }) }),
          button(poem.favorite ? 'Quitar de favoritas' : 'Marcar favorita', { small: true, iconName: poem.favorite ? 'star' : 'starOutline', attrs: { 'aria-pressed': String(poem.favorite), 'data-fav': poem.id, 'aria-label': `${poem.favorite ? 'Quitar de favoritas' : 'Marcar como favorita'}: «${poem.title}»` }, onClick: () => toggleFavorite(poem) }),
          button('Exportar', { small: true, attrs: { 'aria-label': `Exportar «${poem.title}»` }, onClick: () => exportPoems([poem]) }),
          button('Eliminar', { small: true, variant: 'danger', iconName: 'trash', attrs: { 'aria-label': `Eliminar «${poem.title}»` }, onClick: () => remove(poem) })));
    })));
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    clear(importArea);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { app.toast('El archivo supera los 5 MB permitidos.', 'error'); return; }
    let parsed;
    try {
      parsed = parseImport(await file.text());
    } catch (error) {
      importArea.append(el('div', { class: 'notice notice--warn', role: 'alert' }, el('strong', {}, 'No se pudo importar: '), error.message));
      return;
    }
    const plan = planImport(parsed.poems, poems.map((p) => p.id));
    const strategyInputs = ['omitir', 'copia', 'reemplazar'].map((id) => el('input', { type: 'radio', name: 'estrategia', value: id, checked: id === 'omitir' }));
    const labels = { omitir: 'Conservar las mías y omitir las del archivo', copia: 'Guardar las del archivo como copias nuevas', reemplazar: 'Reemplazar las mías por las del archivo' };
    const confirmBtn = button(`Importar`, { variant: 'primary', onClick: () => doImport(plan, strategyInputs.find((i) => i.checked)?.value) });
    importArea.append(el('section', { class: 'card', 'aria-labelledby': 'import-titulo', tabindex: '-1' },
      el('h2', { id: 'import-titulo' }, `Resumen de «${file.name}»`),
      el('ul', {},
        el('li', {}, `${plan.fresh.length} obra(s) nueva(s) se añadirán.`),
        el('li', {}, `${plan.conflicts.length} obra(s) ya existen en este dispositivo.`),
        parsed.errors.length ? el('li', {}, `${parsed.errors.length} obra(s) se descartarán por datos no válidos:`, el('ul', {}, parsed.errors.slice(0, 10).map((e) => el('li', {}, e)))) : null),
      plan.conflicts.length ? el('fieldset', {}, el('legend', {}, '¿Qué hago con las obras repetidas?'),
        el('p', { class: 'hint' }, plan.conflicts.map((p) => `«${p.title}»`).join(', ')),
        strategyInputs.map((input) => el('label', { class: 'choice' }, input, labels[input.value]))) : null,
      el('div', { class: 'row', style: { marginTop: '1rem' } }, confirmBtn, button('Cancelar', { onClick: () => clear(importArea) }))));
    importArea.querySelector('section').focus();
  }

  async function doImport(plan, strategy) {
    try {
      if (strategy === 'reemplazar' && plan.conflicts.length) {
        const ok = await app.confirm({ title: 'Reemplazar obras existentes', message: `Se sustituirán ${plan.conflicts.length} obra(s) de este dispositivo por las del archivo. Las versiones locales de esas obras se perderán.`, confirmLabel: 'Reemplazar', danger: true });
        if (!ok) return;
      }
      const resolved = plan.conflicts.length ? resolveConflicts(plan.conflicts, strategy) : [];
      const toSave = [...plan.fresh, ...resolved];
      if (toSave.length) await app.repo.saveMany(toSave);
      clear(importArea);
      app.toast(`Importación terminada: ${toSave.length} obra(s) guardada(s).`, 'success');
      await load();
    } catch (error) {
      app.reportError(error);
    }
  }

  const fileInput = el('input', { type: 'file', accept: 'application/json,.json', id: 'bib-importar', class: 'visually-hidden', on: { change: onFile } });
  Object.values(filters).forEach((control) => control.addEventListener('input', renderList));
  favorites.querySelector('input').addEventListener('change', renderList);

  const node = el('div', { class: 'stack' },
    viewHeader('Biblioteca', 'Tus calaveritas guardadas en este dispositivo.'),
    el('p', { class: 'notice' }, 'Se guardan en el navegador de este dispositivo. Si borras los datos de navegación o cambias de equipo, se pierden: descarga un respaldo de vez en cuando.'),
    el('div', { class: 'row' },
      button('Descargar respaldo completo', { variant: 'primary', iconName: 'save', onClick: () => (poems.length ? exportPoems(poems) : app.toast('No hay obras para respaldar.', 'warning')) }),
      el('label', { for: 'bib-importar', class: 'btn btn--secondary', tabindex: '0', role: 'button', on: { keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } } } }, 'Importar respaldo'),
      fileInput),
    importArea,
    el('div', { class: 'card filters', role: 'search' },
      field({ id: 'bib-buscar', label: 'Buscar', control: filters.query }),
      field({ id: 'bib-campo', label: 'Buscar en', control: filters.field }),
      field({ id: 'bib-tono', label: 'Tono', control: filters.tone }),
      field({ id: 'bib-desde', label: 'Modificadas desde', control: filters.from }),
      field({ id: 'bib-hasta', label: 'Hasta', control: filters.to }),
      field({ id: 'bib-orden', label: 'Ordenar por', control: filters.sort }),
      favorites),
    listArea);
  await load();
  return node;
}
