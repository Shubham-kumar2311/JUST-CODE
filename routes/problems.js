const express = require("express");
const mongoose = require("mongoose");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const languageMap = require("../utils/languageMap");
const User = require("../models/user");
const submission = require("../models/submission");

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

    if(!req.user){
      const userStatus = { status: "NotAttempt", code: null, language: null };
      return res.render("problem", {
        user: req.user,
        problem,
        userStatus,
        languageMap,
      });
    }

    let user = await User.findById(req.user._id)
    
    let user_problem_submission_list = null

    for (let i of user.solvedProblems) {
      if (i.problemId.toString() === problemId.toString()) {
        user_problem_submission_list = i.submissions;
          break;
      }
    }

    if(!user_problem_submission_list){
      const userStatus = { status: "NotAttempt", code: null, language: null };
      return res.render("problem", {
        user: req.user,
        problem,
        userStatus,
        languageMap,
      });
    }
  
    let last_submission_id = user_problem_submission_list[user_problem_submission_list.length - 1]
    let last_submission = await Submission.findById(last_submission_id)

    let userStatus = { status: last_submission.status, code: JSON.stringify(last_submission.code), language: last_submission.language };

    return res.render("problem", {
      user: req.user,
      problem,
      userStatus,
      languageMap,
    });



  //       
  //   console.log(user)

  //   // const userStatus = user?.solvedProblems?.find(
  //   //   (p) => p.problemId.toString() === problemId
  //   // ) || { status: "NotAttempt", code: null, language: null };


    
  //   // let userStatus = user?.solvedProblems?.find( (p) => p.problemId.toString() === problemId );

  //   let submission_ = await Submission.find({ 
  //     userId: user._id.toString(), 
  //     problemId: problemId.toString() 
  // });
  


  //   if(userStatus){
  //       submission_ = await Submission.findById(userStatus)
  //       userStatus = { status: "NotAttempt", code: null, language: null };
  //   }
  //   else
  //     userStatus = { status: "NotAttempt", code: null, language: null };

  //   // console.log("userStatus -> " ,  userStatus)

  //   if (userStatus.latestSubmissionId) {
  //     const latestSubmission = await Submission.findById(userStatus.latestSubmissionId);
  //     userStatus.code = latestSubmission?.code || null;
  //     userStatus.language = latestSubmission?.language || null;
  //   }

    // console.log(req.user, "->" , 
    //   userStatus,
    //   )

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