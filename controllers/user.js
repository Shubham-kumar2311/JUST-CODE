const { createHmac } = require("crypto");
const User = require("../models/user");
const Problem = require("../models/problem");
const { setUser } = require("../service/auth");
const submission = require("../models/submission");

async function handleUserSignup(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username is already taken." });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = setUser(newUser);
    res.cookie("uid", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    return res.status(201).json({ redirect: "/problems" });
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
    
    res.cookie("uid", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Manually set req.user for this request
    req.user = user; // Directly set req.user to the user object

    const problems = await Problem.find({});
    return res.render("landing", { problems, user: req.user, submission });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

// Controller to render the user profile page
async function getUserProfile(req, res) {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    // Fetch user with populated solvedProblems and submissions
    const user = await User.findById(req.user._id)
      .populate({
        path: "solvedProblems.submissions",
        select: "problemId submittedAt status",
        populate: {
          path: "problemId",
          select: "id title difficulty",
        },
      })
      .lean();

    if (!user) {
      return res.status(404).render("error", { message: "User not found" });
    }

    // Fetch total problems count by difficulty
    const totalProblems = {
      easy: await Problem.countDocuments({ difficulty: "Easy" }),
      medium: await Problem.countDocuments({ difficulty: "Medium" }),
      hard: await Problem.countDocuments({ difficulty: "Hard" }),
    };

    // Calculate problem-solving stats (count unique solved problems)
    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
    };
    const solvedProblemIds = new Set(); // Track unique solved problem IDs

    // Flatten submissions from solvedProblems and calculate stats
    const submissions = [];
    user.solvedProblems.forEach((solved) => {
      solved.submissions.forEach((submission) => {
        const problem = submission.problemId;
        if (!problem) return; // Skip if problemId is not populated

        const problemIdStr = problem._id.toString();

        // Only count unique "Solved" problems and cap at totalProblems
        if (submission.status === "Solved" && !solvedProblemIds.has(problemIdStr)) {
          if (problem.difficulty === "Easy" && stats.easy < totalProblems.easy) stats.easy++;
          else if (problem.difficulty === "Medium" && stats.medium < totalProblems.medium) stats.medium++;
          else if (problem.difficulty === "Hard" && stats.hard < totalProblems.hard) stats.hard++;
          solvedProblemIds.add(problemIdStr);
        }

        submissions.push({
          problemId: problem, // Includes id, title, difficulty
          submittedAt: submission.submittedAt,
          status: submission.status,
        });
      });
    });

    // Ensure stats don't exceed total problems
    stats.easy = Math.min(stats.easy, totalProblems.easy);
    stats.medium = Math.min(stats.medium, totalProblems.medium);
    stats.hard = Math.min(stats.hard, totalProblems.hard);

    // Attach stats, totalProblems, and submissions to user object
    user.stats = stats;
    user.totalProblems = totalProblems;
    user.submissions = submissions;

    return res.render("profile", { user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).render("error", { message: "Internal server error" });
  }
}


// Controller to render the update profile page
async function getUpdateProfile(req, res) {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }
    const user = await User.findById(req.user._id).lean();
    return res.render("updateProfile", { user });
  } catch (error) {
    console.error("Error fetching update profile page:", error);
    return res.status(500).render("error", { message: "Internal server error" });
  }
}

// Controller to handle profile updates
async function updateUserProfile(req, res) {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const { username, email, password } = req.body;
    const updates = {};

    if (username && username.trim() !== req.user.username) {
      if (username.trim().length < 3) {
        return res.render("update-profile", { user: req.user, error: "Username must be at least 3 characters long" });
      }
      const usernameExists = await User.findOne({ username: username.trim() });
      if (usernameExists && usernameExists._id.toString() !== req.user._id.toString()) {
        return res.render("update-profile", { user: req.user, error: "Username already taken" });
      }
      updates.username = username.trim();
    }

    if (email && email.trim() !== req.user.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.render("update-profile", { user: req.user, error: "Invalid email format" });
      }
      const emailExists = await User.findOne({ email: email.trim() });
      if (emailExists && emailExists._id.toString() !== req.user._id.toString()) {
        return res.render("update-profile", { user: req.user, error: "Email already in use" });
      }
      updates.email = email.trim();
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.render("update-profile", { user: req.user, error: "Password must be at least 6 characters long" });
      }
      const user = await User.findById(req.user._id);
      user.password = password.trim();
      await user.save(); // Triggers pre-save hook for hashing
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, updates, { runValidators: true });
    }

    // Refresh user data in session
    req.user = await User.findById(req.user._id).lean();

    // Redirect to profile with success flag
    return res.redirect("/user/profile?success=true");
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.render("update-profile", { user: req.user, error: "Failed to update profile. Try again." });
  }
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
  getUserProfile,
  updateUserProfile,
  getUpdateProfile
};