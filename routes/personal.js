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

// Create personal — also auto-creates a login User account
router.post('/', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const newPerson = new Personal(req.body);
        await newPerson.save();

        // Auto-create a User login account if email is provided
        let generatedCredentials = null;
        if (req.body.email) {
            const User = require('../models/User');
            const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
            if (!existingUser) {
                // Generate a random 8-char password
                const crypto = require('crypto');
                const generatedPassword = crypto.randomBytes(4).toString('hex'); // e.g. "a3f1b9c2"

                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email.toLowerCase(),
                    phone: req.body.phone || '0000000000',
                    password: generatedPassword,
                    role: 'staff'
                });
                await newUser.save();

                generatedCredentials = {
                    email: req.body.email.toLowerCase(),
                    password: generatedPassword // plain text — shown once to admin
                };
            }
        }

        const response = newPerson.toObject();
        if (generatedCredentials) {
            response.generatedCredentials = generatedCredentials;
        }
        res.status(201).json(response);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update personal
router.put('/:id', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
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
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
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
