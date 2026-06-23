const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, default: '#6366f1' },
    bg:    { type: String, default: 'rgba(99,102,241,0.12)' },
    createdBy: { type: String } // name of owner/admin who created it
}, { timestamps: true });

module.exports = mongoose.model('Division', DivisionSchema);
