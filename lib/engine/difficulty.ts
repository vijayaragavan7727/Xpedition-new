export interface EngineItem {
  id: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}

/**
 * Adaptive Item Selection Engine
 * Selects the optimal un-seen item matching ability theta while excluding seen item IDs.
 */
export function selectQuest(
  pool: EngineItem[],
  theta: number = -0.4,
  motivation: string = 'flow',
  seenIds: Set<string> = new Set()
): EngineItem | null {
  if (!pool || pool.length === 0) return null;

  // Filter out any item already seen by the learner
  const unseenPool = pool.filter((item) => !seenIds.has(item.id));

  if (unseenPool.length === 0) {
    return null; // All items in pool have been exhausted
  }

  // Target difficulty offset based on motivation / flow state
  let offset = 0;
  if (motivation === 'bored') offset = 0.4;       // Increase challenge
  else if (motivation === 'frustrated') offset = -0.4; // Decrease challenge

  const targetDifficulty = theta + offset;

  // Sort unseen items by proximity to target difficulty
  const sorted = [...unseenPool].sort(
    (a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
  );

  return sorted[0];
}
