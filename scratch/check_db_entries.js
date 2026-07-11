const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const ContentOS = require('../models/ContentOS');

async function test() {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const entries = await ContentOS.find({});
    console.log('All ContentOS entries currently in DB:');
    console.dir(entries.map(e => ({
        _id: e._id,
        title: e.title,
        hook: e.hook,
        story: e.story,
        category: e.category,
        objective: e.objective,
        currentStatus: e.currentStatus
    })), { depth: null });
    await mongoose.disconnect();
}

test().catch(console.error);
