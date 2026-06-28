const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name:            { type: String, required: true, trim: true },
    industry:        { type: String, default: '' },
    establishedYear: { type: Number, default: null },
    description:     { type: String, default: '' },
    ownedBy:         { type: String, default: '' },   // admin email who created it
    color:           { type: String, default: '#6366f1' },
    bg:              { type: String, default: 'rgba(99,102,241,0.12)' },
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
