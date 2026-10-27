/** Identificadores estables para obras, estrofas y versiones. */
export function createId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}

export function nowISO() {
  return new Date().toISOString();
}
