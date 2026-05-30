require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('./src/models/User/User');

const verifyPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm');
        console.log('✅ Connected to MongoDB');

        const testEmail = 'ssathiskumar641@gmail.com';
        const testPassword = 'Emp@123';

        // Get user with password field
        const user = await User.findOne({ email: testEmail }).select('+password');

        if (!user) {
            console.log(`❌ User not found: ${testEmail}`);
        } else {
            console.log(`\n📋 User Details:`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`IsActive: ${user.isActive}`);
            console.log(`Hashed Password: ${user.password.substring(0, 20)}...`);

            // Test password comparison
            console.log(`\n🔐 Testing Password Comparison:`);
            console.log(`Testing password: "${testPassword}"`);

            const isMatch = await user.comparePassword(testPassword);
            console.log(`Password Match: ${isMatch ? '✅ YES' : '❌ NO'}`);

            if (!isMatch) {
                console.log(`\n⚠️  Password does not match!`);
                console.log(`Trying manual bcrypt comparison...`);
                const manualMatch = await bcrypt.compare(testPassword, user.password);
                console.log(`Manual bcrypt compare: ${manualMatch ? '✅ YES' : '❌ NO'}`);
            }

            // Try logging in through the controller logic
            console.log(`\n🧪 Simulating Login Flow:`);
            if (!user.isActive) {
                console.log('❌ Account is deactivated');
            } else if (!await user.comparePassword(testPassword)) {
                console.log('❌ Invalid email or password');
            } else {
                console.log('✅ Login would succeed!');
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying password:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

verifyPassword();
