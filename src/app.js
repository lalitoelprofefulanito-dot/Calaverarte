/**
 * Estado compartido de la aplicación y servicios para las vistas:
 * repositorio, preferencias, sesión de edición, avisos y confirmaciones.
 */
import { el, clear } from './core/dom.js';
import { createEventBus } from './core/event-bus.js';
import { createPoemRepository } from './storage/repositories.js';
import { createPreferencesService } from './modules/settings/preferences-service.js';
import { EditorSession } from './modules/editor/editor-session.js';
import { createRouter, ROUTES } from './router.js';
import { icon } from './core/ui-kit.js';

import { renderHome } from './modules/home/home-view.js';
import { renderGenerator } from './modules/generator/generator-view.js';
import { renderEditor } from './modules/editor/editor-view.js';
import { renderWorkshop } from './modules/workshop/workshop-view.js';
import { renderEvaluation } from './modules/evaluator/evaluator-view.js';
import { renderEducation } from './modules/education/education-view.js';
import { renderLibrary } from './modules/library/library-view.js';
import { renderDesigner } from './modules/designer/designer-view.js';
import { renderSettings } from './modules/settings/settings-view.js';
import { renderCredits } from './modules/credits/credits-view.js';

const VIEWS = {
  inicio: renderHome,
  crear: renderGenerator,
  editor: renderEditor,
  taller: renderWorkshop,
  evaluacion: renderEvaluation,
  educacion: renderEducation,
  biblioteca: renderLibrary,
  disenador: renderDesigner,
  configuracion: renderSettings,
  creditos: renderCredits,
};

export function createApp() {
  const app = {
    bus: createEventBus(),
    repo: createPoemRepository(),
    prefs: createPreferencesService(),
    session: null,
    pendingWarnings: [],
    lastForm: null,
    router: null,
    cleanupView: null,
  };

  app.applyPreferences = () => {
    const prefs = app.prefs.get();
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.font = prefs.fontFamily;
    root.dataset.reduceMotion = String(prefs.reduceMotion);
    root.style.setProperty('--font-scale', String(prefs.fontScale));
  };

  app.toast = (message, kind = 'info') => {
    const region = document.getElementById('toasts');
    const prefix = { success: 'Hecho: ', error: 'Error: ', warning: 'Atención: ', info: '' }[kind] || '';
    const node = el('div', { class: `toast toast--${kind}`, role: kind === 'error' ? 'alert' : 'status' },
      el('p', {}, prefix + message),
      el('button', { type: 'button', 'aria-label': 'Cerrar aviso', on: { click: () => node.remove() } }, '×'));
    region.append(node);
    setTimeout(() => node.remove(), kind === 'error' ? 12000 : 6000);
  };

  /** Confirmación accesible con <dialog>. Devuelve una promesa booleana. */
  app.confirm = ({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) => {
    const dialog = document.getElementById('confirm-dialog');
    if (typeof dialog.showModal !== 'function') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    dialog.querySelector('#confirm-title').textContent = title;
    dialog.querySelector('#confirm-message').textContent = message;
    const confirmButton = dialog.querySelector('[data-role="confirm"]');
    confirmButton.textContent = confirmLabel;
    confirmButton.className = `btn ${danger ? 'btn--danger btn--solid' : 'btn--primary'}`;
    dialog.querySelector('[data-role="cancel"]').textContent = cancelLabel;
    const previousFocus = document.activeElement;
    return new Promise((resolve) => {
      dialog.addEventListener('close', () => {
        resolve(dialog.returnValue === 'confirm');
        previousFocus?.focus?.();
      }, { once: true });
      dialog.returnValue = 'cancel';
      dialog.showModal();
      dialog.querySelector('[data-role="cancel"]').focus();
    });
  };

  app.reportError = (error) => {
    console.error(error);
    app.toast(error?.message || 'Ocurrió un error inesperado.', 'error');
  };

  /** Abre una obra en el editor. Pide confirmación si hay cambios sin guardar. */
  app.setSession = async (poem, { force = false } = {}) => {
    if (!force && app.session?.dirty && app.session.poem.id !== poem.id) {
      const ok = await app.confirm({
        title: 'Hay cambios sin guardar',
        message: `«${app.session.poem.title}» tiene cambios sin guardar. Si continúas, se perderán.`,
        confirmLabel: 'Descartar cambios y continuar',
        danger: true,
      });
      if (!ok) return false;
    }
    app.session = new EditorSession(poem);
    app.prefs.set({ lastPoemId: poem.id });
    app.bus.emit('session:changed');
    return true;
  };

  app.openPoem = async (id, { focusVersions = false } = {}) => {
    try {
      const poem = await app.repo.get(id);
      if (!poem) { app.toast('No se encontró la obra. Puede que se haya eliminado.', 'error'); return; }
      if (await app.setSession(poem)) {
        app.focusVersions = focusVersions;
        app.go('editor');
      }
    } catch (error) {
      app.reportError(error);
    }
  };

  /** Guarda la sesión actual en el dispositivo. */
  app.saveSession = async () => {
    if (!app.session) return null;
    const saved = await app.repo.save(app.session.poem);
    app.session.markSaved(saved);
    app.bus.emit('session:saved');
    return saved;
  };

  app.go = (path) => app.router.go(path);

  function renderNav(active) {
    const nav = document.getElementById('main-nav');
    clear(nav).append(el('ul', {}, ROUTES.map((r) => el('li', {},
      el('a', { href: `#/${r.id}`, 'aria-current': r.id === active ? 'page' : undefined }, r.label)))));
  }

  async function show({ id, params }) {
    const main = document.getElementById('main');
    if (app.cleanupView) { app.cleanupView(); app.cleanupView = null; }
    renderNav(id);
    document.getElementById('main-nav').classList.remove('is-open');
    document.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
    clear(main);
    try {
      const result = await VIEWS[id](app, params);
      const node = result?.node || result;
      app.cleanupView = result?.cleanup || null;
      main.append(node);
      document.title = `${ROUTES.find((r) => r.id === id).label} · CalaverArte`;
      const heading = main.querySelector('h1');
      (heading || main).focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } catch (error) {
      app.reportError(error);
      main.append(el('p', { class: 'notice notice--warn' }, 'No se pudo mostrar esta sección. Recarga la página e inténtalo de nuevo.'));
    }
  }

  app.start = async () => {
    app.applyPreferences();
    document.querySelector('.brand__mark').append(icon('skull'));
    const toggle = document.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const nav = document.getElementById('main-nav');
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('beforeunload', (event) => {
      if (app.session?.dirty) { event.preventDefault(); event.returnValue = ''; }
    });
    const { lastPoemId } = app.prefs.get();
    if (lastPoemId) {
      try {
        const poem = await app.repo.get(lastPoemId);
        if (poem) app.session = new EditorSession(poem);
      } catch (error) {
        app.toast(error.message, 'error');
      }
    }
    app.router = createRouter(show);
    app.router.start();
  };

  return app;
}
