const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const Department = require('../models/Department');
const { requireMinRole, ROLE_LEVELS } = require('../middleware/roleCheck');

// Helper: resolve division for a department name
async function getDivisionForDept(deptName) {
    if (!deptName) return '';
    const dept = await Department.findOne({ name: deptName });
    return dept ? (dept.division || '') : '';
}

// GET personal — role-filtered
router.get('/', async (req, res) => {
    try {
        const role     = req.headers['x-user-role']       || 'employee';
        const userDiv  = req.headers['x-user-division']   || '';
        const userDept = req.headers['x-user-department'] || '';

        let list = await Personal.find({});

        if (role === 'division_head') {
            // Get all departments that belong to this division
            const divisionDepts = await Department.find({ division: userDiv });
            const divisionDeptNames = divisionDepts.map(d => d.name);

            // Match by personal.division OR by department being in this division
            list = list.filter(p =>
                p.division === userDiv ||
                divisionDeptNames.includes(p.department)
            );
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

        // Auto-infer division from department if not provided
        let inferredDivision = req.body.division || '';
        if (!inferredDivision && req.body.department) {
            inferredDivision = await getDivisionForDept(req.body.department);
        }

        const newPerson = new Personal({ ...req.body, division: inferredDivision });
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
                    division:   inferredDivision,
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

        // Auto-infer division from department if not provided
        let updateBody = { ...req.body };
        if (!updateBody.division && updateBody.department) {
            updateBody.division = await getDivisionForDept(updateBody.department);
        }

        const updatedPerson = await Personal.findByIdAndUpdate(req.params.id, updateBody, { new: true });
        if (updatedPerson) {
            // Sync to User login collection if email is present
            if (updatedPerson.email) {
                const User = require('../models/User');
                const userUpdate = {
                    name: updatedPerson.name,
                    division: updatedPerson.division || '',
                    department: updatedPerson.department || ''
                };
                if (updateBody.role) {
                    const roleMap = {
                        'Admin': 'admin',
                        'Division Head': 'division_head',
                        'Department Leader': 'dept_leader',
                        'Employee': 'employee', 'Staff': 'employee'
                    };
                    userUpdate.role = roleMap[updateBody.role] || 'employee';
                }
                await User.findOneAndUpdate({ email: updatedPerson.email.toLowerCase() }, { $set: userUpdate });
            }
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
