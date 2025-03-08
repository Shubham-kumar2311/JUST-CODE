const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['c', "cpp", "java", "python", "javascript"],
    },
    testCaseResults: [
      {
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        error: String,
      },
    ],
    status: {
      type: String,
      enum: ["Solved", "Attempted"],
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
);

module.exports = mongoose.model("Submission", submissionSchema);