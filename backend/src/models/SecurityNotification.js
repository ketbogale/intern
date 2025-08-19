const mongoose = require('mongoose');

const securityNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['failed_login', 'unusual_access', 'password_reset', 'account_locked']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    userId: String,
    username: String,
    ipAddress: String,
    userAgent: String,
    attemptCount: Number,
    location: String,
    timestamp: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for efficient querying
securityNotificationSchema.index({ type: 1, createdAt: -1 });
securityNotificationSchema.index({ isRead: 1, isDismissed: 1 });
securityNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SecurityNotification', securityNotificationSchema);
