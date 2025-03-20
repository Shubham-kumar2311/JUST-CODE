const express = require("express");
const { handleUserSignup, handleUserLogin, getUserProfile, updateUserProfile, getUpdateProfile } = require("../controllers/user");

const router = express.Router();

// POST /user - signup
router.post("/", handleUserSignup);

// POST /user/login - login
router.post("/login", handleUserLogin);

// GET /user/logout
router.get("/logout", (req, res) => {
  res.clearCookie("uid");
  res.redirect("/");
});


router.get("/profile", getUserProfile);
router.get("/updateProfile", getUpdateProfile);
router.post("/updateProfile", updateUserProfile);
module.exports = router;