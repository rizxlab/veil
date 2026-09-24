/** Uniform integers via rejection sampling, avoiding modulo bias. */
export function randomInt(max, source = globalThis.crypto) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000)
    throw new RangeError("Invalid random bound");
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    source.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}
export function shuffle(items, source = globalThis.crypto) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, source);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
