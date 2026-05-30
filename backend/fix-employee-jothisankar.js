const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User/User');
const Employee = require('./src/models/Employee/Employee');

async function fixEmployee() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the user jothishankar73@gmail.com
        const targetEmail = 'jothishankar73@gmail.com';
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`❌ User ${targetEmail} not found!`);
            process.exit(1);
        }
        console.log(`👤 Found Target User: ${user.firstName} ${user.lastName}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);

        // Find the existing employee with email jothisankar979@gmail.com or similarly named
        let employee = await Employee.findOne({ email: 'jothisankar979@gmail.com' });

        if (!employee) {
            // Fallback: try finding by EMP0001
            employee = await Employee.findOne({ employeeId: 'EMP0001' });
        }

        if (!employee) {
            console.log('⚠️ No existing employee EMP0001 found. Creating a new employee profile...');
            
            // Create a completely new employee record for jothishankar73@gmail.com
            employee = new Employee({
                employeeId: 'EMP0001',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userId: user._id,
                phone: '9876543210',
                dateOfBirth: new Date('1995-01-01'),
                gender: 'Male',
                address: '123 Test Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                zipCode: '600001',
                department: 'IT',
                position: 'Software Developer',
                joiningDate: new Date(),
                employmentType: 'Full-time',
                workLocation: 'Office',
                basicSalary: 25000,
                emergencyContactName: 'Emergency Contact',
                emergencyContactPhone: '9876543211',
                emergencyContactRelation: 'Parent',
                isActive: true,
                status: 'Confirmed'
            });

            await employee.save();
            console.log('✅ Created new employee profile successfully!');
        } else {
            console.log(`👤 Found Existing Employee: ${employee.firstName} ${employee.lastName}`);
            console.log(`   ID: ${employee._id}`);
            console.log(`   Email: ${employee.email}`);

            // Update employee profile with target user information
            employee.email = user.email;
            employee.firstName = user.firstName;
            employee.lastName = user.lastName;
            employee.userId = user._id;

            await employee.save();
            console.log('✅ Updated existing employee profile successfully!');
        }

        // Verify the status
        const updatedUser = await User.findById(user._id);
        const linkedEmployee = await Employee.findOne({ userId: user._id });

        console.log('\n📊 Verification:');
        console.log(`   User Email: ${updatedUser.email}`);
        console.log(`   Linked Employee Name: ${linkedEmployee ? `${linkedEmployee.firstName} ${linkedEmployee.lastName}` : '❌ NONE'}`);
        console.log(`   Linked Employee Email: ${linkedEmployee ? linkedEmployee.email : '❌ NONE'}`);
        console.log(`   Employee ID: ${linkedEmployee ? linkedEmployee.employeeId : '❌ NONE'}`);

        console.log('\n🎉 Linking successful! Please restart or refresh the page.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing employee:', error);
        process.exit(1);
    }
}

fixEmployee();
