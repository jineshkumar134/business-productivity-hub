const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name:               { type: String, required: true, trim: true },
    companyId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    color:              { type: String, default: '#6366f1' },
    bg:                 { type: String, default: 'rgba(99,102,241,0.12)' },
    icon:               { type: String, default: 'building' },
    division:           { type: String, default: '' },          // Which division this dept belongs to
    deptLeader:         { type: String, default: '' },          // Name of dept leader
    employeeVisibility: { type: Boolean, default: false },      // If true, employees see all dept tasks
    createdAt:          { type: Date, default: Date.now }
});

// Same dept name is allowed in different companies
departmentSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
