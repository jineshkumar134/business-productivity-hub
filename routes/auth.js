const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Personal = require('../models/Personal');

// Helper to check DB is ready
const dbReady = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: 'Database not connected. Please check your MongoDB connection and try again.' });
        return false;
    }
    return true;
};

// Sign Up — Admin only (requires ADMIN_SECRET header)
router.post('/signup', async (req, res) => {
    if (!dbReady(res)) return;

    // 🔒 Admin secret gate
    const providedSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    const safeProvided = providedSecret ? providedSecret.trim() : '';
    const safeExpected = process.env.ADMIN_SECRET ? process.env.ADMIN_SECRET.trim() : '';
    
    console.log(`[DEBUG SIGNUP] Provided: "${safeProvided}" Expected: "${safeExpected}"`);
    
    if (!safeProvided || safeProvided !== safeExpected) {
        return res.status(403).json({ error: 'Access denied. User accounts can only be created by an Admin.' });
    }

    try {
        const { name, email, phone, password, role, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const newUser = new User({ name, email, phone, password, role: role || 'staff' });
        await newUser.save();

        // Automatically create or update corresponding Personal profile
        await Personal.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                name,
                role: role === 'admin' ? 'Admin' : 'Staff',
                department: department || 'HR Department',
                responsibility: role === 'admin' ? 'System Administrator' : 'Team Member',
                email: email.toLowerCase()
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            message: 'Account created successfully!',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Sign In
router.post('/signin', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({
            message: 'Login successful!',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
