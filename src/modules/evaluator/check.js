/** Estados y forma común de una comprobación del evaluador. */
export const STATUS = Object.freeze({ OK: 'ok', REVIEW: 'revisar', UNVERIFIABLE: 'no-verificable' });

export const STATUS_LABELS = {
  ok: 'Correcto según la regla aplicada',
  revisar: 'Requiere revisión',
  'no-verificable': 'No verificable automáticamente',
};

export function check(id, label, status, detail, suggestions = []) {
  return { id, label, status, detail, suggestions };
}
