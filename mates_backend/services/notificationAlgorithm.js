function shouldSendNotification(user) {
  const now = Date.now();
  const minInterval = 24 * 60 * 60 * 1000;
  const maxSilence = 7 * 24 * 60 * 60 * 1000;

  if (!user.lastNotificationAt) return true;

  const timeSinceLast =
    now - new Date(user.lastNotificationAt).getTime();

  if (timeSinceLast < minInterval) return false;

  if (user.recentProfileViews >= 5) return true;

  if (timeSinceLast > maxSilence) return true;

  return false;
}

function generateNotification(user) {
  if (user.newMutualMatches > 0) {
    return "You've caught someone's attention.";
  }

  if (user.recentProfileViews >= 5) {
    return "Your profile is being discovered.";
  }

  return "Small updates can refresh your visibility.";
}

module.exports = { shouldSendNotification, generateNotification };
