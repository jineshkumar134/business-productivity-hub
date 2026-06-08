const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const Document = require('./models/Document');

async function test() {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const docs = await Document.find({}, { data: 0 });
    console.log('Documents in DB:', docs);
    await mongoose.disconnect();
}

test().catch(console.error);
