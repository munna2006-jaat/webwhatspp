const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // exponential backoff
      } else {
        console.error('❌ All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
