const express  = require('express');
const router   = express.Router();
const DeptStage = require('../models/DeptStage');
const { requireMinRole } = require('../middleware/roleCheck');

const DEFAULT_COLORS = ['#6366f1','#0ea5e9','#10b981','#f97316','#8b5cf6','#ec4899','#f59e0b'];

// GET stages for a department
router.get('/:deptId', async (req, res) => {
    try {
        const { companyId } = req.query;
        const query = { departmentId: req.params.deptId };
        if (companyId) query.companyId = companyId;
        const doc = await DeptStage.findOne(query);
        res.json(doc ? doc.stages : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT save/replace all stages for a department — dept_leader and above
router.put('/:deptId', requireMinRole('dept_leader'), async (req, res) => {
    try {
        const { stages, companyId } = req.body;
        if (!companyId) return res.status(400).json({ error: 'companyId is required' });

        const sanitized = (stages || []).map((s, i) => ({
            order:       i + 1,
            title:       (s.title || '').trim(),
            description: s.description || '',
            color:       s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        })).filter(s => s.title);

        const doc = await DeptStage.findOneAndUpdate(
            { companyId, departmentId: req.params.deptId },
            { $set: { stages: sanitized } },
            { upsert: true, new: true }
        );
        res.json(doc.stages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
