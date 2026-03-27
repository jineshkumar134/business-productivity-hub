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
            department: newTask.department,
            responsible: newTask.responsible,
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
        const titleChange = req.body.task_name && req.body.status;
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (updatedTask) {
            await Log.create({
                action: 'Updated',
                task_name: updatedTask.task_name,
                department: updatedTask.department,
                responsible: updatedTask.responsible,
                description: `Task "${updatedTask.task_name}" updated to ${updatedTask.status} (${updatedTask.progress}%)`
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

module.exports = router;
