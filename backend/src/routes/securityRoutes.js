const express = require('express');
const router = express.Router();
const {
  getSecurityNotifications,
  markAsRead,
  dismissNotification,
  markAllAsRead
} = require('../controllers/securityController');
const {
  createTestNotifications,
  clearAllNotifications
} = require('../controllers/testSecurityController');

// Get security notifications with filtering
router.get('/notifications', getSecurityNotifications);

// Mark specific notification as read
router.patch('/notifications/:notificationId/read', markAsRead);

// Dismiss specific notification
router.patch('/notifications/:notificationId/dismiss', dismissNotification);

// Mark all notifications as read
router.patch('/notifications/mark-all-read', markAllAsRead);

// Test routes for development
router.post('/test/create-notifications', createTestNotifications);
router.delete('/test/clear-notifications', clearAllNotifications);

module.exports = router;
