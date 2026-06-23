const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name:               { type: String, required: true, unique: true, trim: true },
    color:              { type: String, default: '#6366f1' },
    bg:                 { type: String, default: 'rgba(99,102,241,0.12)' },
    icon:               { type: String, default: 'building' },
    division:           { type: String, default: '' },          // Which division this dept belongs to
    deptLeader:         { type: String, default: '' },          // Name of dept leader
    employeeVisibility: { type: Boolean, default: false },      // If true, employees see all dept tasks
    createdAt:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('Department', departmentSchema);
