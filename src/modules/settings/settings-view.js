import { el } from '../../core/dom.js';
import { button, viewHeader, field, select, checkbox } from '../../core/ui-kit.js';
import { THEMES, FONT_SCALES, UI_FONTS } from './preferences-service.js';
import { buildExport, exportFileName } from '../export/json-service.js';
import { downloadText } from '../../core/dom.js';
import { listProviders } from '../../adapters/generation-provider.js';

export async function renderSettings(app) {
  const prefs = app.prefs.get();
  const theme = select(THEMES, prefs.theme);
  const scale = select(FONT_SCALES, prefs.fontScale);
  const font = select(UI_FONTS, prefs.fontFamily);
  const motion = checkbox('Reducir animaciones', prefs.reduceMotion);
  const storageInfo = el('p', { role: 'status' }, 'Calculando…');

  const apply = () => {
    const ok = app.prefs.set({ theme: theme.value, fontScale: Number(scale.value), fontFamily: font.value, reduceMotion: motion.querySelector('input').checked });
    app.applyPreferences();
    if (!ok) app.toast('No se pudieron guardar las preferencias en este navegador; se aplicarán solo mientras la página esté abierta.', 'warning');
  };
  [theme, scale, font].forEach((c) => c.addEventListener('change', apply));
  motion.querySelector('input').addEventListener('change', apply);

  async function refreshStorage() {
    try {
      const count = await app.repo.count();
      const estimate = await navigator.storage?.estimate?.();
      const persisted = await navigator.storage?.persisted?.();
      const used = estimate ? ` Espacio usado por este sitio: ${(estimate.usage / 1024).toFixed(0)} KB.` : '';
      storageInfo.textContent = `${count} obra(s) guardada(s).${used} Almacenamiento persistente: ${persisted ? 'sí' : 'no (el navegador podría borrarlo si se queda sin espacio)'}.`;
    } catch (error) {
      storageInfo.textContent = error.message;
    }
  }

  async function requestPersist() {
    if (!navigator.storage?.persist) { app.toast('Este navegador no permite pedir almacenamiento persistente.', 'warning'); return; }
    const granted = await navigator.storage.persist();
    app.toast(granted ? 'El navegador conservará tus datos aunque falte espacio.' : 'El navegador no concedió el almacenamiento persistente. Haz respaldos periódicos.', granted ? 'success' : 'warning');
    refreshStorage();
  }

  async function backup() {
    try {
      const poems = await app.repo.list();
      if (!poems.length) { app.toast('No hay obras para respaldar.', 'warning'); return; }
      downloadText(exportFileName(poems), buildExport(poems));
      app.toast(`Respaldo de ${poems.length} obra(s) descargado.`, 'success');
    } catch (error) {
      app.reportError(error);
    }
  }

  const provider = listProviders()[0];
  const node = el('div', { class: 'stack' },
    viewHeader('Configuración'),
    el('section', { class: 'card' }, el('h2', {}, 'Lectura y apariencia'),
      el('div', { class: 'fields-2' },
        field({ id: 'conf-tema', label: 'Colores', control: theme }),
        field({ id: 'conf-tamano', label: 'Tamaño de letra', control: scale }),
        field({ id: 'conf-letra', label: 'Tipografía de la app', control: font })),
      motion),
    el('section', { class: 'card' }, el('h2', {}, 'Tus datos'),
      storageInfo,
      el('div', { class: 'row' },
        button('Descargar respaldo completo', { variant: 'primary', iconName: 'save', onClick: backup }),
        button('Pedir almacenamiento persistente', { onClick: requestPersist }),
        button('Importar en la biblioteca', { onClick: () => app.go('biblioteca') }))),
    el('section', { class: 'card' }, el('h2', {}, 'Privacidad y funcionamiento'),
      el('ul', {},
        el('li', {}, 'Tus calaveritas se guardan solo en este navegador (IndexedDB). No hay cuentas ni servidor.'),
        el('li', {}, 'El almacenamiento no está cifrado: cualquier persona con acceso a este dispositivo y navegador podría verlas.'),
        el('li', {}, 'Se pierden si borras los datos de navegación, usas una ventana privada o cambias de equipo. Por eso existe el respaldo.'),
        el('li', {}, `La generación usa: ${provider.label}. No es inteligencia artificial y no envía nada a internet; la app bloquea toda conexión externa.`),
        el('li', {}, 'No hay publicidad ni estadísticas de uso.'))));
  refreshStorage();
  return node;
}
