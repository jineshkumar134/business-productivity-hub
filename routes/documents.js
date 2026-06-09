const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Log = require('../models/Log');

// Get all documents (exclude data field for performance)
router.get('/', async (req, res) => {
    try {
        const documents = await Document.find({}, { data: 0 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single document (include data for downloading)
router.get('/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload document
router.post('/', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const newDoc = new Document(req.body);
        await newDoc.save();

        // Audit Log
        await Log.create({
            action: 'Document Uploaded',
            task_name: newDoc.name,
            department: newDoc.category,
            description: `Document "${newDoc.name}" (${newDoc.category}) was uploaded by ${newDoc.uploadedBy || 'User'}`
        });

        res.status(201).json({
            message: 'Document uploaded successfully!',
            document: { id: newDoc._id, name: newDoc.name, category: newDoc.category, size: newDoc.size }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete document
router.delete('/:id', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        await Document.findByIdAndDelete(req.params.id);

        // Audit Log
        await Log.create({
            action: 'Document Deleted',
            task_name: doc.name,
            department: doc.category,
            description: `Document "${doc.name}" was deleted from the system.`
        });

        res.json({ message: 'Document deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
