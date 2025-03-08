const express = require("express");
const mongoose = require("mongoose");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const languageMap = require("../utils/languageMap");

const router = express.Router();

// GET /problems - list all
router.get("/", async (req, res) => {
  try {
    const problems = await Problem.find({});
    return res.render("problems", { problems, user: req.user });
  } catch (error) {
    console.error("Error fetching problems:", error);
    return res.status(500).send("An error occurred while fetching problems.");
  }
});

// GET /problems/:id - single problem
router.get("/:id", async (req, res) => {
  try {
    const problemId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).send("Invalid problem ID");
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send("Problem not found");
    }

    const userStatus = req.user?.solvedProblems?.find(
      (p) => p.problemId.toString() === problemId
    ) || { status: "NotAttempt", code: null, language: null };

    if (userStatus.latestSubmissionId) {
      const latestSubmission = await Submission.findById(userStatus.latestSubmissionId);
      userStatus.code = latestSubmission?.code || null;
      userStatus.language = latestSubmission?.language || null;
    }

    return res.render("problem", {
      user: req.user,
      problem,
      userStatus,
      languageMap,
    });
  } catch (error) {
    console.error("Error fetching problem:", error);
    return res.status(500).send("An error occurred while fetching the problem.");
  }
});

module.exports = router;