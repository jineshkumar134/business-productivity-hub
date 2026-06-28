const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    task_name:      { type: String, required: true },
    department:     { type: String, required: true },
    division:       { type: String, default: '' },
    companyId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    currentStage:   { type: String, default: '' },    // Custom stage title
    priority:       { type: String, default: 'Medium' },
    status:         { type: String, default: 'Not Started' },
    progress:       { type: Number, default: 0 },
    due_date:       { type: String, required: true },
    completed_date: { type: String },
    delay_reason:   { type: String },
    description:    { type: String, required: true },
    responsible:    [{ type: String }],
    requested_by:   { type: String },
    is_locked:      { type: Boolean, default: false },
    comments: [{
        text:      String,
        author:    String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
