import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talentranker');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create default admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@talentranker.com',
      password: 'Admin@123456', // Change this in production
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Default admin user created successfully');
    console.log('Email: admin@talentranker.com');
    console.log('Password: Admin@123456');
    console.log('⚠️  Please change the password after first login in production!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAdmin();