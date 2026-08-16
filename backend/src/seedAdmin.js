const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const env = require('./config/env');

const ADMIN_EMAIL = 'admin@wacrm.io';
const ADMIN_PASSWORD = 'Admin@WaCRM2026';
const ADMIN_NAME = 'Admin';

async function seedAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Make sure ALL users with ADMIN_EMAIL or existing admin are role: 'admin'
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      existing.password = ADMIN_PASSWORD;
      existing.role = 'admin';
      
      // Ensure workspace exists
      if (!existing.workspace) {
        let workspace = await Workspace.findOne({ owner: existing._id });
        if (!workspace) {
          workspace = await Workspace.create({
            name: 'MK Global Consultants',
            owner: existing._id
          });
        }
        existing.workspace = workspace._id;
      }

      await existing.save();
      console.log('');
      console.log('✅ Admin user updated successfully! Role set to admin.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Email:    ${ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
      console.log(`🛡️ Role:     ${existing.role}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      process.exit(0);
    }

    // Create admin user
    const user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });

    // Create workspace
    const workspace = await Workspace.create({
      name: 'MK Global Consultants',
      owner: user._id
    });

    // Link workspace
    user.workspace = workspace._id;
    await user.save();

    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedAdmin();
