const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected exclusively to MongoDB Cloud for Deployment!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const taskRoutes = require('./routes/tasks');
const personalRoutes = require('./routes/personal');
const logRoutes = require('./routes/logs');

app.use('/api/tasks', taskRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/logs', logRoutes);

// Catch-all route to serve the SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Business Hub Running on http://localhost:${PORT}`);
});
