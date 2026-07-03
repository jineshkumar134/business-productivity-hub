const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const Department = require('../models/Department');
const { requireMinRole, ROLE_LEVELS } = require('../middleware/roleCheck');

function getNormalizedRole(roleStr) {
    if (!roleStr) return 'employee';
    // Clean emojis, convert to lowercase, and check matches
    const clean = roleStr.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim().toLowerCase();
    
    if (clean.includes('admin')) return 'admin';
    if (clean.includes('leader') || clean.includes('lead') || clean.includes('head')) return 'dept_leader';
    return 'employee';
}

// GET personal — role-filtered
router.get('/', async (req, res) => {
    try {
        const role     = req.headers['x-user-role']       || 'employee';
        const userEmail = req.headers['x-user-email']    || '';
        let   userDept = req.headers['x-user-department'] || '';
        const companyId = req.headers['x-company-id']    || req.query.companyId || null;

        const query = companyId ? { companyId } : {};
        let list = await Personal.find(query);

        if (role === 'admin') {
            // Admin sees everything — no filter
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
        const companyId = req.headers['x-company-id'] || req.body.companyId || null;
        
        const targetRole = getNormalizedRole(targetRoleDisplay);
        
        const creatorLevel = ROLE_LEVELS[creatorRole] || 0;
        const targetLevel = ROLE_LEVELS[targetRole] || 0;
        
        if (creatorLevel <= targetLevel) {
            return res.status(403).json({
                error: `Access Denied. You cannot create a user with role: ${targetRoleDisplay}`
            });
        }

        // ── Duplicate name check (warn, not hard-block) ──────────────────────
        const incomingName = (req.body.name || '').trim();
        const forceCreate  = req.body.force === true;
        if (incomingName && !forceCreate) {
            const existingByName = await Personal.findOne({
                name: { $regex: new RegExp(`^${incomingName}$`, 'i') },
                companyId
            });
            if (existingByName) {
                return res.status(409).json({
                    warn: true,
                    existingDept: existingByName.department || 'N/A',
                    message: `An employee named "${incomingName}" already exists (Department: ${existingByName.department || 'N/A'}). Do you still want to add a new employee with this name?`
                });
            }
        }

        const newPerson = new Personal({ ...req.body, companyId });
        await newPerson.save();

        // Sync: if this person is a Department Leader, set them as the leader of their department
        if (targetRole === 'dept_leader' && newPerson.department) {
            await Department.updateOne(
                { name: { $regex: new RegExp(`^${newPerson.department.trim()}$`, 'i') } },
                { $set: { deptLeader: newPerson.name } }
            );
        }

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
        
        const currentTargetRole = getNormalizedRole(existingPerson.role);
        const newTargetRole = getNormalizedRole(req.body.role || existingPerson.role);
        
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
            // Sync to User login collection if email is present
            if (updatedPerson.email) {
                const User = require('../models/User');
                const userUpdate = {
                    name: updatedPerson.name,
                    department: updatedPerson.department || ''
                };
                if (req.body.role) {
                    userUpdate.role = getNormalizedRole(req.body.role);
                }
                await User.findOneAndUpdate({ email: updatedPerson.email.toLowerCase() }, { $set: userUpdate });
            }

            // ── Sync: department leader updates ──────────────────────────────
            const oldName = (existingPerson.name || '').trim();
            const oldDept = (existingPerson.department || '').trim();
            const oldRole = (existingPerson.role || '').trim();
            
            const newName = (updatedPerson.name || '').trim();
            const newDept = (updatedPerson.department || '').trim();
            const newRole = (updatedPerson.role || '').trim();
            
            const wasLeader = oldRole.toLowerCase().includes('department leader');
            const isLeader = newRole.toLowerCase().includes('department leader');
            
            if (wasLeader && !isLeader) {
                // Role changed away from Department Leader — clear from any departments they led
                if (oldName) {
                    await Department.updateMany(
                        { deptLeader: { $regex: new RegExp(`^${oldName}$`, 'i') } },
                        { $set: { deptLeader: '' } }
                    );
                }
            } else if (isLeader) {
                // If they are/become a leader, update the departments
                
                // 1. If name or department changed, clear old assignment from oldDept
                if (oldDept && (oldDept.toLowerCase() !== newDept.toLowerCase() || oldName.toLowerCase() !== newName.toLowerCase())) {
                    await Department.updateOne(
                        { 
                            name: { $regex: new RegExp(`^${oldDept}$`, 'i') },
                            deptLeader: { $regex: new RegExp(`^${oldName}$`, 'i') }
                        },
                        { $set: { deptLeader: '' } }
                    );
                }
                
                // 2. Set them as leader of the new department
                if (newDept) {
                    await Department.updateOne(
                        { name: { $regex: new RegExp(`^${newDept}$`, 'i') } },
                        { $set: { deptLeader: newName } }
                    );
                }
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
        
        const targetRole = getNormalizedRole(person.role);
        const targetLevel = ROLE_LEVELS[targetRole] || 0;
        
        if (creatorLevel <= targetLevel) {
            return res.status(403).json({ error: 'Access Denied. You cannot remove someone of equal or higher rank.' });
        }

        await Personal.findByIdAndDelete(req.params.id);

        // Also delete their User login account if it exists
        const User = require('../models/User');
        await User.findOneAndDelete({ email: person.email?.toLowerCase() });

        // ── Sync: clear this person as dept leader from any department ────────
        await Department.updateMany(
            { deptLeader: { $regex: new RegExp(`^${(person.name || '').trim()}$`, 'i') } },
            { $set: { deptLeader: '' } }
        );

        res.json({ message: 'Personal deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
