const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Personal = require('../models/Personal');
const { ROLE_LEVELS } = require('../middleware/roleCheck');

// Helper to map system role → display label
const ROLE_DISPLAY = {
    admin:        'Admin',
    division_head:'Division Head',
    dept_leader:  'Department Leader',
    employee:     'Employee'
};

// Helper: check DB ready
const dbReady = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: 'Database not connected.' });
        return false;
    }
    return true;
};

// ── Sign Up ─────────────────────────────────────────────────────────────────
// Admin can create anyone (subordinates). Admin creation requires ADMIN_SECRET.
router.post('/signup', async (req, res) => {
    if (!dbReady(res)) return;

    const { name, email, phone, password, role, department, division, adminSecret } = req.body;
    const targetRole   = role || 'employee';
    const creatorRole  = req.headers['x-user-role'] || '';
    const creatorName  = req.headers['x-user-name']  || '';

    // === Case 1: Creating an Admin account (requires secret) ===
    let isCreatingAdminWithSecret = false;
    if (targetRole === 'admin') {
        const providedSecret = req.headers['x-admin-secret'] || adminSecret || '';
        const actualSecret   = process.env.ADMIN_SECRET || 'BizHub@AdminOnly2024';
        if (providedSecret.trim() !== actualSecret.trim()) {
            return res.status(403).json({ error: 'Creating an Admin account requires the Admin Secret.' });
        }
        isCreatingAdminWithSecret = true;
    }

    if (!isCreatingAdminWithSecret) {
        // === Case 2: Logged-in user creating a subordinate ===
        if (creatorRole) {
            const creatorLevel = ROLE_LEVELS[creatorRole] || 0;
            const targetLevel  = ROLE_LEVELS[targetRole]  || 0;
            if (creatorLevel <= targetLevel) {
                return res.status(403).json({
                    error: `A ${ROLE_DISPLAY[creatorRole] || creatorRole} cannot create a ${ROLE_DISPLAY[targetRole] || targetRole} account.`
                });
            }
        }
        // === Case 3: No creator role → block ===
        else {
            return res.status(403).json({ error: 'Access denied. You must be logged in to create accounts.' });
        }
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });

        const newUser = new User({
            name, email, phone, password,
            role:       targetRole,
            division:   division   || '',
            department: department || '',
            createdBy:  creatorName
        });
        await newUser.save();

        // Auto-create Personal profile
        await Personal.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                name,
                role:           ROLE_DISPLAY[targetRole] || targetRole,
                department:     department || '',
                division:       division   || '',
                responsibility: ROLE_DISPLAY[targetRole] || targetRole,
                email:          email.toLowerCase()
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            message: 'Account created successfully!',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, division: newUser.division, department: newUser.department }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── Sign In ─────────────────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
    if (!dbReady(res)) return;
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        res.json({
            message: 'Login successful!',
            user: {
                id:         user._id,
                name:       user.name,
                email:      user.email,
                phone:      user.phone,
                role:       user.role,
                division:   user.division   || '',
                department: user.department || ''
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Data Migration: run once to upgrade old owner→admin, staff→employee ─────
router.post('/migrate-roles', async (req, res) => {
    const providedSecret = req.headers['x-admin-secret'] || req.body.adminSecret || '';
    const actualSecret   = process.env.ADMIN_SECRET || 'BizHub@AdminOnly2024';
    if (providedSecret.trim() !== actualSecret.trim()) {
        return res.status(403).json({ error: 'Migration requires Admin Secret.' });
    }
    try {
        const ownerRes = await User.updateMany({ role: 'owner' }, { $set: { role: 'admin' } });
        const staffRes = await User.updateMany({ role: 'staff' }, { $set: { role: 'employee' } });
        res.json({
            message: 'Migration complete',
            ownerToAdmin: ownerRes.modifiedCount,
            staffToEmployee: staffRes.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
