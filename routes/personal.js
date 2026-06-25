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
        const userEmail = req.headers['x-user-email']    || '';
        let   userDept = req.headers['x-user-department'] || '';

        let list = await Personal.find({});

        if (role === 'admin') {
            // Admin sees everything — no filter
        } else if (role === 'division_head') {
            let div = userDiv;
            if (!div && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) div = me.division || '';
            }
            if (!div) {
                const userName = req.headers['x-user-name'] || '';
                const mePerson = await Personal.findOne({
                    name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') },
                    role: { $regex: /division head/i }
                });
                if (mePerson) div = mePerson.division || '';
            }

            const cleanDiv = (div || '').trim().toLowerCase();
            if (!cleanDiv) {
                list = [];
            } else {
                const divisionDepts = await Department.find({
                    division: { $regex: new RegExp(`^${cleanDiv}$`, 'i') }
                });
                const divisionDeptNames = divisionDepts.map(d => d.name.trim().toLowerCase());

                list = list.filter(p => {
                    const pDiv = (p.division || '').trim().toLowerCase();
                    const pDept = (p.department || '').trim().toLowerCase();
                    return pDiv === cleanDiv || (pDept && divisionDeptNames.includes(pDept));
                });
            }
        } else if (role === 'dept_leader') {
            if (!userDept && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) userDept = me.department || '';
            }
            if (!userDept) {
                const userName = req.headers['x-user-name'] || '';
                const mePerson = await Personal.findOne({
                    name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') },
                    role: { $regex: /department leader/i }
                });
                if (mePerson) userDept = mePerson.department || '';
            }
            const cleanDept = (userDept || '').trim().toLowerCase();
            if (!cleanDept) {
                list = [];
            } else {
                list = list.filter(p => p.department && p.department.trim().toLowerCase() === cleanDept);
            }
        } else if (role === 'employee') {
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

        // Auto-infer division from department
        let inferredDivision = req.body.division || '';
        if (req.body.department) {
            const inferred = await getDivisionForDept(req.body.department);
            if (inferred) inferredDivision = inferred;
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

        // Auto-infer division from department
        let updateBody = { ...req.body };
        if (updateBody.department) {
            const inferred = await getDivisionForDept(updateBody.department);
            if (inferred) updateBody.division = inferred;
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
