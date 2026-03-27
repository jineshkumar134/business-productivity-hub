const mongoose = require('mongoose');

const PersonalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String },
    responsibility: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Personal', PersonalSchema);
