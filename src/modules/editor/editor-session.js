/**
 * Sesión de edición: aplica operaciones sobre una copia del poema y guarda
 * un historial para deshacer y rehacer. No escribe en el almacenamiento.
 */
import { AppError } from '../../core/errors.js';
import { createStanza } from '../../core/poem-model.js';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 1200;

export class EditorSession {
  constructor(poem) {
    this.poem = structuredClone(poem);
    this.past = [];
    this.future = [];
    this.dirty = false;
    this.lastKey = null;
    this.lastTime = 0;
  }

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }

  snapshot() {
    return structuredClone({ title: this.poem.title, stanzas: this.poem.stanzas, engine: this.poem.engine });
  }

  restore(state) {
    this.poem.title = state.title;
    this.poem.stanzas = state.stanzas;
    this.poem.engine = state.engine;
  }

  /** Aplica una operación registrándola en el historial. */
  apply(mutator, coalesceKey = null) {
    const now = Date.now();
    const coalesce = coalesceKey && coalesceKey === this.lastKey && now - this.lastTime < COALESCE_MS;
    if (!coalesce) {
      this.past.push(this.snapshot());
      if (this.past.length > HISTORY_LIMIT) this.past.shift();
    }
    this.future = [];
    mutator(this.poem);
    this.dirty = true;
    this.lastKey = coalesceKey;
    this.lastTime = now;
  }

  undo() {
    if (!this.canUndo) return false;
    this.future.push(this.snapshot());
    this.restore(this.past.pop());
    this.dirty = true;
    this.lastKey = null;
    return true;
  }

  redo() {
    if (!this.canRedo) return false;
    this.past.push(this.snapshot());
    this.restore(this.future.pop());
    this.dirty = true;
    this.lastKey = null;
    return true;
  }

  stanza(index) {
    const stanza = this.poem.stanzas[index];
    if (!stanza) throw new AppError('La estrofa indicada no existe.');
    return stanza;
  }

  assertUnlocked(index) {
    if (this.stanza(index).locked) {
      throw new AppError('Esta estrofa está bloqueada. Desbloquéala para modificarla.', { code: 'STANZA_LOCKED' });
    }
  }

  setTitle(title) {
    this.apply((poem) => { poem.title = String(title).slice(0, 120); }, 'title');
  }

  setVerse(stanzaIndex, verseIndex, text) {
    this.assertUnlocked(stanzaIndex);
    this.apply((poem) => { poem.stanzas[stanzaIndex].verses[verseIndex] = String(text).replace(/\n/g, ' '); }, `verse:${stanzaIndex}:${verseIndex}`);
  }

  addVerse(stanzaIndex, afterIndex) {
    this.assertUnlocked(stanzaIndex);
    if (this.stanza(stanzaIndex).verses.length >= 8) throw new AppError('Una estrofa admite como máximo 8 versos.');
    this.apply((poem) => { poem.stanzas[stanzaIndex].verses.splice(afterIndex + 1, 0, ''); });
  }

  removeVerse(stanzaIndex, verseIndex) {
    this.assertUnlocked(stanzaIndex);
    if (this.stanza(stanzaIndex).verses.length <= 1) throw new AppError('Una estrofa necesita al menos un verso. Elimina la estrofa completa si ya no la quieres.');
    this.apply((poem) => { poem.stanzas[stanzaIndex].verses.splice(verseIndex, 1); });
  }

  addStanza(afterIndex) {
    if (this.poem.stanzas.length >= 8) throw new AppError('El poema admite como máximo 8 estrofas.');
    const size = Math.max(2, Math.min(8, this.poem.params?.verses || 4));
    this.apply((poem) => { poem.stanzas.splice(afterIndex + 1, 0, createStanza(new Array(size).fill(''))); });
  }

  removeStanza(index) {
    this.assertUnlocked(index);
    if (this.poem.stanzas.length <= 1) throw new AppError('El poema necesita al menos una estrofa.');
    this.apply((poem) => { poem.stanzas.splice(index, 1); });
  }

  moveStanza(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= this.poem.stanzas.length) return;
    this.stanza(index);
    this.apply((poem) => {
      const [moved] = poem.stanzas.splice(index, 1);
      poem.stanzas.splice(target, 0, moved);
    });
  }

  toggleLock(index) {
    this.stanza(index);
    this.apply((poem) => { poem.stanzas[index].locked = !poem.stanzas[index].locked; });
  }

  /** Sustituye los versos de una estrofa (regeneración). Respeta el bloqueo. */
  replaceStanzaVerses(index, verses) {
    this.assertUnlocked(index);
    this.apply((poem) => { poem.stanzas[index].verses = [...verses]; });
  }

  /** Sustituye todas las estrofas no bloqueadas (nueva variante). */
  applyVariant({ stanzas, engine }) {
    this.apply((poem) => {
      poem.stanzas = poem.stanzas.map((current, i) => (current.locked ? current : { ...current, verses: [...stanzas[i].verses] }));
      poem.engine = engine;
    });
  }

  markSaved(poem) {
    this.poem = structuredClone(poem);
    this.dirty = false;
  }
}
