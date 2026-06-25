const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas!');

    // ── Auto-migrate old roles (owner→admin, staff→employee) ─────────────────
    try {
        const User = require('./models/User');
        const ownerMigrated = await User.updateMany({ role: 'owner' }, { $set: { role: 'admin' } });
        const staffMigrated = await User.updateMany({ role: 'staff' }, { $set: { role: 'employee' } });
        if (ownerMigrated.modifiedCount > 0 || staffMigrated.modifiedCount > 0) {
            console.log(`🔄 Role migration: ${ownerMigrated.modifiedCount} owner→admin, ${staffMigrated.modifiedCount} staff→employee`);
        }
    } catch (err) {
        console.warn('⚠️  Role migration skipped:', err.message);
    }

    // ── Auto-migrate division fields: sync from Department → Personal, Task, User ─
    try {
        const User     = require('./models/User');
        const Personal = require('./models/Personal');
        const Task     = require('./models/Task');
        const Department = require('./models/Department');

        // Build a map: departmentName → division
        const depts = await Department.find({ division: { $exists: true, $ne: '' } });
        const divMap = {};
        depts.forEach(d => { if (d.name && d.division) divMap[d.name] = d.division; });

        let personFixed = 0, taskFixed = 0, userFixed = 0;

        // Fix Personal records with missing division but matching department
        for (const [deptName, divName] of Object.entries(divMap)) {
            const pRes = await Personal.updateMany(
                { department: deptName, $or: [{ division: '' }, { division: null }, { division: { $exists: false } }] },
                { $set: { division: divName } }
            );
            personFixed += pRes.modifiedCount;

            const tRes = await Task.updateMany(
                { department: deptName, $or: [{ division: '' }, { division: null }, { division: { $exists: false } }] },
                { $set: { division: divName } }
            );
            taskFixed += tRes.modifiedCount;

            const uRes = await User.updateMany(
                { department: deptName, $or: [{ division: '' }, { division: null }, { division: { $exists: false } }] },
                { $set: { division: divName } }
            );
            userFixed += uRes.modifiedCount;
        }

        if (personFixed + taskFixed + userFixed > 0) {
            console.log(`🔄 Division sync: ${personFixed} personal, ${taskFixed} tasks, ${userFixed} users updated`);
        } else {
            console.log('✅ Division fields already in sync.');
        }
    } catch (err) {
        console.warn('⚠️  Division sync migration skipped:', err.message);
    }

    // ── Start Server ONLY after DB is connected ───────────────────────────────
    app.listen(PORT, () => {
        console.log(`🚀 Growth Hub Running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
const taskRoutes       = require('./routes/tasks');
const personalRoutes   = require('./routes/personal');
const logRoutes        = require('./routes/logs');
const authRoutes       = require('./routes/auth');
const aiRoutes         = require('./routes/ai');
const documentRoutes   = require('./routes/documents');
const departmentRoutes = require('./routes/departments');
const divisionRoutes   = require('./routes/divisions');

app.use('/api/tasks',       taskRoutes);
app.use('/api/personal',    personalRoutes);
app.use('/api/logs',        logRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/documents',   documentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/divisions',   divisionRoutes);

// ── Catch-all → SPA ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
