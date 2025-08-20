const mongoose = require('mongoose');
const Staff = require('./src/models/staff');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Staff.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists with username:', existingAdmin.username);
      console.log('Updating admin credentials...');
      
      // Update existing admin
      existingAdmin.username = process.argv[2] || 'admin';
      existingAdmin.password = process.argv[3] || 'admin123';
      existingAdmin.email = process.argv[4] || 'admin@example.com';
      await existingAdmin.save();
      console.log('Admin credentials updated successfully');
    } else {
      // Create new admin user
      const adminUser = new Staff({
        username: process.argv[2] || 'admin',
        password: process.argv[3] || 'admin123',
        email: process.argv[4] || 'admin@example.com',
        role: 'admin'
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }
    
    console.log('Username:', process.argv[2] || 'admin');
    console.log('Email:', process.argv[4] || 'admin@example.com');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
createAdminUser();
