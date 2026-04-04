const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('--- DB Connection Diagnostic ---');
console.log('Testing URI:', uri.replace(/:([^@]+)@/ , ':****@')); // Hide password in logs

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
.then(() => {
    console.log('✅ SUCCESS: Connected perfectly to MongoDB!');
    process.exit(0);
})
.catch(err => {
    console.log('❌ CONNECTION FAILED');
    console.log('---------------------------');
    console.log('ERROR NAME:', err.name);
    console.log('ERROR MESSAGE:', err.message);
    console.log('---------------------------');
    
    if (err.message.includes('IP address')) {
        console.log('👉 SUGGESTION: Your IP is not whitelisted. Go to MongoDB Atlas -> Network Access and add your IP.');
    } else if (err.message.includes('authentication failed')) {
        console.log('👉 SUGGESTION: Your password or username in .env is incorrect.');
    } else if (err.name === 'MongooseServerSelectionError') {
        console.log('👉 SUGGESTION: This is usually a firewall/DNS issue or your internet is blocking Atlas.');
    }
    
    process.exit(1);
});
