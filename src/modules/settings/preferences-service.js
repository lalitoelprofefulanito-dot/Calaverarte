/** Preferencias pequeñas en localStorage, con valores por defecto y validación. */
const KEY = 'calaverarte:preferencias';

export const DEFAULT_PREFERENCES = Object.freeze({
  theme: 'claro',
  fontScale: 1,
  fontFamily: 'arial',
  reduceMotion: false,
  lastPoemId: null,
});

export const THEMES = [
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
  { id: 'contraste', label: 'Alto contraste' },
];

export const FONT_SCALES = [
  { id: 1, label: 'Grande (predeterminado)' },
  { id: 1.15, label: 'Más grande' },
  { id: 1.3, label: 'Muy grande' },
];

export const UI_FONTS = [
  { id: 'arial', label: 'Arial' },
  { id: 'verdana', label: 'Verdana' },
  { id: 'atkinson', label: 'Tipografía del sistema' },
];

export function createPreferencesService(storage = globalThis.localStorage) {
  let cache = null;
  const read = () => {
    try {
      const parsed = JSON.parse(storage?.getItem(KEY) || '{}');
      return sanitize(parsed);
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  };
  return {
    get() {
      if (!cache) cache = read();
      return { ...cache };
    },
    set(patch) {
      cache = sanitize({ ...this.get(), ...patch });
      try {
        storage?.setItem(KEY, JSON.stringify(cache));
        return true;
      } catch {
        return false;
      }
    },
  };
}

function sanitize(value) {
  const prefs = { ...DEFAULT_PREFERENCES };
  if (THEMES.some((t) => t.id === value.theme)) prefs.theme = value.theme;
  if (FONT_SCALES.some((f) => f.id === value.fontScale)) prefs.fontScale = value.fontScale;
  if (UI_FONTS.some((f) => f.id === value.fontFamily)) prefs.fontFamily = value.fontFamily;
  prefs.reduceMotion = Boolean(value.reduceMotion);
  prefs.lastPoemId = typeof value.lastPoemId === 'string' ? value.lastPoemId.slice(0, 120) : null;
  return prefs;
}
