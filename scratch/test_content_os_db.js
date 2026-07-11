const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const ContentOS = require('../models/ContentOS');
const Company = require('../models/Company'); // Let's check if Company exists too

async function test() {
    console.log('Connecting to DB at:', uri ? uri.substring(0, 25) + '...' : 'undefined');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully!');
    
    // 1. Find a company to associate the dummy data with
    let company = await mongoose.model('Company').findOne();
    if (!company) {
        console.log('No company found in database. Creating a temp dummy company...');
        const CompanySchema = new mongoose.Schema({ name: String });
        const TempCompany = mongoose.models.Company || mongoose.model('Company', CompanySchema);
        company = new TempCompany({ name: 'Test Hub Company' });
        await company.save();
    }
    console.log('Using Company ID:', company._id);

    // 2. Fetch existing ContentOS entries
    const entries = await ContentOS.find({ companyId: company._id });
    console.log(`Found ${entries.length} ContentOS entries in DB for this company.`);

    // 3. Create a dummy entry to verify the schema validation and write connection
    console.log('Inserting dummy ContentOS entry...');
    const dummy = new ContentOS({
        companyId: company._id,
        title: 'Dummy Strategic Update Topic',
        category: 'Employees / Internal',
        objective: 'Strategic Update',
        referenceLink: 'https://growthhub.example.com/ref',
        hook: 'This is a test hook to verify DB saving!',
        curiosity: 'Will it save correctly to MongoDB?',
        story: 'We set up enums, cleaned up CSS gap, and now we are verifying.',
        proof: 'Check console logs showing status 200/201.',
        lesson: 'Always align models with HTML view dropdown values.',
        cta: 'Click hard refresh to check.',
        currentStatus: 'Idea',
        ideaDate: new Date()
    });
    
    const saved = await dummy.save();
    console.log('Dummy ContentOS saved successfully! ID:', saved._id);

    // 4. Verify we can fetch it back
    const fetched = await ContentOS.findById(saved._id);
    console.log('Fetched dummy back from DB. Title matches:', fetched.title === 'Dummy Strategic Update Topic');

    // 5. Clean up the dummy entry so we don't pollute the production database
    await ContentOS.deleteOne({ _id: saved._id });
    console.log('Cleaned up dummy entry from DB.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

test().catch(err => {
    console.error('Error during DB validation:', err);
    process.exit(1);
});
