require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./src/models/User/User');

// Test credentials for admin users
const adminCredentials = [
    { email: 'kumarsasi9081@gmail.com', password: 'Admin@123', name: 'Sasi Kumar' },
    { email: 'admin_test_1@gmail.com', password: 'Admin@123', name: 'Admin Test 1' },
    { email: 'testadmin@hrm.com', password: 'Admin@123', name: 'Test Admin' },
    { email: 'admin@test.com', password: 'Admin@123', name: 'Admin Test' }
];

const setupAdminCredentials = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm');
        console.log('✅ Connected to MongoDB');

        // Update or create admin users with test credentials
        for (const adminUser of adminCredentials) {
            // Find existing admin user (case-insensitive email)
            const existingUser = await User.findOne({ email: adminUser.email.toLowerCase() });

            if (existingUser) {
                // Update existing user
                existingUser.password = adminUser.password; // Will be hashed by pre-save hook
                existingUser.role = 'admin'; // Normalize role
                existingUser.isActive = true;
                await existingUser.save();
                console.log(`✅ Updated: ${adminUser.email} | Password: ${adminUser.password}`);
            } else {
                // Create new admin user
                const newUser = new User({
                    email: adminUser.email.toLowerCase(),
                    password: adminUser.password, // Will be hashed by pre-save hook
                    firstName: adminUser.name.split(' ')[0],
                    lastName: adminUser.name.split(' ').slice(1).join(' ') || '',
                    role: 'admin',
                    isActive: true
                });
                await newUser.save();
                console.log(`✅ Created: ${adminUser.email} | Password: ${adminUser.password}`);
            }
        }

        console.log('\n📝 Login Credentials:');
        console.log('=====================================================');
        adminCredentials.forEach(admin => {
            console.log(`Email: ${admin.email}`);
            console.log(`Password: ${admin.password}`);
            console.log('Role: Admin');
            console.log('-----------------------------------------------------');
        });

        await mongoose.connection.close();
        console.log('\n✅ Credentials setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up admin credentials:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

setupAdminCredentials();
