const express = require("express");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const router = express.Router();

const languageMap = require("../utils/languageMap");

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true&fields=*';
const JUDGE0_HEADERS = {
    'x-rapidapi-key': process.env.JUDGE0_API_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
};

// Submit code to Judge0 and get a token
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

        const token = await response.json();
        return token;
    } catch (error) {
        console.error("Error submitting code to Judge0:", error.message);
        throw new Error("Failed to execute code on Judge0");
    }
}

// Poll Judge0 for submission results
// async function getSubmission(tokenId) {
//     const submissionUrl = `https://judge0-ce.p.rapidapi.com/submissions/${tokenId}?base64_encoded=true&fields=*`;

//     for (let i = 0; i < 10; i++) { // Poll up to 10 times
//         try {
//             const response = await fetch(submissionUrl, {
//                 method: 'GET',
//                 headers: JUDGE0_HEADERS
//             });

//             const result = await response.json();

//             if (result.status && result.status.id <= 2) { // In Queue (1) or Processing (2)
//                 console.log("Waiting for result...");
//                 await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
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

// POST /submit-solution route for the "Submit Answer" button
router.post("/", async (req, res) => {
    const { code, language, comments, userId, problemId } = req.body;

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

        // Run all test cases
        for (const test of problem.run_test) {
            const inputValue = test.input.join(" "); // Join array for input
            const expectedOutputValue = Array.isArray(test.output) ? test.output.join(" ") : test.output; // Handle array or string output

            try {
                // Submit code to Judge0
                const token = await submitCodeToJudge0(code, languageId, inputValue);

                if (!token || !token.token) {
                    throw new Error("No token returned from Judge0");
                }

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
                    error: token.stderr ? Buffer.from(result.stderr, "base64").toString("utf-8").trim() : null
                });
            } catch (err) {
                testCaseResults.push({
                    input: inputValue,
                    expectedOutput: expectedOutputValue,
                    actualOutput: null,
                    passed: false,
                    error: err.message || "Failed to execute code"
                });
            }
        }

        // Determine submission status
        const submissionStatus = testCaseResults.every(result => result.passed) ? "Solved" : "Attempted";

        // Save submission and update user if userId is provided
        if (userId) {
            const submission = new Submission({
                userId,
                problemId,
                code,
                language,
                comments, // Include comments if provided
                status: submissionStatus,
                testCaseResults // Store test case results for reference
            });
            const savedSubmission = await submission.save();

            // Update user's solvedProblems
            await User.findByIdAndUpdate(userId, {
                $push: {
                    solvedProblems: {
                        problemId,
                        submissions: [submission._id]
                    }
                }
            });
        }

        // Send response to frontend
        return res.json({
            testCaseResults,
            submissionStatus
        });
    } catch (error) {
        console.error("Error executing code:", error);
        return res.status(500).json({ error: "Failed to execute code" });
    }
});

module.exports = router;