require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Item = require('./models/Item');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});

    // ── Users ─────────────────────────────────────────────────────
    const userData = [
      { name: 'Admin User',  email: 'admin@media.com',   password: 'admin123',   role: 'admin'   },
      { name: 'Manager One', email: 'manager@media.com', password: 'manager123', role: 'manager' },
      { name: 'Cashier One', email: 'cashier@media.com', password: 'cashier123', role: 'cashier' },
      { name: 'Viewer One',  email: 'viewer@media.com',  password: 'viewer123',  role: 'viewer'  },
    ];
    for (const u of userData) {
      await new User(u).save();
    }
    console.log(`✅ Created ${userData.length} users (passwords hashed via bcrypt)`);

    // ── Step 1: Create the Polaroid Central Stock master ──────────
    // This hidden item holds the actual physical polaroid count.
    // isActive:false → not shown in billing catalogue or inventory filters.
    const polaroidMaster = await Item.create({
      name: 'Polaroid Central Stock',
      category: 'polaroid',
      price: 0,
      stock: 200,           // total physical polaroids in hand
      lowStockThreshold: 20,
      isActive: false,      // hidden from billing UI & catalogue
      piecesPerUnit: 1,
      stockRef: null,
    });
    console.log(`✅ Created central polaroid stock master (id: ${polaroidMaster._id})`);

    // ── Step 2: Polaroid billing variants (all share the master) ──
    const polaroidVariants = await Item.insertMany([
      {
        name: 'Polaroid – Single',
        category: 'polaroid',
        price: 129,
        stock: 0,           // ignored; stock lives on master
        lowStockThreshold: 0,
        piecesPerUnit: 1,   // consumes 1 physical polaroid per unit sold
        stockRef: polaroidMaster._id,
      },
      {
        name: 'Polaroid – Group of 2',
        category: 'polaroid',
        price: 219,
        stock: 0,
        lowStockThreshold: 0,
        piecesPerUnit: 2,   // consumes 2 physical polaroids per unit sold
        stockRef: polaroidMaster._id,
      },
      {
        name: 'Polaroid – Pack of 5',
        category: 'polaroid',
        price: 519,
        stock: 0,
        lowStockThreshold: 0,
        piecesPerUnit: 5,   // consumes 5 physical polaroids per unit sold
        stockRef: polaroidMaster._id,
      },
    ]);
    console.log(`✅ Created ${polaroidVariants.length} polaroid variants (central stock → master)`);

    // ── Step 3: Posters & Stickers (independent stock per item) ───
    const otherItems = await Item.insertMany([
      // Posters
      { name: 'A4 Art Poster',          category: 'poster',  price: 80,  stock: 50,  lowStockThreshold: 5  },
      { name: 'A3 Movie Poster',        category: 'poster',  price: 120, stock: 30,  lowStockThreshold: 5  },
      { name: 'Custom Name Poster',     category: 'poster',  price: 150, stock: 25,  lowStockThreshold: 5  },
      { name: 'Aesthetic Wall Poster',  category: 'poster',  price: 100, stock: 10,  lowStockThreshold: 5  },

      // Stickers
      { name: 'Character Sticker Pack (10)', category: 'sticker', price: 40, stock: 200, lowStockThreshold: 20 },
      { name: 'Holographic Stickers (5)',    category: 'sticker', price: 60, stock: 120, lowStockThreshold: 15 },
      { name: 'Custom Name Sticker',         category: 'sticker', price: 25, stock: 80,  lowStockThreshold: 10 },
      { name: 'Anime Sticker Sheet',         category: 'sticker', price: 55, stock: 80,  lowStockThreshold: 10 },
      { name: 'Die-Cut Stickers (3)',        category: 'sticker', price: 35, stock: 60,  lowStockThreshold: 10 },
    ]);
    console.log(`✅ Created ${otherItems.length} poster/sticker items`);

    console.log('\n🔑 Login Credentials:');
    console.log('  Admin:   admin@media.com   / admin123');
    console.log('  Manager: manager@media.com / manager123');
    console.log('  Cashier: cashier@media.com / cashier123');
    console.log('  Viewer:  viewer@media.com  / viewer123');

    console.log('\n📸 Polaroid Setup:');
    console.log(`  Central stock: ${polaroidMaster.stock} physical polaroids`);
    console.log('  Single  (₹129) → uses 1 polaroid');
    console.log('  Group 2 (₹219) → uses 2 polaroids');
    console.log('  Pack 5  (₹519) → uses 5 polaroids');

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
