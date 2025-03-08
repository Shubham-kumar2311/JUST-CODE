const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

async function connectToMongoDB(url) {
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // Exit on failure to ensure the app doesn’t run without a DB
  }
}

module.exports = {
  connectToMongoDB,
};