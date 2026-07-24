function calculateIntentWeight({
  viewTimeMs,
  interactionDepth,
  recentLikeCount,
}) {
  const normalizedView =
    Math.min(viewTimeMs / 15000, 1);

  const normalizedInteraction =
    Math.min(interactionDepth / 5, 1);

  const burstPenalty =
    Math.min(recentLikeCount / 20, 1);

  let score =
    0.5 * normalizedView +
    0.4 * normalizedInteraction -
    0.6 * burstPenalty;

  return Math.max(0, Math.min(score, 1));
}

module.exports = { calculateIntentWeight };
