/** Versiones: instantáneas, restauración y comparación línea por línea. */
import { createId, nowISO } from '../../core/ids.js';
import { snapshotOf } from '../../core/poem-model.js';
import { AppError } from '../../core/errors.js';

export const MAX_VERSIONS = 50;

/** Devuelve una copia del poema con una versión nueva (no muta el original). */
export function saveVersion(poem, label) {
  const next = structuredClone(poem);
  next.versions = [...(next.versions || []), {
    id: createId('ver'),
    label: (label || 'Versión guardada').slice(0, 80),
    createdAt: nowISO(),
    snapshot: snapshotOf(poem),
  }];
  if (next.versions.length > MAX_VERSIONS) next.versions = next.versions.slice(-MAX_VERSIONS);
  return next;
}

/** Restaura una versión; antes guarda el estado actual como punto de recuperación. */
export function restoreVersion(poem, versionId) {
  const version = (poem.versions || []).find((v) => v.id === versionId);
  if (!version) throw new AppError('No se encontró la versión seleccionada.');
  const safe = saveVersion(poem, `Antes de restaurar «${version.label}»`);
  const { title, stanzas, params, engine } = structuredClone(version.snapshot);
  return { ...safe, title, stanzas, params, engine };
}

const toLines = (state) => [state.title, '', ...state.stanzas.flatMap((s, i) => (i ? ['', ...s.verses] : s.verses))];

/** Diferencias entre dos estados { title, stanzas } usando la subsecuencia común más larga. */
export function diffStates(before, after) {
  const a = toLines(before);
  const b = toLines(after);
  const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const result = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { result.push({ type: 'same', text: a[i] }); i += 1; j += 1; }
    else if (table[i + 1][j] >= table[i][j + 1]) { result.push({ type: 'removed', text: a[i] }); i += 1; }
    else { result.push({ type: 'added', text: b[j] }); j += 1; }
  }
  while (i < a.length) result.push({ type: 'removed', text: a[i++] });
  while (j < b.length) result.push({ type: 'added', text: b[j++] });
  return result;
}
