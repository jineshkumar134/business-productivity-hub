const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Log = require('../models/Log');
const Department = require('../models/Department');
const { ROLE_LEVELS } = require('../middleware/roleCheck');

// ── Helper: role-based task filter ──────────────────────────────────────────
async function filterTasksForUser(tasks, role, userName, userDivision, userDepartment, userEmail) {
    if (role === 'admin') {
        return tasks; // see everything
    }
    if (role === 'division_head') {
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
        if (!cleanDiv) return [];

        const divisionDepts = await Department.find({
            division: { $regex: new RegExp(`^${cleanDiv}$`, 'i') }
        });
        const divisionDeptNames = divisionDepts.map(d => d.name.trim().toLowerCase());

        return tasks.filter(t => {
            const tDiv = (t.division || '').trim().toLowerCase();
            const tDept = (t.department || '').trim().toLowerCase();
            return tDiv === cleanDiv || (tDept && divisionDeptNames.includes(tDept));
        });
    }
    if (role === 'dept_leader') {
        let dept = userDepartment;
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
        if (!cleanDept) return [];

        return tasks.filter(t => t.department && t.department.trim().toLowerCase() === cleanDept);
    }
    if (role === 'employee') {
        let dept = userDepartment;
        if (!dept && userEmail) {
            const User = require('../models/User');
            const me = await User.findOne({ email: userEmail.toLowerCase() });
            if (me) dept = me.department || '';
        }

        const cleanDept = (dept || '').trim().toLowerCase();
        
        let visibilityOn = false;
        if (cleanDept) {
            const deptObj = await Department.findOne({
                name: { $regex: new RegExp(`^${cleanDept}$`, 'i') }
            });
            visibilityOn = deptObj?.employeeVisibility || false;
        }

        if (visibilityOn) {
            return tasks.filter(t => t.department && t.department.trim().toLowerCase() === cleanDept);
        } else {
            return tasks.filter(t => {
                const nameMatch = t.responsible && t.responsible.some(r => r.trim().toLowerCase() === userName.trim().toLowerCase());
                const reqByMatch = t.requested_by && t.requested_by.trim().toLowerCase() === userName.trim().toLowerCase();
                // If name matches, also ensure department matches to avoid cross-department same-name collision
                if (nameMatch || reqByMatch) {
                    if (!cleanDept) return true; // no dept info — show task
                    const tDept = (t.department || '').trim().toLowerCase();
                    return !tDept || tDept === cleanDept; // task dept matches user dept
                }
                return false;
            });
        }
    }
    return tasks;
}

// GET tasks — role-filtered
router.get('/', async (req, res) => {
    try {
        const role         = req.headers['x-user-role']       || 'employee';
        const userName     = req.headers['x-user-name']       || '';
        const userEmail    = req.headers['x-user-email']      || '';
        const userDivision = req.headers['x-user-division']   || '';
        const userDept     = req.headers['x-user-department'] || '';

        const allTasks = await Task.find({}).sort({ createdAt: -1 });
        const filtered = await filterTasksForUser(allTasks, role, userName, userDivision, userDept, userEmail);
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create task — all roles allowed
router.post('/', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        if (newTask.department) {
            const dept = await Department.findOne({ name: newTask.department });
            if (dept) {
                newTask.division = dept.division || '';
            }
        }
        await newTask.save();

        await Log.create({
            action: 'Created',
            task_name: newTask.task_name,
            task_description: newTask.description,
            department: newTask.department,
            responsible: newTask.responsible,
            due_date: newTask.due_date,
            requested_by: newTask.requested_by,
            description: `Task "${newTask.task_name}" created in ${newTask.department}`
        });

        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update task — role-based field restrictions
router.put('/:id', async (req, res) => {
    try {
        const role = req.headers['x-user-role'] || 'employee';
        let updateData = req.body;

        // Admin can update anything
        if (role !== 'admin') {
            const existingTask = await Task.findById(req.params.id);
            if (!existingTask) return res.status(404).json({ error: 'Task not found' });

            if (existingTask.is_locked) {
                return res.status(403).json({ error: 'Task is locked. Only Admin can edit it.' });
            }

            // Non-admin can only update progress fields
            updateData = {
                status:         req.body.status         !== undefined ? req.body.status         : existingTask.status,
                progress:       req.body.progress       !== undefined ? req.body.progress       : existingTask.progress,
                completed_date: req.body.completed_date !== undefined ? req.body.completed_date : existingTask.completed_date,
                delay_reason:   req.body.delay_reason   !== undefined ? req.body.delay_reason   : existingTask.delay_reason
            };
        }

        if (updateData.department) {
            const dept = await Department.findOne({ name: updateData.department });
            if (dept) {
                updateData.division = dept.division || '';
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (updatedTask) {
            await Log.create({
                action: updatedTask.status === 'Completed' ? 'Completed' : 'Updated',
                task_name: updatedTask.task_name,
                task_description: updatedTask.description,
                department: updatedTask.department,
                responsible: updatedTask.responsible,
                due_date: updatedTask.due_date,
                completed_date: updatedTask.completed_date,
                delay_reason: updatedTask.delay_reason,
                requested_by: updatedTask.requested_by,
                description: `Task "${updatedTask.task_name}" → ${updatedTask.status} (${updatedTask.progress}%)`
            });
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE task — admin and above
router.delete('/:id', async (req, res) => {
    const role = req.headers['x-user-role'] || 'employee';
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await Task.findByIdAndDelete(req.params.id);
        await Log.create({
            action: 'Deleted',
            task_name: task.task_name || 'Unknown',
            department: task.department || 'Unknown',
            responsible: task.responsible || [],
            description: `Task "${task.task_name}" was deleted.`
        });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add comment — all roles
router.post('/:id/comments', async (req, res) => {
    try {
        const { text, author } = req.body;
        if (!text || !author) return res.status(400).json({ error: 'Text and author are required' });

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.comments.push({ text, author, timestamp: new Date() });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
