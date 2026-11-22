// Seeded pseudo-random generator (xorshift32): the same seed always deals the same
// patrol phases and camera swings, which keeps the screenshot scenes repeatable.

export function createRandom(seed) {
  let state = (seed | 0) || 0x9e3779b9;
  return function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state |= 0;
    return (state >>> 0) / 4294967296;
  };
}
