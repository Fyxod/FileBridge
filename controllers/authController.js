const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function getRegister(req, res) {
  res.render("auth/register", { title: "Register", error: null, values: {} });
}

async function postRegister(req, res) {
  const { userId, email, name, password } = req.body;
  const values = { userId, email, name };

  if (!userId || !email || !password) {
    return res
      .status(400)
      .render("auth/register", {
        title: "Register",
        error: "Missing required fields.",
        values,
      });
  }

  const existing = await User.findOne({
    $or: [{ userId: userId.trim() }, { email: email.toLowerCase().trim() }],
  });

  if (existing) {
    return res
      .status(400)
      .render("auth/register", {
        title: "Register",
        error: "User already exists.",
        values,
      });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    userId: userId.trim(),
    email: email.toLowerCase().trim(),
    name: name ? name.trim() : undefined,
    passwordHash,
  });

  req.session.userId = user._id;
  return res.redirect("/files");
}

async function getLogin(req, res) {
  res.render("auth/login", { title: "Login", error: null, identifier: "" });
}

async function postLogin(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .render("auth/login", {
        title: "Login",
        error: "Missing credentials.",
        identifier,
      });
  }

  const user = await User.findOne({
    $or: [
      { userId: identifier.trim() },
      { email: identifier.toLowerCase().trim() },
    ],
  });

  if (!user) {
    return res
      .status(401)
      .render("auth/login", {
        title: "Login",
        error: "Invalid credentials.",
        identifier,
      });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res
      .status(401)
      .render("auth/login", {
        title: "Login",
        error: "Invalid credentials.",
        identifier,
      });
  }

  req.session.userId = user._id;
  return res.redirect("/files");
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
}

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
};
