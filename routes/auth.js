const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to check DB is ready
const dbReady = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: 'Database not connected. Please check your MongoDB connection and try again.' });
        return false;
    }
    return true;
};

// Sign Up
router.post('/signup', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const { name, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const newUser = new User({ name, email, phone, password });
        await newUser.save();

        res.status(201).json({
            message: 'Account created successfully!',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone }
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
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
