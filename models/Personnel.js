const mongoose = require('mongoose');

const PersonnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  responsibility: { type: String },
  email: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Personnel', PersonnelSchema);
