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
        const role      = req.headers['x-user-role']       || 'employee';
        const userDiv   = req.headers['x-user-division']   || '';
        const userDept  = req.headers['x-user-department'] || '';
        const userEmail = req.headers['x-user-email']      || '';
        const userName  = req.headers['x-user-name']       || '';
        const companyId = req.headers['x-company-id']      || req.query.companyId || null;

        // Base query — filter by company if provided
        const baseQuery = companyId ? { companyId } : {};
        let departments = await Department.find(baseQuery).sort({ createdAt: 1 });

        if (role === 'admin') {
            // Admin sees all departments in this company
        } else if (role === 'division_head') {
            let div = userDiv;
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
                departments = [];
            } else {
                departments = departments.filter(d => d.division && d.division.trim().toLowerCase() === cleanDiv);
            }
        } else if (role === 'dept_leader' || role === 'employee') {
            let dept = userDept;
            if (!dept && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) dept = me.department || '';
            }
            if (!dept) {
                const Personal = require('../models/Personal');
                const mePerson = await Personal.findOne({
                    name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') },
                    role: { $regex: /department leader/i }
                });
                if (mePerson) dept = mePerson.department || '';
            }
            const cleanDept = (dept || '').trim().toLowerCase();
            if (!cleanDept) {
                departments = [];
            } else {
                departments = departments.filter(d => d.name && d.name.trim().toLowerCase() === cleanDept);
            }
        }

        // ── Validate deptLeader fields — auto-clear stale/ghost leaders ───────
        const toUpdate = [];
        departments = departments.map(d => {
            const obj = d.toObject();
            obj._deptLeaderRaw = obj.deptLeader || '';
            return obj;
        });

        // Collect all unique leader names to check in one query
        const leaderNames = [...new Set(departments.map(d => d._deptLeaderRaw).filter(Boolean))];
        let validLeaders = new Set();
        if (leaderNames.length > 0) {
            const validPersons = await Personal.find({
                name: { $in: leaderNames.map(n => new RegExp(`^${n.trim()}$`, 'i')) },
                role: { $regex: /department leader/i }
            });
            validPersons.forEach(p => validLeaders.add((p.name || '').trim().toLowerCase()));
        }

        // For each dept, check if leader is valid — if not, clear it
        const clearPromises = [];
        departments = departments.map(d => {
            const leaderName = (d._deptLeaderRaw || '').trim();
            if (leaderName && !validLeaders.has(leaderName.toLowerCase())) {
                // Ghost leader — clear from DB asynchronously
                clearPromises.push(
                    Department.findByIdAndUpdate(d._id, { $set: { deptLeader: '' } })
                );
                d.deptLeader = '';
            }
            delete d._deptLeaderRaw;
            return d;
        });
        if (clearPromises.length > 0) await Promise.all(clearPromises);

        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create department — admin and above
router.post('/', requireMinRole('admin'), async (req, res) => {
    try {
        const { name, color, bg, division, deptLeader, companyId } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Department name is required' });
        if (!companyId) return res.status(400).json({ error: 'companyId is required' });

        const count = await Department.countDocuments({ companyId });
        const palette = COLOR_PALETTE[count % COLOR_PALETTE.length];

        const dept = new Department({
            name: name.trim(),
            companyId,
            color: color || palette.color,
            bg: bg || palette.bg,
            division: division || '',
            deptLeader: deptLeader || ''
        });
        await dept.save();
        res.status(201).json(dept);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Department already exists in this company' });
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
        let userDept = req.headers['x-user-department'] || '';
        if (role === 'dept_leader') {
            if (!userDept && req.headers['x-user-email']) {
                const User = require('../models/User');
                const me = await User.findOne({ email: req.headers['x-user-email'].toLowerCase() });
                if (me) userDept = me.department || '';
            }
            if (!userDept) {
                const userName = req.headers['x-user-name'] || '';
                const Personal = require('../models/Personal');
                const mePerson = await Personal.findOne({
                    name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') },
                    role: { $regex: /department leader/i }
                });
                if (mePerson) userDept = mePerson.department || '';
            }
            const cleanDept = (userDept || '').trim().toLowerCase();
            const cleanDeptName = (dept.name || '').trim().toLowerCase();
            if (!cleanDept || cleanDept !== cleanDeptName) {
                return res.status(403).json({ error: 'You can only modify your own department.' });
            }
        }

        dept.employeeVisibility = req.body.employeeVisibility;
        await dept.save();
        res.json(dept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
