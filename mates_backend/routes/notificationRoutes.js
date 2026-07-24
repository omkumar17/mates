const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");
const {
  shouldSendNotification,
  generateNotification
} = require("../services/notificationAlgorithm");

router.get("/check", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (shouldSendNotification(user)) {
      const message = generateNotification(user);
      user.lastNotificationAt = Date.now();
      await user.save();
      return res.json({ notify: true, message });
    }

    res.json({ notify: false });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
