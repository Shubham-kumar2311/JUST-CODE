const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    description: {
      type: String,
      required: true,
    },
    examples: [
      {
        input: {
          type: String,
          required: true,
        },
        output: {
          type: String,
          required: true,
        },
      },
    ],
    run_test: [
      {
        input: {
          type: [Number], // Array of numbers for space-separated input
          required: true,
        },
        output: {
          type: String, // Expected output as a string
          required: true,
        },
      },
    ],
    constraints: {
      type: String,
      required: true,
    },
    input_fomat: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);