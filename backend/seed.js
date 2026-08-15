const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS

require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./models');

const sampleProducts = [
  {
    title: 'Rich Chocolate Fudge Cake',
    category: 'collection',
    price: 850,
    stock: 10
  },
  {
    title: 'Handcrafted Hazelnut Truffles',
    category: 'artisanal',
    price: 1200,
    stock: 15
  },
  {
    title: 'Classic Spiced Heritage Plum Cake',
    category: 'heritage',
    price: 950,
    stock: 8
  }
];

const seedDB = async () => {
  try {
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('2. Connected! Database Name:', mongoose.connection.name);

    console.log('3. Clearing existing products...');
    await Product.deleteMany({});

    console.log('4. Inserting sample products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    
    console.log(`✅ SUCCESS! Inserted ${createdProducts.length} products into database "${mongoose.connection.name}".`);
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED AT STEP:', err);
    process.exit(1);
  }
};

seedDB();