const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    action: { type: String },
    task_name: { type: String },
    department: { type: String },
    responsible: [{ type: String }],
    description: { type: String },
    task_description: { type: String },
    due_date: { type: String },
    completed_date: { type: String },
    delay_reason: { type: String },
    requested_by: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
