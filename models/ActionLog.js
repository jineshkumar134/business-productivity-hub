const mongoose = require('mongoose');

const ActionLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'Created', 'Updated'
  task_name: { type: String },
  department: { type: String },
  responsible: [{ type: String }],
  timestamp: { type: Date, default: Date.now },
  description: { type: String }
});

module.exports = mongoose.model('ActionLog', ActionLogSchema);
