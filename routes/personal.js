const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');

// Get all personal
router.get('/', async (req, res) => {
    try {
        const personalList = await Personal.find({});
        res.json(personalList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create personal
router.post('/', async (req, res) => {
    try {
        const newPerson = new Personal(req.body);
        await newPerson.save();
        res.status(201).json(newPerson);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update personal
router.put('/:id', async (req, res) => {
    try {
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

// Delete personal
router.delete('/:id', async (req, res) => {
    try {
        const person = await Personal.findByIdAndDelete(req.params.id);
        if (person) {
            res.json({ message: 'Personal deleted' });
        } else {
            res.status(404).json({ message: 'Personal not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
