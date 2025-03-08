const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
    },
    solvedProblems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        status: {
          type: String,
          enum: ["Solved", "Attempted", "NotAttempt"],
          default: "NotAttempt",
        },
        language: {
          type: String,
        },
        submissionDate: {
          type: Date,
          default: Date.now,
        },
        code: {
          type: String,
          required: false,
        },
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Pre-save hook for password hashing
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(this.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedPassword;
  next();
});

module.exports = mongoose.model("User", userSchema);