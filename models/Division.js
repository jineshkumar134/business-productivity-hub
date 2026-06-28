const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    color:     { type: String, default: '#6366f1' },
    bg:        { type: String, default: 'rgba(99,102,241,0.12)' },
    createdBy: { type: String } // name of admin who created it
}, { timestamps: true });

// Same division name allowed in different companies
DivisionSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Division', DivisionSchema);
