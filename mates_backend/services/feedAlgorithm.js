// Fair Exposure Allocation

function applyDecay(user, decayLambda = 0.0000005) {
  const now = Date.now();
  const lastUpdate = new Date(user.lastExposureUpdate).getTime();
  const timeDiff = now - lastUpdate;

  user.exposureScore =
    user.exposureScore * Math.exp(-decayLambda * timeDiff);

  user.lastExposureUpdate = now;

  return user;
}

function calculatePriority(user, poolSize) {

  const exposure = user.exposureScore || 0;

  const normalizedExposure =
    exposure / Math.max(poolSize || 1, 1);

  const gamma = 5;
  const cooldownThreshold = 50;

  let fairnessBoost =
    gamma * (1 / (1 + normalizedExposure));

  if (exposure > cooldownThreshold) {
    fairnessBoost *= 0.3;
  }

  const baseScore = 1;

  return baseScore + fairnessBoost;
}


module.exports = { applyDecay, calculatePriority };
