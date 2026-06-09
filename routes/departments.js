const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

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
    { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
];

// GET all departments
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().sort({ createdAt: 1 });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a department
router.post('/', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const { name, color, bg } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Department name is required' });

        // Auto-pick color if not provided
        const count = await Department.countDocuments();
        const palette = COLOR_PALETTE[count % COLOR_PALETTE.length];

        const dept = new Department({
            name: name.trim(),
            color: color || palette.color,
            bg: bg || palette.bg,
        });
        await dept.save();
        res.status(201).json(dept);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Department already exists' });
        res.status(500).json({ error: err.message });
    }
});

// DELETE a department
router.delete('/:id', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
