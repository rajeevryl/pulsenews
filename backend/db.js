const mongoose = require('mongoose');

async function connectDB() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      console.error('❌ MONGO_URL or MONGODB_URI environment variable is required');
      process.exit(1);
    }
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;