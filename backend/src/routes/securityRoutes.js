const express = require('express');
const router = express.Router();
const {
  getSecurityNotifications,
  markAsRead,
  dismissNotification,
  markAllAsRead
} = require('../controllers/securityController');

// Get security notifications with filtering
router.get('/notifications', getSecurityNotifications);

// Mark specific notification as read
router.patch('/notifications/:notificationId/read', markAsRead);

// Dismiss specific notification
router.patch('/notifications/:notificationId/dismiss', dismissNotification);

// Mark all notifications as read
router.patch('/notifications/mark-all-read', markAllAsRead);

module.exports = router;
