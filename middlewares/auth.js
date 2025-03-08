const { getUser } = require("../service/auth");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    if (!req.cookies || !req.cookies[cookieName]) {
      req.user = null;
      return next();
    }
    const token = req.cookies[cookieName];
    const userPayload = getUser(token);
    req.user = userPayload || null;
    next();
  };
}

module.exports = {
  checkForAuthenticationCookie,
};