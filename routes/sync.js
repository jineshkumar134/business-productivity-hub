const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Personal = require('../models/Personal');
const Log = require('../models/Log');
const Document = require('../models/Document');
const Department = require('../models/Department');
const DeptStage = require('../models/DeptStage');

router.get('/', async (req, res) => {
    try {
        const role         = req.headers['x-user-role']       || 'employee';
        const userName     = req.headers['x-user-name']       || '';
        const userEmail    = req.headers['x-user-email']      || '';
        const userDept     = req.headers['x-user-department'] || '';
        const companyId    = req.headers['x-company-id']      || req.query.companyId || null;

        const baseQuery = companyId ? { companyId } : {};

        // Fetch everything in parallel
        const [allTasks, allPersonal, allDepartments, logs, documents, deptStages] = await Promise.all([
            Task.find(baseQuery).sort({ createdAt: -1 }),
            Personal.find(baseQuery),
            Department.find(baseQuery).sort({ createdAt: 1 }),
            Log.find({}).sort({ timestamp: -1 }).limit(100),
            Document.find({}, { data: 0 }),
            companyId ? DeptStage.find({ companyId }) : Promise.resolve([])
        ]);

        // 1. Filter Tasks
        let filteredTasks = allTasks;
        if (role !== 'admin') {
            let dept = userDept;
            if (!dept && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) dept = me.department || '';
            }
            const cleanDept = (dept || '').trim().toLowerCase();

            if (role === 'dept_leader') {
                filteredTasks = allTasks.filter(t => {
                    const tDept = (t.department || '').trim().toLowerCase();
                    return tDept && tDept === cleanDept;
                });
            } else {
                // Employee
                let visibilityOn = false;
                if (cleanDept) {
                    const deptObj = allDepartments.find(d => d.name && d.name.trim().toLowerCase() === cleanDept);
                    visibilityOn = deptObj?.employeeVisibility || false;
                }
                filteredTasks = allTasks.filter(t => {
                    const nameMatch = t.responsible && t.responsible.some(r => r.trim().toLowerCase() === userName.trim().toLowerCase());
                    const reqByMatch = t.requested_by && t.requested_by.trim().toLowerCase() === userName.trim().toLowerCase();
                    if (nameMatch || reqByMatch) {
                        if (!cleanDept) return true;
                        const tDept = (t.department || '').trim().toLowerCase();
                        return !tDept || tDept === cleanDept;
                    }
                    return false;
                });
            }
        }

        // 2. Filter Personal
        let filteredPersonal = allPersonal;
        if (role === 'dept_leader') {
            let dept = userDept;
            if (!dept && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) dept = me.department || '';
            }
            if (!dept) {
                const mePerson = allPersonal.find(p => 
                    p.name.trim().toLowerCase() === userName.trim().toLowerCase() && 
                    /department leader/i.test(p.role)
                );
                if (mePerson) dept = mePerson.department || '';
            }
            const cleanDept = (dept || '').trim().toLowerCase();
            if (!cleanDept) {
                filteredPersonal = [];
            } else {
                filteredPersonal = allPersonal.filter(p => p.department && p.department.trim().toLowerCase() === cleanDept);
            }
        } else if (role === 'employee') {
            filteredPersonal = allPersonal.filter(p => p.name.trim().toLowerCase() === userName.trim().toLowerCase());
        }

        // 3. Filter Departments
        let filteredDepartments = allDepartments;
        if (role !== 'admin') {
            let dept = userDept;
            if (!dept && userEmail) {
                const User = require('../models/User');
                const me = await User.findOne({ email: userEmail.toLowerCase() });
                if (me) dept = me.department || '';
            }
            if (!dept) {
                const mePerson = allPersonal.find(p => 
                    p.name.trim().toLowerCase() === userName.trim().toLowerCase() && 
                    /department leader/i.test(p.role)
                );
                if (mePerson) dept = mePerson.department || '';
            }
            const cleanDept = (dept || '').trim().toLowerCase();
            if (!cleanDept) {
                filteredDepartments = [];
            } else {
                filteredDepartments = allDepartments.filter(d => d.name && d.name.trim().toLowerCase() === cleanDept);
            }
        }

        // Validate department leaders in UI
        const leaderNames = [...new Set(filteredDepartments.map(d => d.deptLeader || '').filter(Boolean))];
        const validLeaders = new Set();
        if (leaderNames.length > 0) {
            allPersonal.forEach(p => {
                if (p.name && /department leader/i.test(p.role)) {
                    validLeaders.add(p.name.trim().toLowerCase());
                }
            });
        }
        const deptObjects = filteredDepartments.map(d => {
            const obj = d.toObject();
            if (obj.deptLeader && !validLeaders.has(obj.deptLeader.trim().toLowerCase())) {
                obj.deptLeader = '';
            }
            return obj;
        });

        res.json({
            tasks: filteredTasks,
            personal: filteredPersonal,
            logs: logs,
            documents: documents,
            deptObjects: deptObjects,
            deptStages: deptStages
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
