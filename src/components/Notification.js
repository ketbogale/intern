import React, { useState, useEffect, useRef } from 'react';
import './Notification.css';

const Notification = ({ 
  lowAttendanceAlert, 
  mealWindows, 
  mealWindowStatus,
  lastUpdated, 
  refreshMessage,
  newStudentRegistrations = [],
  notifications: externalNotifications = [],
  onMarkAsRead,
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate notifications based on props
  useEffect(() => {
    const newNotifications = [...externalNotifications];
    const currentTime = new Date();

    // Low Attendance Alerts
    if (lowAttendanceAlert) {
      newNotifications.push({
        id: 'low-attendance',
        type: 'alert',
        icon: '🚨',
        title: 'Low Attendance Alert',
        message: `Attendance is ${lowAttendanceAlert.percentage}% - below ${lowAttendanceAlert.threshold}% threshold`,
        timestamp: new Date(),
        priority: 'high',
        read: false
      });
    }

    // Remove duplicate meal window notifications - handled by mealWindows logic below

    // Meal Window Reminders - only process if meal windows are loaded
    if (Object.keys(mealWindows).length > 0) {
      Object.entries(mealWindows).forEach(([mealType, window]) => {
        if (!window.enabled) return;

        const [startHour, startMinute] = window.startTime.split(':').map(Number);
        const [endHour, endMinute] = window.endTime.split(':').map(Number);
        
        const startTime = new Date();
        startTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date();
        endTime.setHours(endHour, endMinute, 0, 0);

        // Check if meal window is starting soon (30 minutes before)
        const timeUntilStart = startTime - currentTime;
        if (timeUntilStart > 0 && timeUntilStart <= 30 * 60 * 1000) {
          newNotifications.push({
            id: `meal-start-${mealType}`,
            type: 'reminder',
            icon: '⏰',
            title: 'Meal Window Opening',
            message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} window opens in ${Math.ceil(timeUntilStart / (60 * 1000))} minutes`,
            timestamp: new Date(),
            priority: 'medium',
            read: false
          });
        }

        // Check if meal window is ending soon (15 minutes before end)
        const timeUntilEnd = endTime - currentTime;
        if (timeUntilEnd > 0 && timeUntilEnd <= 15 * 60 * 1000 && currentTime >= startTime) {
          newNotifications.push({
            id: `meal-end-${mealType}`,
            type: 'reminder',
            icon: '⏰',
            title: 'Meal Window Closing',
            message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} window closes in ${Math.ceil(timeUntilEnd / (60 * 1000))} minutes`,
            timestamp: new Date(),
            priority: 'high',
            read: false
          });
        }
      });
    }

    // Data Sync Updates
    if (refreshMessage && refreshMessage.includes('✅')) {
      newNotifications.push({
        id: 'data-sync',
        type: 'update',
        icon: '🔄',
        title: 'Data Sync Complete',
        message: `Dashboard data refreshed at ${lastUpdated}`,
        timestamp: new Date(),
        priority: 'low',
        read: false
      });
    }

    // New Student Registrations
    newStudentRegistrations.forEach((student, index) => {
      newNotifications.push({
        id: `new-student-${student.id || index}`,
        type: 'info',
        icon: '👥',
        title: 'New Student Registered',
        message: `${student.name} (${student.id}) has been added to the system`,
        timestamp: student.registeredAt || new Date(),
        priority: 'medium',
        read: false
      });
    });

    // Sort by priority and timestamp
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    newNotifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  }, [lowAttendanceAlert, mealWindows, refreshMessage, lastUpdated, newStudentRegistrations, externalNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'notification-high';
      case 'medium': return 'notification-medium';
      case 'low': return 'notification-low';
      default: return '';
    }
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">🔕</span>
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getPriorityClass(notification.priority)} ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-timestamp">
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className="notification-footer">
              <button className="view-all-btn">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;
