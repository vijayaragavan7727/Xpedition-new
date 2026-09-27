/**
 * Deterministic display order for check-question options.
 *
 * Audit finding: in 16 of 18 authored checks the correct option was listed
 * FIRST, so a learner could pass by always choosing option A. Options are now
 * displayed in an order derived from a hash of the question and option ids:
 * stable across renders, reloads and tests (no randomness), independent of the
 * authoring order, and never a function of which option is correct.
 */

function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function orderOptions<T extends { id: string }>(questionKey: string, options: T[]): T[] {
  return [...options]
    .map((o) => ({ o, k: fnv1a(`${questionKey}::${o.id}`) }))
    .sort((a, b) => a.k - b.k || a.o.id.localeCompare(b.o.id))
    .map((x) => x.o);
}
