const mongoose = require('mongoose');
const crypto = require('crypto');

// Role hierarchy levels (higher number = higher authority)
const ROLE_LEVELS = {
    admin: 3,
    dept_leader: 2,
    employee: 1
};

const UserSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    phone:      { type: String, required: true },
    password:   { type: String, required: true },
    role:       { type: String, enum: ['admin', 'dept_leader', 'employee'], default: 'employee' },
    department: { type: String, default: '' },   // Department name
    companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    createdBy:  { type: String, default: '' }    // Name of user who created this account
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = crypto.createHash('sha256').update(this.password).digest('hex');
});

// Compare password method
UserSchema.methods.comparePassword = function(candidatePassword) {
    const hashed = crypto.createHash('sha256').update(candidatePassword).digest('hex');
    return this.password === hashed;
};

// Static: check if roleA can create roleB
UserSchema.statics.canCreate = function(creatorRole, targetRole) {
    return (ROLE_LEVELS[creatorRole] || 0) > (ROLE_LEVELS[targetRole] || 0);
};

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLE_LEVELS = ROLE_LEVELS;
