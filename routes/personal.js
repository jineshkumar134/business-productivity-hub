const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const { requireMinRole, ROLE_LEVELS } = require('../middleware/roleCheck');

// GET personal — role-filtered
router.get('/', async (req, res) => {
    try {
        const role     = req.headers['x-user-role']       || 'employee';
        const userDiv  = req.headers['x-user-division']   || '';
        const userDept = req.headers['x-user-department'] || '';

        let list = await Personal.find({});

        if (role === 'division_head') {
            list = list.filter(p => p.division === userDiv);
        } else if (role === 'dept_leader') {
            list = list.filter(p => p.department === userDept);
        } else if (role === 'employee') {
            // Employee can only see their own profile
            const userName = req.headers['x-user-name'] || '';
            list = list.filter(p => p.name.trim().toLowerCase() === userName.trim().toLowerCase());
        }

        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create personal — dept_leader and above
router.post('/', requireMinRole('dept_leader'), async (req, res) => {
    try {
        const creatorRole = req.headers['x-user-role'] || 'employee';
        const targetRoleDisplay = req.body.role || 'Employee';
        
        // Map targetRoleDisplay to system role
        const roleMap = {
            'Admin': 'admin',
            'Division Head': 'division_head',
            'Department Leader': 'dept_leader',
            'Employee': 'employee', 'Staff': 'employee'
        };
        const targetRole = roleMap[targetRoleDisplay] || 'employee';
        
        const creatorLevel = ROLE_LEVELS[creatorRole] || 0;
        const targetLevel = ROLE_LEVELS[targetRole] || 0;
        
        if (creatorLevel <= targetLevel) {
            return res.status(403).json({
                error: `Access Denied. You cannot create a user with role: ${targetRoleDisplay}`
            });
        }

        const newPerson = new Personal(req.body);
        await newPerson.save();

        // Auto-create login if email + password provided
        if (req.body.email && req.body.password) {
            const User = require('../models/User');
            const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
            if (!existingUser) {
                const newUser = new User({
                    name:       req.body.name,
                    email:      req.body.email.toLowerCase(),
                    phone:      req.body.phone || '0000000000',
                    password:   req.body.password,
                    role:       targetRole,
                    division:   req.body.division   || '',
                    department: req.body.department || '',
                    createdBy:  req.headers['x-user-name'] || ''
                });
                await newUser.save();
            }
        }

        res.status(201).json(newPerson);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update personal — dept_leader and above
router.put('/:id', requireMinRole('dept_leader'), async (req, res) => {
    try {
        const creatorRole = req.headers['x-user-role'] || 'employee';
        const creatorLevel = ROLE_LEVELS[creatorRole] || 0;
        
        const existingPerson = await Personal.findById(req.params.id);
        if (!existingPerson) return res.status(404).json({ error: 'Personal profile not found' });
        
        const roleMap = {
            'Admin': 'admin',
            'Division Head': 'division_head',
            'Department Leader': 'dept_leader',
            'Employee': 'employee', 'Staff': 'employee'
        };
        const currentTargetRole = roleMap[existingPerson.role] || 'employee';
        const newTargetRole = roleMap[req.body.role || existingPerson.role] || 'employee';
        
        const currentTargetLevel = ROLE_LEVELS[currentTargetRole] || 0;
        const newTargetLevel = ROLE_LEVELS[newTargetRole] || 0;
        
        // Cannot modify someone of equal or higher rank
        if (creatorLevel <= currentTargetLevel) {
            return res.status(403).json({ error: 'Access Denied. You cannot edit someone of equal or higher rank.' });
        }
        // Cannot upgrade someone to equal or higher rank than yourself
        if (creatorLevel <= newTargetLevel) {
            return res.status(403).json({ error: `Access Denied. You cannot assign the role: ${req.body.role}` });
        }

        const updatedPerson = await Personal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedPerson) {
            res.json(updatedPerson);
        } else {
            res.status(404).json({ message: 'Personal not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE personal — dept_leader and above
router.delete('/:id', requireMinRole('dept_leader'), async (req, res) => {
    try {
        const creatorRole = req.headers['x-user-role'] || 'employee';
        const creatorLevel = ROLE_LEVELS[creatorRole] || 0;
        
        const person = await Personal.findById(req.params.id);
        if (!person) return res.status(404).json({ error: 'Member not found' });
        
        const roleMap = {
            'Admin': 'admin',
            'Division Head': 'division_head',
            'Department Leader': 'dept_leader',
            'Employee': 'employee', 'Staff': 'employee'
        };
        const targetRole = roleMap[person.role] || 'employee';
        const targetLevel = ROLE_LEVELS[targetRole] || 0;
        
        if (creatorLevel <= targetLevel) {
            return res.status(403).json({ error: 'Access Denied. You cannot remove someone of equal or higher rank.' });
        }

        await Personal.findByIdAndDelete(req.params.id);
        
        // Also delete their User login account if it exists
        const User = require('../models/User');
        await User.findOneAndDelete({ email: person.email?.toLowerCase() });
        
        res.json({ message: 'Personal deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
