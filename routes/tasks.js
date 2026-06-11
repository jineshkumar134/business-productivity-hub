const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Log = require('../models/Log');

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({});
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        
        // Log action
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

// Update task
router.put('/:id', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role'] || 'staff';
        let updateData = req.body;
        
        if (userRole !== 'admin') {
            const existingTask = await Task.findById(req.params.id);
            if (!existingTask) {
                return res.status(404).json({ error: 'Task not found' });
            }
            if (existingTask.is_locked) {
                return res.status(403).json({ error: 'Task is locked. Only admins can edit it.' });
            }
            updateData = {
                status: req.body.status !== undefined ? req.body.status : existingTask.status,
                progress: req.body.progress !== undefined ? req.body.progress : existingTask.progress,
                completed_date: req.body.completed_date !== undefined ? req.body.completed_date : existingTask.completed_date,
                delay_reason: req.body.delay_reason !== undefined ? req.body.delay_reason : existingTask.delay_reason
            };
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
                description: `Task "${updatedTask.task_name}" status: ${updatedTask.status} (${updatedTask.progress}%)${updatedTask.is_locked ? ' [Locked]' : ''}`
            });
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
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
            description: `Task was deleted from the system.`
        });
        
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Add comment to task
router.post('/:id/comments', async (req, res) => {
    try {
        const { text, author } = req.body;
        if (!text || !author) {
            return res.status(400).json({ error: 'Text and author are required' });
        }
        
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
