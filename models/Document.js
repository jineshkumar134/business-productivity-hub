const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true }, // base64 encoded document content
    category: { type: String, default: 'Other' },
    description: { type: String },
    uploadedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
