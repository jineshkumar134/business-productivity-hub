const express = require('express');
const router = express.Router();
const Division = require('../models/Division');
const { requireMinRole } = require('../middleware/roleCheck');

// GET all divisions — admin, division_head can see
router.get('/', async (req, res) => {
    try {
        const role = req.headers['x-user-role'] || 'employee';
        const userName = req.headers['x-user-name'] || '';
        let divisions = await Division.find().sort({ createdAt: 1 });

        // Division head only sees their own division
        if (role === 'division_head') {
            const userDivision = req.headers['x-user-division'] || '';
            const userEmail = req.headers['x-user-email'] || '';
            let div = userDivision;
            if (!div && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) div = me.division || '';
            }
            if (!div) {
                const Personal = require('../models/Personal');
                const mePerson = await Personal.findOne({
                    name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') },
                    role: { $regex: /division head/i }
                });
                if (mePerson) div = mePerson.division || '';
            }
            const cleanDiv = (div || '').trim().toLowerCase();
            if (!cleanDiv) {
                divisions = [];
            } else {
                divisions = divisions.filter(d => d.name && d.name.trim().toLowerCase() === cleanDiv);
            }
        }

        res.json(divisions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create division — admin only
router.post('/', requireMinRole('admin'), async (req, res) => {
    try {
        const { name, color, bg } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Division name is required' });

        const division = new Division({
            name: name.trim(),
            color: color || '#6366f1',
            bg: bg || 'rgba(99,102,241,0.12)',
            createdBy: req.headers['x-user-name'] || ''
        });
        await division.save();
        res.status(201).json(division);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Division already exists' });
        res.status(500).json({ error: err.message });
    }
});

// DELETE division — admin and above
router.delete('/:id', requireMinRole('admin'), async (req, res) => {
    try {
        await Division.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
