const SecurityNotification = require('../models/SecurityNotification');

// Track failed login attempts
const trackFailedLogin = async (req, res, next) => {
  try {
    const { username } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    console.log('Security middleware triggered for login attempt:', { username, ipAddress });

    // Always create a notification for failed login (we'll check if login actually failed in the response)
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      handleLoginResponse.call(this, data, username, ipAddress, userAgent);
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      handleLoginResponse.call(this, data, username, ipAddress, userAgent);
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Error in security middleware:', error);
    next();
  }
};

// Handle login response to create notifications
const handleLoginResponse = async function(data, username, ipAddress, userAgent) {
  try {
    // Check if login failed (status 401 or error in response)
    if (this.statusCode === 401 || (data && data.error)) {
      console.log('Failed login detected, creating security notification');
      
      // Count recent failed attempts
      const recentAttempts = await SecurityNotification.countDocuments({
        type: 'failed_login',
        'metadata.username': username,
        'metadata.ipAddress': ipAddress,
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      });

      const attemptCount = recentAttempts + 1;
      let severity = 'low';
      let title = 'Failed Login Attempt';
      let message = `Failed login attempt for user "${username}" from IP ${ipAddress}`;

      if (attemptCount >= 5) {
        severity = 'critical';
        title = 'Multiple Failed Login Attempts';
        message = `${attemptCount} failed login attempts detected for user "${username}" from IP ${ipAddress}`;
      } else if (attemptCount >= 3) {
        severity = 'high';
        title = 'Suspicious Login Activity';
        message = `${attemptCount} failed login attempts for user "${username}"`;
      }

      await SecurityNotification.create({
        type: 'failed_login',
        severity,
        title,
        message,
        metadata: {
          username,
          ipAddress,
          userAgent,
          attemptCount,
          timestamp: new Date()
        }
      });

      console.log('Security notification created successfully');
    }
  } catch (error) {
    console.error('Error creating security notification:', error);
  }
};

// Detect unusual access patterns
const detectUnusualAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!userId) return next();

    // Check for access from new IP address
    const recentLogins = await SecurityNotification.find({
      type: 'unusual_access',
      'metadata.userId': userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const knownIPs = recentLogins.map(login => login.metadata.ipAddress);
    
    if (!knownIPs.includes(ipAddress)) {
      await SecurityNotification.create({
        type: 'unusual_access',
        severity: 'medium',
        title: 'New Location Access',
        message: `Login detected from new IP address: ${ipAddress}`,
        metadata: {
          userId,
          ipAddress,
          userAgent,
          location: 'Unknown', // Could integrate with IP geolocation service
          timestamp: new Date()
        }
      });
    }

    // Check for unusual time access (outside normal hours)
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      await SecurityNotification.create({
        type: 'unusual_access',
        severity: 'low',
        title: 'Off-Hours Access',
        message: `System accessed at unusual time: ${new Date().toLocaleTimeString()}`,
        metadata: {
          userId,
          ipAddress,
          timestamp: new Date()
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error detecting unusual access:', error);
    next();
  }
};

// Track password reset requests
const trackPasswordReset = async (username, ipAddress, userAgent) => {
  try {
    await SecurityNotification.create({
      type: 'password_reset',
      severity: 'medium',
      title: 'Password Reset Requested',
      message: `Password reset requested for user "${username}"`,
      metadata: {
        username,
        ipAddress,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error tracking password reset:', error);
  }
};

// Get security notifications
const getSecurityNotifications = async (req, res) => {
  try {
    const { type, severity, isRead, limit = 50 } = req.query;
    
    const filter = { isDismissed: false };
    
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await SecurityNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching security notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await SecurityNotification.findByIdAndUpdate(notificationId, {
      isRead: true
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Dismiss notification
const dismissNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await SecurityNotification.findByIdAndUpdate(notificationId, {
      isDismissed: true
    });

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error dismissing notification',
      error: error.message
    });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await SecurityNotification.updateMany(
      { isRead: false, isDismissed: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

module.exports = {
  trackFailedLogin,
  detectUnusualAccess,
  trackPasswordReset,
  getSecurityNotifications,
  markAsRead,
  dismissNotification,
  markAllAsRead
};
