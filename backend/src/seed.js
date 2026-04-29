require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Item = require('./src/models/Item');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});

    // Create users
    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@media.com', password: 'admin123', role: 'admin' },
      { name: 'Manager One', email: 'manager@media.com', password: 'manager123', role: 'manager' },
      { name: 'Cashier One', email: 'cashier@media.com', password: 'cashier123', role: 'cashier' },
      { name: 'Viewer One', email: 'viewer@media.com', password: 'viewer123', role: 'viewer' },
    ]);

    // Note: passwords are NOT hashed here because the User model pre-save hook handles it
    console.log(`✅ Created ${users.length} users`);

    // Create items
    const items = await Item.insertMany([
      // Polaroids
      { name: 'Polaroid 3x4 Print', category: 'polaroid', price: 50, stock: 100, lowStockThreshold: 10 },
      { name: 'Polaroid 4x6 Print', category: 'polaroid', price: 70, stock: 80, lowStockThreshold: 10 },
      { name: 'Polaroid Mini Strip', category: 'polaroid', price: 30, stock: 150, lowStockThreshold: 20 },
      { name: 'Polaroid Booth Set (4)', category: 'polaroid', price: 120, stock: 60, lowStockThreshold: 8 },
      { name: 'Polaroid Collage Print', category: 'polaroid', price: 90, stock: 40, lowStockThreshold: 5 },

      // Posters
      { name: 'A4 Art Poster', category: 'poster', price: 80, stock: 50, lowStockThreshold: 5 },
      { name: 'A3 Movie Poster', category: 'poster', price: 120, stock: 30, lowStockThreshold: 5 },
      { name: 'Custom Name Poster', category: 'poster', price: 150, stock: 25, lowStockThreshold: 5 },
      { name: 'Aesthetic Wall Poster', category: 'poster', price: 100, stock: 3, lowStockThreshold: 5 },

      // Stickers
      { name: 'Character Sticker Pack (10)', category: 'sticker', price: 40, stock: 200, lowStockThreshold: 20 },
      { name: 'Holographic Stickers (5)', category: 'sticker', price: 60, stock: 120, lowStockThreshold: 15 },
      { name: 'Custom Name Sticker', category: 'sticker', price: 25, stock: 0, lowStockThreshold: 10 },
      { name: 'Anime Sticker Sheet', category: 'sticker', price: 55, stock: 80, lowStockThreshold: 10 },
      { name: 'Die-Cut Stickers (3)', category: 'sticker', price: 35, stock: 4, lowStockThreshold: 10 },
    ]);

    console.log(`✅ Created ${items.length} items`);
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin:   admin@media.com   / admin123');
    console.log('  Manager: manager@media.com / manager123');
    console.log('  Cashier: cashier@media.com / cashier123');
    console.log('  Viewer:  viewer@media.com  / viewer123');
    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
