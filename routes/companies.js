const express = require('express');
const router  = express.Router();
const Company    = require('../models/Company');
const Department = require('../models/Department');
const User       = require('../models/User');
const Task       = require('../models/Task');
const Personal   = require('../models/Personal');
const Division   = require('../models/Division');
const { requireMinRole } = require('../middleware/roleCheck');

const COLOR_PALETTE = [
    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
];

// ── GET all companies (admin sees all, others see their own) ─────────────────
router.get('/', async (req, res) => {
    try {
        const role      = req.headers['x-user-role']  || 'employee';
        const userEmail = req.headers['x-user-email'] || '';

        let companies;
        if (role === 'admin') {
            companies = await Company.find().sort({ createdAt: 1 });
        } else {
            // Non-admin: find companies they belong to via User record
            const user = await User.findOne({ email: userEmail.toLowerCase() });
            if (!user || !user.companyId) return res.json([]);
            companies = await Company.find({ _id: user.companyId });
        }
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create company — admin only ────────────────────────────────────────
router.post('/', requireMinRole('admin'), async (req, res) => {
    try {
        const { name, industry, establishedYear, description } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Company name is required' });

        const count = await Company.countDocuments();
        const palette = COLOR_PALETTE[count % COLOR_PALETTE.length];
        const userEmail = req.headers['x-user-email'] || '';

        const company = new Company({
            name: name.trim(),
            industry: industry || '',
            establishedYear: establishedYear || null,
            description: description || '',
            ownedBy: userEmail,
            color: palette.color,
            bg: palette.bg,
        });
        await company.save();
        res.status(201).json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT update company details — admin only ──────────────────────────────────
router.put('/:id', requireMinRole('admin'), async (req, res) => {
    try {
        const { name, industry, establishedYear, description } = req.body;
        const updated = await Company.findByIdAndUpdate(
            req.params.id,
            { $set: { name, industry, establishedYear, description } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Company not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE company — admin only (also removes its departments) ───────────────
router.delete('/:id', requireMinRole('admin'), async (req, res) => {
    try {
        const cid = req.params.id;
        await Department.deleteMany({ companyId: cid });
        await Division.deleteMany({ companyId: cid });
        await Company.findByIdAndDelete(cid);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /migrate — one-time: create default company and link all existing data
router.post('/migrate', requireMinRole('admin'), async (req, res) => {
    try {
        const { companyName } = req.body;
        const userEmail = req.headers['x-user-email'] || '';

        // Check if a default company already exists
        let defaultCompany = await Company.findOne({ ownedBy: userEmail });
        if (!defaultCompany) {
            defaultCompany = new Company({
                name: companyName || 'My Company',
                industry: '',
                ownedBy: userEmail,
                color: '#6366f1',
                bg: 'rgba(99,102,241,0.12)',
            });
            await defaultCompany.save();
        }
        const cid = defaultCompany._id;

        // Link all orphan records (companyId is null) to this default company
        const [depts, users, tasks, personal, divs] = await Promise.all([
            Department.updateMany({ companyId: null }, { $set: { companyId: cid } }),
            User.updateMany({ companyId: null }, { $set: { companyId: cid } }),
            Task.updateMany({ companyId: null }, { $set: { companyId: cid } }),
            Personal.updateMany({ companyId: null }, { $set: { companyId: cid } }),
            Division.updateMany({ companyId: null }, { $set: { companyId: cid } }),
        ]);

        res.json({
            success: true,
            company: defaultCompany,
            migrated: {
                departments: depts.modifiedCount,
                users: users.modifiedCount,
                tasks: tasks.modifiedCount,
                personal: personal.modifiedCount,
                divisions: divs.modifiedCount,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
