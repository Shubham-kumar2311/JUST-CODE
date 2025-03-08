const jwt = require("jsonwebtoken");

function setUser(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET || "Shubham!@"
  );
}

function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "Shubham!@");
  } catch (error) {
    return null;
  }
}

module.exports = {
  setUser,
  getUser,
};