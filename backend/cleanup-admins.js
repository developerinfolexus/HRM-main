const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User/User');

async function cleanupAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all admin users
        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} admin accounts:\n`);
        admins.forEach((a, i) => {
            console.log(`  ${i + 1}. ${a.email} (${a.firstName} ${a.lastName}) - ID: ${a._id}`);
        });

        // Keep only testadmin@hrm.com, remove the rest
        const keepEmail = 'testadmin@hrm.com';
        const adminsToRemove = admins.filter(a => a.email !== keepEmail);

        console.log(`\n🗑️  Removing ${adminsToRemove.length} extra admin accounts...`);
        for (const admin of adminsToRemove) {
            await User.findByIdAndDelete(admin._id);
            console.log(`   ❌ Removed: ${admin.email}`);
        }

        // Set a known password for the remaining admin
        const keepAdmin = await User.findOne({ email: keepEmail });
        if (keepAdmin) {
            keepAdmin.password = 'Admin@123';
            keepAdmin.isActive = true;
            await keepAdmin.save();
            console.log(`\n✅ Updated admin password successfully!`);
        } else {
            console.log(`\n⚠️  Admin ${keepEmail} not found. Creating...`);
            const newAdmin = new User({
                firstName: 'Admin',
                lastName: 'HRM',
                email: keepEmail,
                password: 'Admin@123',
                role: 'admin',
                isActive: true
            });
            await newAdmin.save();
            console.log(`✅ Created admin account!`);
        }

        // Verify
        const remainingAdmins = await User.find({ role: 'admin' });
        console.log(`\n📊 Remaining admin accounts: ${remainingAdmins.length}`);
        remainingAdmins.forEach(a => {
            console.log(`   ✅ ${a.email} (${a.firstName} ${a.lastName})`);
        });

        console.log('\n═══════════════════════════════════════');
        console.log('  ADMIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log(`  Email: ${keepEmail}`);
        console.log('  Password: Admin@123');
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupAdmins();
