/**
 * TEST-ONLY learner record for Passport browser checks. Never imported by the app.
 * Timestamps are relative to "now" so the streak is real for the day the test runs.
 */
export function passportFixture(now: number = Date.now(), withEvidence = true) {
  const day = 24 * 60 * 60 * 1000;
  const at = (d: number, s = 0) => now - d * day - s * 1000;
  const attempts: Array<Record<string, unknown>> = [];
  let n = 0;
  const add = (conceptId: string, conceptName: string, isCorrect: boolean, d: number, isSolo = false) =>
    attempts.push({ id: `att_${++n}`, conceptId, conceptName, isCorrect, timestamp: at(d, n), isSolo });
  if (withEvidence) {
    for (let i = 0; i < 6; i++) add('projectile_motion', 'Projectile Motion', i !== 1, i % 3, i >= 2);
    for (let i = 0; i < 4; i++) add('human_heart_anatomy', 'Human Heart', i % 2 === 0, 1 + (i % 2));
    for (let i = 0; i < 3; i++) add('periodic_table', 'Periodic Table', i === 2, 3);
    add('my_custom_topic', 'Kirchhoff’s Laws', true, 0);
  }
  const concepts = [
    { id: 'projectile_motion', name: 'Projectile Motion', masteryPercentage: withEvidence ? 86 : 0, itemsNext: 0, retentionRisk: 0, ptsSinceCalibration: 0, soloAttemptsCount: 4 },
    { id: 'human_heart_anatomy', name: 'Human Heart', masteryPercentage: withEvidence ? 62 : 0, itemsNext: 0, retentionRisk: 0, ptsSinceCalibration: 0 },
    { id: 'periodic_table', name: 'Periodic Table', masteryPercentage: withEvidence ? 41 : 0, itemsNext: 0, retentionRisk: 0, ptsSinceCalibration: 0 },
  ];
  const graph = { id: 'graph_passport_qa', goalText: 'Physics and Biology foundations', createdAt: at(10), concepts, quests: [], attempts, calibratedTheta: 0, calibrationCompletedAt: at(10), learnerProfile: { name: 'Asha', avatar_id: 'learner', pathType: 'goal', topic: 'Physics', language: 'english', dailyMinutes: 20, startingLevel: 'beginner' } };
  return {
    handle: 'Asha',
    activeGraphId: graph.id,
    graphs: [graph],
    rewardsCount: 0,
    flowState: 'unknown',
    goalText: graph.goalText,
    concepts,
    attempts,
    learnerProfile: graph.learnerProfile,
  };
}
