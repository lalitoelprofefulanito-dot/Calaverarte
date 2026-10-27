/**
 * Generador pseudoaleatorio con semilla (mulberry32). Permite reproducir una
 * variante a partir de su semilla y probar el motor de forma determinista.
 */
export function createRng(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(max) { return Math.floor(next() * max); },
    pick(list) { return list.length ? list[Math.floor(next() * list.length)] : undefined; },
    weighted(items, weightOf) {
      const total = items.reduce((sum, item) => sum + weightOf(item), 0);
      if (total <= 0) return undefined;
      let roll = next() * total;
      for (const item of items) {
        roll -= weightOf(item);
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    },
    shuffle(list) {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31) + 1;
}
