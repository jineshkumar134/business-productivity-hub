const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    action: { type: String },
    task_name: { type: String },
    department: { type: String },
    responsible: [{ type: String }],
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
