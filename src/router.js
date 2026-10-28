/** Enrutador por hash: funciona en hosting estático sin configuración. */
export const ROUTES = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'crear', label: 'Crear' },
  { id: 'editor', label: 'Editor' },
  { id: 'taller', label: 'Taller literario' },
  { id: 'evaluacion', label: 'Evaluación' },
  { id: 'educacion', label: 'Modo educativo' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'disenador', label: 'Diseñador' },
  { id: 'configuracion', label: 'Configuración' },
  // Fuera del menú principal: se enlaza desde el pie de página, el inicio y Configuración.
  { id: 'creditos', label: 'Autoría y créditos', hidden: true },
];

export function parseHash(hash = location.hash) {
  const [, id = 'inicio', ...rest] = hash.replace(/^#/, '').split('/');
  const route = ROUTES.some((r) => r.id === id) ? id : 'inicio';
  return { id: route, params: rest.map(decodeURIComponent) };
}

export function createRouter(onChange) {
  const handle = () => onChange(parseHash());
  window.addEventListener('hashchange', handle);
  return {
    start: handle,
    go(path) {
      const target = `#/${path}`;
      if (location.hash === target) handle();
      else location.hash = target;
    },
  };
}
