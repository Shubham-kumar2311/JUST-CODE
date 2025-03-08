const express = require("express");
const Problem = require("../models/problem");
const router = express.Router();

const languageMap = require("../utils/languageMap");

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true&fields=*';

const JUDGE0_HEADERS = {
  'x-rapidapi-key': process.env.JUDGE0_API_KEY,
  'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
  'Content-Type': 'application/json'
};

async function submitCodeToJudge0(code, languageId, input = "") {

  const payload = {
    language_id: languageId,
    source_code: Buffer.from(code).toString('base64'),
    stdin: Buffer.from(input).toString('base64')
  };

  try {
    const response = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: JUDGE0_HEADERS,
      body: JSON.stringify(payload)
    });

    let token = await response.json()

    return token;

  } catch (error) {
    console.error("Error submitting code to Judge0:", error.message);
    throw new Error("Failed to execute code on Judge0");
  }
}

// POST /run-code endpoint to run and evaluate code
router.post("/", async (req, res) => {
  const { code, language, problemId } = req.body;

  const userId = req.user?._id;

  if (!languageMap[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const languageId = languageMap[language].id;
    const testCaseResults = [];

    for (const test of problem.run_test) {
      const inputValue = test.input.join(" "); // Join numbers with spaces for scanf()
      const expectedOutputValue = test.output;

      try {
        const token = await submitCodeToJudge0(
          code,
          languageId,
          inputValue
        );


        let gotResult = ""
        if (token) {
          gotResult = token.stdout
        }

        let decodedOutput = "";
        if (gotResult) {
          decodedOutput = Buffer.from(gotResult, "base64")
            .toString("utf-8")
            .trim();
        }

        const passed = decodedOutput === expectedOutputValue;

        testCaseResults.push({
          input: inputValue,
          expectedOutput: expectedOutputValue,
          actualOutput: decodedOutput,
          passed,
          error: token.stderr ? Buffer.from(token.stderr, "base64").toString("utf-8").trim() :  
              token.compile_output ? Buffer.from(token.stderr, "base64").toString("utf-8").trim() : 
                token.message || null
        });
      } catch (err) {
        testCaseResults.push({
          input: inputValue,
          expectedOutput: expectedOutputValue,
          actualOutput: null,
          passed: false,
          error: err.message || "Failed to execute code",
        });
      }
    }

    // if (userId) {
    //   const submission = new Submission({
    //     userId,
    //     problemId,
    //     code,
    //     language,
    //     status: testCaseResults.every((result) => result.passed) ? "Solved" : "Attempted",
    //   });
    //   await submission.save();

    //   await User.findByIdAndUpdate(userId, {
    //     $push: {
    //       solvedProblems: {
    //         problemId,
    //         status: submission.status,
    //         language,
    //         latestSubmissionId: submission._id,
    //       },
    //     },
    //   });
    // }

    return res.json({ testCaseResults, submissionStatus: testCaseResults.every((result) => result.passed) ? "Solved" : "Attempted" });
  } catch (error) {
    console.error("Error executing code:", error);
    return res.status(500).json({ error: "Failed to execute code" });
  }
});

// async function getSubmission(tokenId) {
//     const submissionUrl = `https://judge0-ce.p.rapidapi.com/submissions/${tokenId}?base64_encoded=true&fields=*`;

//     for (let i = 0; i < 10; i++) {  // Polling mechanism
//         try {
//             const response = await fetch(submissionUrl, {
//                 method: 'GET',
//                 headers: JUDGE0_HEADERS
//             });

//             const result = await response.json();

//             if (result.status && result.status.id <= 2) { 
//                 // Status 1: In queue, Status 2: Processing
//                 console.log("Waiting for result...");
//                 await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
//                 continue;
//             }

//             console.log("Submission Result:", result);
//             return result;
//         } catch (error) {
//             console.error("Error fetching submission result:", error);
//             return null;
//         }
//     }

//     console.error("Timeout waiting for Judge0 response.");
//     return null;
// }


module.exports = router;