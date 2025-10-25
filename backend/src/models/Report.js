const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, default: '' },
  department: { type: String, default: '' },
  reason: { type: String, required: true, maxlength: 1000 },
  reporter: { type: String, default: 'attendance_operator' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
