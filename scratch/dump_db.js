const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Personal = require('../models/Personal');

dotenv.config();

async function dump() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('=== USERS ===');
        const users = await User.find({});
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Div: "${u.division}", Dept: "${u.department}"`);
        });

        console.log('\n=== PERSONAL PROFILES ===');
        const personal = await Personal.find({});
        personal.forEach(p => {
            console.log(`- Name: ${p.name}, Email: ${p.email}, Role: ${p.role}, Div: "${p.division}", Dept: "${p.department}"`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
dump();
