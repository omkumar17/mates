const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("name email profileCompleted")
      .lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profileCompleted: user.profileCompleted,
    };

    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Authentication failed"));
  }
};