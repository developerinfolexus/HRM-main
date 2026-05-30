require('dotenv').config();
const mongoose = require('mongoose');

// Import User model
const User = require('./src/models/User/User');

// Test credentials for employee users (from debug_output.txt)
const employeeCredentials = [
    { email: 'ssathiskumar641@gmail.com', password: 'Emp@123', name: 'Surya Prakash S', empId: 'EMP0001' },
    { email: 'suryakumar@gmail.com', password: 'Emp@123', name: 'surya kumar', empId: 'EMP0002' },
    { email: 'surya641@gmail.com', password: 'Emp@123', name: 'surya s', empId: 'EMP0003' },
    { email: 'kumarsasi9081@gmail.com', password: 'Emp@123', name: 'Sasikumar RS', empId: 'EMP0004' },
    { email: 'vimal641@gmail.com', password: 'Emp@123', name: 'vimal R', empId: 'EMP0005' }
];

const setupEmployeeCredentials = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm');
        console.log('✅ Connected to MongoDB');

        // Update or create employee users with test credentials
        for (const empUser of employeeCredentials) {
            // Find existing employee user (case-insensitive email)
            const existingUser = await User.findOne({ email: empUser.email.toLowerCase() });

            if (existingUser) {
                // Update existing user
                existingUser.password = empUser.password; // Will be hashed by pre-save hook
                existingUser.role = 'employee'; // Normalize role
                existingUser.isActive = true;
                await existingUser.save();
                console.log(`✅ Updated: ${empUser.email} | Password: ${empUser.password} | Role: Employee`);
            } else {
                // Create new employee user
                const newUser = new User({
                    email: empUser.email.toLowerCase(),
                    password: empUser.password, // Will be hashed by pre-save hook
                    firstName: empUser.name.split(' ')[0],
                    lastName: empUser.name.split(' ').slice(1).join(' ') || '',
                    role: 'employee',
                    isActive: true
                });
                await newUser.save();
                console.log(`✅ Created: ${empUser.email} | Password: ${empUser.password} | Role: Employee`);
            }
        }

        console.log('\n📝 Employee Login Credentials:');
        console.log('=====================================================');
        employeeCredentials.forEach(emp => {
            console.log(`Email: ${emp.email}`);
            console.log(`Password: ${emp.password}`);
            console.log(`Role: Employee`);
            console.log('-----------------------------------------------------');
        });

        await mongoose.connection.close();
        console.log('\n✅ Employee credentials setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up employee credentials:', error.message);
        console.error(error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

setupEmployeeCredentials();
