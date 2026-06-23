const mongoose = require('mongoose');
const crypto = require('crypto');

// Role hierarchy levels (higher number = higher authority)
const ROLE_LEVELS = {
    owner: 5,
    admin: 4,
    division_head: 3,
    dept_leader: 2,
    employee: 1
};

const UserSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    phone:      { type: String, required: true },
    password:   { type: String, required: true },
    role:       { type: String, enum: ['owner', 'admin', 'division_head', 'dept_leader', 'employee'], default: 'employee' },
    division:   { type: String, default: '' },   // Division name (for division_head, dept_leader, employee)
    department: { type: String, default: '' },   // Department name (for dept_leader, employee)
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
