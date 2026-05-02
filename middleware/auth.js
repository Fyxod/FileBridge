const User = require("../models/User");

async function attachCurrentUser(req, res, next) {
  if (req.session.userId) {
    res.locals.currentUser = await User.findById(req.session.userId).lean();
  } else {
    res.locals.currentUser = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/auth/login");
  }
  return next();
}

module.exports = { attachCurrentUser, requireAuth };
