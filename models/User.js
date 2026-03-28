const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }
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

module.exports = mongoose.model('User', UserSchema);
