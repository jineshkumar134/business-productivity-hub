const mongoose = require('mongoose');

const PersonalSchema = new mongoose.Schema({
    name:           { type: String, required: true },
    role:           { type: String, required: true },
    department:     { type: String, default: '' },
    division:       { type: String, default: '' },
    email:          { type: String, default: '' },
    responsibility: { type: String, default: '' },
    photoData:      { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Personal', PersonalSchema);
