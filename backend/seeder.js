// backend/seeder.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Node.js DNS resolver to Google

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const seedDatabase = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('Missing MONGODB_URI in environment variables.');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(dbUri);
    console.log('Database connection established.');

    const jsonPath = path.join(__dirname, 'data/catalog.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Data file not found at path: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const catalog = JSON.parse(rawData);

    console.log('Purging existing product collection...');
    const deleteResult = await Product.deleteMany();
    console.log(`Deleted ${deleteResult.deletedCount} outdated products.`);

    console.log(`Inserting ${catalog.length} fresh catalog items...`);
    const insertedRecords = await Product.insertMany(catalog);
    console.log(`Successfully seeded ${insertedRecords.length} items into MongoDB Atlas.`);

    await mongoose.connection.close();
    console.log('Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process terminated with error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDatabase();