import { describe, it, expect } from 'vitest';
import { EditorSession } from '../../src/modules/editor/editor-session.js';
import { createPoem } from '../../src/core/poem-model.js';

const poem = () => createPoem({ title: 'Prueba', params: { verses: 4 }, stanzas: [{ verses: ['a', 'b', 'c', 'd'] }, { verses: ['e', 'f', 'g', 'h'] }] });

describe('sesión de edición', () => {
  it('edita versos y deshace/rehace', () => {
    const s = new EditorSession(poem());
    s.setVerse(0, 0, 'uno');
    s.lastKey = null;
    s.setVerse(0, 1, 'dos');
    expect(s.poem.stanzas[0].verses.slice(0, 2)).toEqual(['uno', 'dos']);
    s.undo();
    expect(s.poem.stanzas[0].verses[1]).toBe('b');
    s.undo();
    expect(s.poem.stanzas[0].verses[0]).toBe('a');
    s.redo();
    expect(s.poem.stanzas[0].verses[0]).toBe('uno');
  });
  it('agrupa pulsaciones seguidas en un solo paso de deshacer', () => {
    const s = new EditorSession(poem());
    s.setVerse(0, 0, 'u');
    s.setVerse(0, 0, 'un');
    s.setVerse(0, 0, 'uno');
    expect(s.past).toHaveLength(1);
  });
  it('añade, elimina y reordena estrofas y versos', () => {
    const s = new EditorSession(poem());
    const id0 = s.poem.stanzas[0].id;
    s.addStanza(1);
    expect(s.poem.stanzas).toHaveLength(3);
    expect(s.poem.stanzas[2].verses).toHaveLength(4);
    s.moveStanza(0, 1);
    expect(s.poem.stanzas[1].id).toBe(id0);
    s.removeStanza(2);
    expect(s.poem.stanzas).toHaveLength(2);
    s.addVerse(0, 3);
    expect(s.poem.stanzas[0].verses).toHaveLength(5);
    s.removeVerse(0, 4);
    expect(s.poem.stanzas[0].verses).toHaveLength(4);
  });
  it('impide modificar una estrofa bloqueada', () => {
    const s = new EditorSession(poem());
    s.toggleLock(0);
    expect(() => s.setVerse(0, 0, 'x')).toThrow(/bloqueada/);
    expect(() => s.replaceStanzaVerses(0, ['x'])).toThrow(/bloqueada/);
    expect(() => s.removeStanza(0)).toThrow(/bloqueada/);
  });
  it('aplica variantes sin tocar las estrofas bloqueadas', () => {
    const s = new EditorSession(poem());
    s.toggleLock(0);
    s.applyVariant({ stanzas: [{ verses: ['X'] }, { verses: ['Y', 'Z'] }], engine: { ending: 'F' } });
    expect(s.poem.stanzas[0].verses).toEqual(['a', 'b', 'c', 'd']);
    expect(s.poem.stanzas[1].verses).toEqual(['Y', 'Z']);
  });
  it('mantiene los límites mínimos', () => {
    const s = new EditorSession(createPoem({ title: 't', stanzas: [{ verses: ['solo'] }] }));
    expect(() => s.removeVerse(0, 0)).toThrow();
    expect(() => s.removeStanza(0)).toThrow();
  });
  it('marca cambios sin guardar', () => {
    const s = new EditorSession(poem());
    expect(s.dirty).toBe(false);
    s.setTitle('Nuevo');
    expect(s.dirty).toBe(true);
    s.markSaved(s.poem);
    expect(s.dirty).toBe(false);
  });
});
