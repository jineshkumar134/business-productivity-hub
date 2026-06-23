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

    // ── Auto-migrate old roles (admin→owner, staff→employee) ─────────────────
    try {
        const User = require('./models/User');
        const adminMigrated = await User.updateMany({ role: 'admin' }, { $set: { role: 'owner' } });
        const staffMigrated = await User.updateMany({ role: 'staff' }, { $set: { role: 'employee' } });
        if (adminMigrated.modifiedCount > 0 || staffMigrated.modifiedCount > 0) {
            console.log(`🔄 Role migration: ${adminMigrated.modifiedCount} admin→owner, ${staffMigrated.modifiedCount} staff→employee`);
        }
    } catch (err) {
        console.warn('⚠️  Role migration skipped:', err.message);
    }

    // ── Start Server ONLY after DB is connected ───────────────────────────────
    app.listen(PORT, () => {
        console.log(`🚀 Business Hub Running on http://localhost:${PORT}`);
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
