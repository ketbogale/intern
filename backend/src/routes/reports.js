const express = require('express');
const Report = require('../models/Report');
const Student = require('../models/student');
const router = express.Router();

// Simple auth middleware (reuse session)
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

// Create a report (from Attendance page). No auth to allow scanner operators without dashboard login.
router.post('/reports', async (req, res) => {
  try {
    let { studentId, studentName, department, reason, reporter } = req.body || {};
    studentId = (studentId || '').toString().trim();
    reason = (reason || '').toString().trim();
    console.log('[Reports] POST /api/reports received', { studentId, hasReason: !!reason, reporter });
    if (!studentId || !reason) {
      return res.status(400).json({ success: false, message: 'studentId and reason are required' });
    }

    // Ensure the student exists; hydrate name/department from DB so report is tied to a real student
    const studentDoc = await Student.findOne({ id: studentId }).lean();
    if (!studentDoc) {
      console.log('[Reports] Student not found for report', { studentId });
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    // Override provided fields with authoritative values
    studentName = studentDoc.name || studentName || '';
    department = studentDoc.department || department || '';

    const report = new Report({
      studentId,
      studentName,
      department,
      reason: reason.slice(0, 1000),
      reporter: reporter || 'attendance_operator',
      status: 'open'
    });

    const saved = await report.save();
    console.log('[Reports] Report created', { id: saved._id, studentId: saved.studentId });
    return res.json({ success: true, report: saved });
  } catch (err) {
    console.error('[Reports] Error creating report', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List reports (admin only)
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ['open','resolved'].includes(status)) query.status = status;
    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(500);
    console.log('[Reports] GET /api/reports', { status: status || 'all', count: reports.length });
    return res.json({ success: true, reports });
  } catch (err) {
    console.error('[Reports] Error listing reports', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark report resolved (admin only)
router.patch('/reports/:id/resolve', requireAuth, async (req, res) => {
  try {
    console.log('[Reports] PATCH /api/reports/:id/resolve', { id: req.params.id });
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    if (!report) {
      console.log('[Reports] Resolve failed - not found', { id: req.params.id });
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    console.log('[Reports] Report resolved', { id: report._id });
    return res.json({ success: true, report });
  } catch (err) {
    console.error('[Reports] Error resolving report', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
