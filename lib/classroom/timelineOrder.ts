/**
 * Chronology activity for timeline lessons (learn by doing, History).
 *
 * The learner puts a set of events in order BEFORE their dates are shown. A
 * wrong pick is explained with the event that actually comes next. Pure logic,
 * so it is unit-tested; the Smart Board timeline renders it.
 */

export interface OrderableEvent {
  id: string;
  year: string;
  title: string;
  desc: string;
}

/** First four-digit year in a label such as "c. 1764" or "Jul 14, 1789". */
export function yearOf(label: string): number {
  const m = label.match(/(\d{4})/);
  return m ? Number(m[1]) : Number.NaN;
}

export function chronological<T extends { year: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => yearOf(a.year) - yearOf(b.year));
}

export type OrderPick =
  | { ok: true; placed: string[]; done: boolean }
  | { ok: false; placed: string[]; expected: OrderableEvent; message: string };

export function pickNext(events: OrderableEvent[], placed: string[], pickedId: string): OrderPick {
  const remaining = chronological(events).filter((e) => !placed.includes(e.id));
  const expected = remaining[0];
  if (!expected) return { ok: true, placed, done: true };
  if (pickedId === expected.id) {
    const next = [...placed, pickedId];
    return { ok: true, placed: next, done: next.length === events.length };
  }
  const picked = events.find((e) => e.id === pickedId);
  return {
    ok: false,
    placed,
    expected,
    message: `${picked?.title ?? 'That event'} came later. Something else happened first: ${expected.desc}`,
  };
}
