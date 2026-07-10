const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const mongoose = require('mongoose');

dotenv.config();

const app  = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB Connection (cached for Vercel serverless) ─────────────────────────
// Use a global variable so the connection is reused across warm Vercel invocations
// Without this, each cold start creates a new pool — hitting M0's 500-connection limit
let cachedConn = global._mongoConn || null;

async function connectDB() {
    // If already connected (warm serverless instance), reuse it
    if (cachedConn && mongoose.connection.readyState === 1) return;

    // Prevent duplicate connection attempts on simultaneous cold starts
    mongoose.set('bufferCommands', false);

    await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1,           // ⚡ Serverless: each instance only needs 1 connection
        minPoolSize: 0,           // Don't hold connections open when idle
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        maxIdleTimeMS: 10000,     // Close idle connections after 10s (serverless-safe)
    });

    cachedConn = mongoose.connection;
    global._mongoConn = cachedConn;   // Cache globally across warm invocations
    console.log('✅ Connected to MongoDB Atlas!');

    // ── Auto-migrate old roles (owner→admin, staff→employee) ─────────────────
    try {
        const User = require('./models/User');
        await User.updateMany({ role: 'owner' }, { $set: { role: 'admin' } });
        await User.updateMany({ role: 'staff' }, { $set: { role: 'employee' } });
    } catch (err) {
        console.warn('⚠️  Role migration skipped:', err.message);
    }
}

// ── Connect before handling any request ──────────────────────────────────────
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
        res.status(503).json({ error: 'Database unavailable. Please retry.' });
    }
});

// ── Routes ────────────────────────────────────────────────────────────────────
const taskRoutes       = require('./routes/tasks');
const personalRoutes   = require('./routes/personal');
const logRoutes        = require('./routes/logs');
const authRoutes       = require('./routes/auth');
const aiRoutes         = require('./routes/ai');
const documentRoutes   = require('./routes/documents');
const departmentRoutes = require('./routes/departments');
const companyRoutes    = require('./routes/companies');
const deptStageRoutes  = require('./routes/deptStages');
const syncRoutes       = require('./routes/sync');
const contentOSRoutes  = require('./routes/contentOS');

app.use('/api/tasks',       taskRoutes);
app.use('/api/personal',    personalRoutes);
app.use('/api/logs',        logRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/documents',   documentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/companies',   companyRoutes);
app.use('/api/dept-stages', deptStageRoutes);
app.use('/api/sync',        syncRoutes);
app.use('/api/content-os',  contentOSRoutes);

// ── Catch-all → SPA ───────────────────────────────────────────────────────────
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ── Local dev: start server (Vercel uses module.exports instead) ──────────────
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 5000;
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`🚀 Growth Hub Running on http://localhost:${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            process.exit(1);
        });
}

// ── Export for Vercel serverless ──────────────────────────────────────────────
module.exports = app;
