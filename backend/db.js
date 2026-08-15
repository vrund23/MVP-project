// 1. Force Google DNS for Windows DNS SRV lookup compatibility
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const TARGET_DB_NAME = process.env.DB_NAME || 'ecommerce'; 

const connectDB = async () => {
  try {
    // 2. Pass explicit dbName in Mongoose connection options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: TARGET_DB_NAME,
    });

    const activeDbName = conn.connection.name;

    // 3. FAIL-SAFE GUARD: Kill process if Mongoose accidentally fell back to 'test'
    if (activeDbName === 'test' && TARGET_DB_NAME !== 'test') {
      console.error(`\n❌ CRITICAL DATABASE ERROR: Connected to default "${activeDbName}" database instead of "${TARGET_DB_NAME}".`);
      console.error(`👉 Check your MONGODB_URI string in .env!\n`);
      process.exit(1); // Stop server execution immediately
    }

    console.log(`\n==============================================`);
    console.log(`✅ DATABASE CONNECTED SUCCESSFULLY`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📦 Active Target Database: "${activeDbName}"`);
    console.log(`==============================================\n`);

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;