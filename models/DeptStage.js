const mongoose = require('mongoose');

// Workflow stages for a specific department in a specific company
const DeptStageSchema = new mongoose.Schema({
    companyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    stages: [{
        order:       { type: Number, required: true },
        title:       { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        color:       { type: String, default: '#6366f1' },
    }]
}, { timestamps: true });

// One stages-document per company+department pair
DeptStageSchema.index({ companyId: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model('DeptStage', DeptStageSchema);
