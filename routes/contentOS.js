const express = require('express');
const router = express.Router();
const ContentOS = require('../models/ContentOS');

// Middleware to require auth
const requireAuth = (req, res, next) => {
    // Basic role check if needed, but here we just need company context
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    if (!companyId) {
        return res.status(400).json({ error: 'Company ID header or query is required' });
    }
    req.companyId = companyId;
    next();
};

// GET all content entries for a company
router.get('/', requireAuth, async (req, res) => {
    try {
        const entries = await ContentOS.find({ companyId: req.companyId }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST create new content entry
router.post('/', requireAuth, async (req, res) => {
    try {
        const data = { ...req.body, companyId: req.companyId };
        const entry = new ContentOS(data);
        await entry.save();
        res.status(201).json(entry);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// PUT update content entry
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const entry = await ContentOS.findOneAndUpdate(
            { _id: req.params.id, companyId: req.companyId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json(entry);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// DELETE content entry
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const entry = await ContentOS.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
