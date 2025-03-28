require("dotenv").config();
const express = require("express");
const path = require("path");
const favicon = require('serve-favicon');
const cookieParser = require("cookie-parser");
const { connectToMongoDB } = require("./config/db");
const { checkForAuthenticationCookie } = require("./middlewares/auth");

const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");
const problemsRoute = require("./routes/problems");
const getSubmissionHistory = require("./routes/submissionHistory");
const runCodeRoute = require("./controllers/run-route");
const submitSolution = require("./controllers/submit-solution");
const AIroute = require("./routes/aiRoutes")

const app = express();
app.use(favicon(path.join(__dirname, 'utils', 'logo.png')));
const PORT = process.env.PORT || 8001;

// Connect to MongoDB
connectToMongoDB(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/leet-code");

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(checkForAuthenticationCookie("uid"));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/problems", problemsRoute);
app.use("/", staticRoute);
app.use("/user", userRoute);
app.use("/run-code", runCodeRoute);
app.use("/submit-solution", submitSolution);
app.use("/ai", AIroute);
app.use("/submission-history", getSubmissionHistory);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server for locally
app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));

// Start server for web
module.exports = app;