const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.render("landing", { user: req.user });
});

router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

router.get("/login", (req, res) => {
  return res.render("login", { user: req.user, error: null });
});

module.exports = router;