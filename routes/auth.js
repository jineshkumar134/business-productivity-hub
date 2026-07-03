const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Personal = require('../models/Personal');
const Department = require('../models/Department');
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
    const companyId    = req.headers['x-company-id'] || req.body.companyId || null;

    // === Case 1: Creating an Admin account (requires secret) ===
    let isCreatingAdminWithSecret = false;
    if (targetRole === 'admin') {
        const providedSecret = req.headers['x-admin-secret'] || adminSecret || '';
        const actualSecret   = process.env.ADMIN_SECRET;
        if (!actualSecret) {
            return res.status(500).json({ error: 'Server misconfiguration: Contact your system administrator.' });
        }
        if (providedSecret.trim() !== actualSecret.trim()) {
            return res.status(403).json({ error: 'Creating an Admin account requires the correct Admin Secret.' });
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

        // ── Duplicate name check (warn, not hard-block) ──────────────────────
        const incomingName = (name || '').trim();
        const forceCreate  = req.body.force === true;
        if (incomingName && !forceCreate) {
            const existingByName = await User.findOne({
                name: { $regex: new RegExp(`^${incomingName}$`, 'i') }
            });
            if (existingByName) {
                return res.status(409).json({
                    warn: true,
                    existingDept: existingByName.department || 'N/A',
                    message: `A user named "${incomingName}" already exists (Department: ${existingByName.department || 'N/A'}). Do you still want to create a new account with this name?`
                });
            }
        }

        // Auto-infer division from department
        let finalDivision = division || '';
        if (department) {
            const deptObj = await Department.findOne({ name: department });
            if (deptObj && deptObj.division) {
                finalDivision = deptObj.division;
            }
        }

        const newUser = new User({
            name, email, phone, password,
            role:       targetRole,
            department: department || '',
            companyId:  companyId  || null,
            createdBy:  creatorName
        });
        await newUser.save();

        // Auto-create Personal profile
        await Personal.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                name,
                role:           ROLE_DISPLAY[targetRole] || targetRole,
                department:     department  || '',
                companyId:      companyId  || null,
                responsibility: ROLE_DISPLAY[targetRole] || targetRole,
                email:          email.toLowerCase()
            },
            { upsert: true, new: true }
        );

        // Sync: if this is a Department Leader, set them as the leader of their department
        if (targetRole === 'dept_leader' && department) {
            await Department.updateOne(
                { name: { $regex: new RegExp(`^${department.trim()}$`, 'i') } },
                { $set: { deptLeader: name } }
            );
        }

        res.status(201).json({
            message: 'Account created successfully!',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department }
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

        // Fetch fresh department from Personal profile
        let latestDept = user.department || '';

        const person = await Personal.findOne({ email: email.toLowerCase() });
        if (person) {
            latestDept = person.department || latestDept;
        }

        res.json({
            message: 'Login successful!',
            user: {
                id:         user._id,
                name:       user.name,
                email:      user.email,
                phone:      user.phone,
                role:       user.role,
                department: latestDept
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Data Migration: run once to upgrade old owner→admin, staff→employee ─────
router.post('/migrate-roles', async (req, res) => {
    const providedSecret = req.headers['x-admin-secret'] || req.body.adminSecret || '';
    const actualSecret   = process.env.ADMIN_SECRET;
    if (!actualSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: Contact your system administrator.' });
    }
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
