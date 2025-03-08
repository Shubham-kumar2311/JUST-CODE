const express = require("express");
const { handleUserSignup, handleUserLogin } = require("../controllers/user");

const router = express.Router();

// POST /user - signup
router.post("/", handleUserSignup);

// POST /user/login - login
router.post("/login", handleUserLogin);

// GET /user/logout
router.get("/logout", (req, res) => {
  res.clearCookie("uid");
  res.redirect("/login");
});

module.exports = router;