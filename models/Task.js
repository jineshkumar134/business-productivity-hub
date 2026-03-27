const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    task_name: { type: String, required: true },
    department: { type: String, required: true },
    priority: { type: String, default: 'Medium' },
    status: { type: String, default: 'Not Started' },
    progress: { type: Number, default: 0 },
    due_date: { type: String },
    description: { type: String },
    responsible: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
