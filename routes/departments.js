const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Personal = require('../models/Personal');
const Task = require('../models/Task');
const User = require('../models/User');
const { requireMinRole } = require('../middleware/roleCheck');

// Palette of colors for auto-assignment
const COLOR_PALETTE = [
    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
    { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
];

// GET all departments
router.get('/', async (req, res) => {
    try {
        const role     = req.headers['x-user-role']     || 'employee';
        const userDiv  = req.headers['x-user-division'] || '';
        const userDept = req.headers['x-user-department'] || '';

        let departments = await Department.find().sort({ createdAt: 1 });

        if (role === 'division_head') {
            departments = departments.filter(d => d.division === userDiv);
        } else if (role === 'dept_leader' || role === 'employee') {
            departments = departments.filter(d => d.name === userDept);
        }

        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create department — admin and above
router.post('/', requireMinRole('admin'), async (req, res) => {
    try {
        const { name, color, bg, division, deptLeader } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Department name is required' });

        const count = await Department.countDocuments();
        const palette = COLOR_PALETTE[count % COLOR_PALETTE.length];

        const dept = new Department({
            name: name.trim(),
            color: color || palette.color,
            bg: bg || palette.bg,
            division: division || '',
            deptLeader: deptLeader || ''
        });
        await dept.save();
        res.status(201).json(dept);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Department already exists' });
        res.status(500).json({ error: err.message });
    }
});

// DELETE department — admin only
router.delete('/:id', requireMinRole('admin'), async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update department (name, division, deptLeader) — admin only
router.put('/:id', requireMinRole('admin'), async (req, res) => {
    try {
        const existing = await Department.findById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Department not found' });

        const oldName = existing.name;
        const newDivision = req.body.division !== undefined ? req.body.division : existing.division;
        const newName = req.body.name ? req.body.name.trim() : existing.name;

        const updated = await Department.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        // Cascade division change to Personal records in this department
        if (newDivision !== existing.division || newName !== oldName) {
            // Update Personal records
            await Personal.updateMany(
                { department: oldName },
                { $set: { division: newDivision, department: newName } }
            );
            // Update Task records
            await Task.updateMany(
                { department: oldName },
                { $set: { division: newDivision, department: newName } }
            );
            // Update User login records
            await User.updateMany(
                { department: oldName },
                { $set: { division: newDivision, department: newName } }
            );
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH toggle employee visibility — dept_leader and above
router.patch('/:id/visibility', async (req, res) => {
    const role = req.headers['x-user-role'] || 'employee';
    if (!['admin', 'division_head', 'dept_leader'].includes(role)) {
        return res.status(403).json({ error: 'Only department leaders and above can change visibility.' });
    }
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });

        // dept_leader can only modify their own department
        const userDept = req.headers['x-user-department'] || '';
        if (role === 'dept_leader' && dept.name !== userDept) {
            return res.status(403).json({ error: 'You can only modify your own department.' });
        }

        dept.employeeVisibility = req.body.employeeVisibility;
        await dept.save();
        res.json(dept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
