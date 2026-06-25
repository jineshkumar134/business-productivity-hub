const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Log = require('../models/Log');
const Department = require('../models/Department');
const { ROLE_LEVELS } = require('../middleware/roleCheck');

// ── Helper: role-based task filter ──────────────────────────────────────────
async function filterTasksForUser(tasks, role, userName, userDivision, userDepartment) {
    if (role === 'admin') {
        return tasks; // see everything
    }
    if (role === 'division_head') {
        // Get all departments in this division
        const divisionDepts = await Department.find({ division: userDivision });
        const divisionDeptNames = divisionDepts.map(d => d.name);
        // Show tasks that match by division OR by department being in this division
        return tasks.filter(t =>
            t.division === userDivision ||
            divisionDeptNames.includes(t.department)
        );
    }
    if (role === 'dept_leader') {
        return tasks.filter(t => t.department === userDepartment);
    }
    if (role === 'employee') {
        // Check if the department has employee visibility enabled
        const dept = await Department.findOne({ name: userDepartment });
        const visibilityOn = dept?.employeeVisibility || false;

        if (visibilityOn) {
            // Employee sees all tasks in their department
            return tasks.filter(t => t.department === userDepartment);
        } else {
            // Employee only sees tasks assigned to them
            return tasks.filter(t =>
                (t.responsible && t.responsible.some(r => r.trim().toLowerCase() === userName.trim().toLowerCase())) ||
                (t.requested_by && t.requested_by.trim().toLowerCase() === userName.trim().toLowerCase())
            );
        }
    }
    return tasks;
}

// GET tasks — role-filtered
router.get('/', async (req, res) => {
    try {
        const role         = req.headers['x-user-role']       || 'employee';
        const userName     = req.headers['x-user-name']       || '';
        const userDivision = req.headers['x-user-division']   || '';
        const userDept     = req.headers['x-user-department'] || '';

        const allTasks = await Task.find({}).sort({ createdAt: -1 });
        const filtered = await filterTasksForUser(allTasks, role, userName, userDivision, userDept);
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
