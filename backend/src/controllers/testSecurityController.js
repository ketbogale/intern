const SecurityNotification = require('../models/SecurityNotification');

// Create test security notifications
const createTestNotifications = async (req, res) => {
  try {
    // Create sample notifications for testing
    const testNotifications = [
      {
        type: 'failed_login',
        severity: 'critical',
        title: 'Multiple Failed Login Attempts',
        message: '6 failed login attempts detected for user "admin" from IP 192.168.1.100',
        metadata: {
          username: 'admin',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          attemptCount: 6,
          timestamp: new Date()
        }
      },
      {
        type: 'unusual_access',
        severity: 'medium',
        title: 'New Location Access',
        message: 'Login detected from new IP address: 203.45.67.89',
        metadata: {
          userId: '507f1f77bcf86cd799439011',
          ipAddress: '203.45.67.89',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
          location: 'Unknown',
          timestamp: new Date()
        }
      },
      {
        type: 'password_reset',
        severity: 'low',
        title: 'Password Reset Requested',
        message: 'Password reset requested for user "john_doe"',
        metadata: {
          username: 'john_doe',
          ipAddress: '192.168.1.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date()
        }
      },
      {
        type: 'unusual_access',
        severity: 'low',
        title: 'Off-Hours Access',
        message: 'System accessed at unusual time: 2:30 AM',
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          ipAddress: '192.168.1.25',
          timestamp: new Date()
        }
      }
    ];

    // Insert test notifications
    const createdNotifications = await SecurityNotification.insertMany(testNotifications);

    res.json({
      success: true,
      message: `Created ${createdNotifications.length} test security notifications`,
      notifications: createdNotifications
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test notifications',
      error: error.message
    });
  }
};

// Clear all security notifications
const clearAllNotifications = async (req, res) => {
  try {
    const result = await SecurityNotification.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} security notifications`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
};

module.exports = {
  createTestNotifications,
  clearAllNotifications
};
