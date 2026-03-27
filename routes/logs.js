const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Get all logs
router.get('/', async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear all logs
router.delete('/', async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'All logs cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
