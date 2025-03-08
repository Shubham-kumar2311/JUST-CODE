const { createHmac } = require("crypto");
const User = require("../models/user");
const Problem = require("../models/problem");
const { setUser } = require("../service/auth");

async function handleUserSignup(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = setUser(newUser);
    res.cookie("uid", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    return res.status(201).redirect("/problems");
  } catch (error) {
    console.error("Error signing up user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Invalid Username or Password" });
    }

    const userProvidedHash = createHmac("sha256", user.salt)
      .update(password)
      .digest("hex");

    if (user.password !== userProvidedHash) {
      return res.render("login", { error: "Invalid Username or Password" });
    }

    const token = setUser(user);
    res.cookie("uid", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

    const problems = await Problem.find({});
    return res.render("problems", { problems, user: req.user });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
};