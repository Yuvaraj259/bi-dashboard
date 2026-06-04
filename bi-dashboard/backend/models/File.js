const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: String,
  storedName: String,
  size: Number,
  columns: [String],
  summary: mongoose.Schema.Types.Mixed,
  rows: [mongoose.Schema.Types.Mixed],
  totalRows: Number,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);
