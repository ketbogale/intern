import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Dashboard.css';
import './Dashboard-light.css';
import './DatabaseReset.css';
import DatabaseResetComponent from './DatabaseResetComponent';
import Notification from './Notification';

const Dashboard = ({ user, onLogout }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    attendancePercentage: 0
  });
  const [lowAttendanceAlert, setLowAttendanceAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [refreshMessage, setRefreshMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  // Student search functionality moved to dedicated SearchStudent component
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Admin approval states (required for all credential updates)
  const [showAdminApproval, setShowAdminApproval] = useState(false);
  const [adminApprovalCode, setAdminApprovalCode] = useState('');
  const [adminApprovalCountdown, setAdminApprovalCountdown] = useState(300); // 5 minutes
  const [resendAdminApprovalCountdown, setResendAdminApprovalCountdown] = useState(0);

  // Email verification states for credential update
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [verificationCountdown, setVerificationCountdown] = useState(300); // 5 minutes
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [resendVerificationCountdown, setResendVerificationCountdown] = useState(0);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  

  const [adminEmail, setAdminEmail] = useState('');
  
  // Create ref for search input
  const searchInputRef = useRef(null);
  
  // Meal Windows state
  const [mealWindows, setMealWindows] = useState({});
  const [mealWindowsLoading, setMealWindowsLoading] = useState(false);
  const [mealWindowsMessage, setMealWindowsMessage] = useState('');
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [newStudentRegistrations, setNewStudentRegistrations] = useState([]);
  
  // Professional dashboard states
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    mealWindows: 'active',
    lastBackup: null,
    uptime: '0h 0m'
  });
  
  // Meal window states
  const [mealWindowStatus, setMealWindowStatus] = useState({
    isOpen: false,
    nextMealTime: null,
    timeUntilOpen: null,
    mealType: 'Dinner'
  });

  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Fetch admin email from database
  const fetchAdminEmail = async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminEmail(data.email || '');
      }
    } catch (error) {
      // Error fetching admin email - fail silently
    }
  };

  // Meal window timing logic
  const checkMealWindow = useCallback(() => {
    // Don't process if meal windows haven't been loaded from database yet
    if (Object.keys(mealWindows).length === 0) {
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let isInMealWindow = false;
    let nextMealType = '';
    let timeUntilOpen = null;
    let nextMealTime = null;
    let currentMeal = '';
    
    // Check each meal window
    Object.entries(mealWindows).forEach(([mealType, config]) => {
      if (!config.enabled) return;
      
      const [startHour, startMinute] = config.startTime.split(':').map(Number);
      const [endHour, endMinute] = config.endTime.split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      // Expand window with before/after buffers
      const windowStart = startTime - config.beforeWindow;
      const windowEnd = endTime + config.afterWindow;
      
      // Check if currently in this meal window
      if (currentTime >= windowStart && currentTime <= windowEnd) {
        isInMealWindow = true;
        currentMeal = mealType;
      }
      
      // Find next meal window if not currently in one
      if (!isInMealWindow) {
        if (currentTime < windowStart) {
          if (!nextMealTime || windowStart < nextMealTime) {
            nextMealType = mealType;
            timeUntilOpen = windowStart - currentTime;
            nextMealTime = windowStart;
          }
        }
      }
    });
    
    // If no next meal found today, check for breakfast tomorrow
    if (!isInMealWindow && !nextMealTime) {
      const breakfastConfig = mealWindows.breakfast;
      if (breakfastConfig && breakfastConfig.enabled) {
        const [startHour, startMinute] = breakfastConfig.startTime.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const windowStart = startTime - breakfastConfig.beforeWindow;
        
        nextMealType = 'breakfast';
        timeUntilOpen = windowStart + (24 * 60) - currentTime;
        nextMealTime = windowStart + (24 * 60);
      }
    }
    
    setMealWindowStatus({
      isOpen: isInMealWindow,
      nextMealTime,
      timeUntilOpen,
      mealType: isInMealWindow ? currentMeal : nextMealType
    });
    
    
    // Notification logic moved to Notification.js to avoid duplicates
  }, [mealWindows]);

  // Fetch meal windows from database
  const fetchMealWindows = async () => {
    try {
      const response = await fetch('/api/meal-windows');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.mealWindows) {
          setMealWindows(data.mealWindows);
        }
      }
    } catch (error) {
      // Error fetching meal windows - fail silently
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAdminEmail();
    fetchMealWindows();
    fetchSystemStatus();
    
    // Check if redirected from email verification link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showEmailVerification') === 'true') {
      const newEmail = urlParams.get('newEmail');
      setShowEmailVerification(true);
      setEmailVerificationMessage(`📧 Enter the 6-digit verification code sent to ${newEmail}`);
      
      // Set pending credentials for email-only change
      setPendingCredentials({
        email: newEmail,
        currentPassword: 'verified', // Mark as already verified via link
        newUsername: null,
        newPassword: null
      });
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Separate useEffect for meal window checking to avoid dependency loops
  useEffect(() => {
    // Initial check
    checkMealWindow();
    
    // Check meal window every minute
    const mealWindowInterval = setInterval(checkMealWindow, 60000);
    
    return () => {
      clearInterval(mealWindowInterval);
    };
  }, [checkMealWindow]);

  // Separate useEffect for system status updates
  useEffect(() => {
    // Update system status every 30 seconds
    const statusInterval = setInterval(fetchSystemStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Focus search input when switching to students section
  useEffect(() => {
    if (activeSection === 'students' && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [activeSection]);


  // Email verification countdown timer
  useEffect(() => {
    let interval;
    if (showEmailVerification && verificationCountdown > 0) {
      interval = setInterval(() => {
        setVerificationCountdown(prev => {
          if (prev <= 1) {
            setEmailVerificationMessage('Verification code expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showEmailVerification, verificationCountdown]);

  // Admin approval countdown timer
  useEffect(() => {
    let interval;
    if (showAdminApproval && adminApprovalCountdown > 0) {
      interval = setInterval(() => {
        setAdminApprovalCountdown(prev => {
          if (prev <= 1) {
            // Admin approval code expired
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAdminApproval, adminApprovalCountdown]);

  // Resend admin approval countdown
  useEffect(() => {
    let interval;
    if (resendAdminApprovalCountdown > 0) {
      interval = setInterval(() => {
        setResendAdminApprovalCountdown(prev => {
          if (prev <= 1) {
            // Can resend admin approval
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendAdminApprovalCountdown]);

  // Resend email verification countdown
  useEffect(() => {
    let interval;
    if (resendVerificationCountdown > 0) {
      interval = setInterval(() => {
        setResendVerificationCountdown(prev => {
          if (prev <= 1) {
            setCanResendVerification(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendVerificationCountdown]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setRefreshMessage('');
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStats({
          totalStudents: data.stats.totalStudents || 0,
          todayAttendance: data.stats.todayAttendance || 0,
          attendancePercentage: data.stats.attendancePercentage || 0
        });
        setLowAttendanceAlert(data.lowAttendanceAlert);
        setAttendanceData(data.recentAttendance || []);
        setIsLoading(false);
        
        // Update last refreshed time
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setLastUpdated(timeString);
        setRefreshMessage('✅ Dashboard data refreshed successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
      } else {
        setStats({
          totalStudents: 0,
          todayAttendance: 0
        });
        setAttendanceData([]);
        setIsLoading(false);
        setRefreshMessage('❌ Failed to refresh data. Please try again.');
        
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
      }
    } catch (error) {
      setIsLoading(false);
      setRefreshMessage('❌ Failed to refresh data. Please check your connection and try again.');
    }
  };

  // Student search functionality moved to dedicated SearchStudent component

  // Handle export functionality
  const handleExport = async () => {
    try {
      const response = await fetch('/api/dashboard/export');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const filename = `current_attendance_${new Date().toISOString().split('T')[0]}.csv`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setRefreshMessage('📄 CSV export completed successfully!');
        setTimeout(() => setRefreshMessage(''), 3000);
      } else {
        setRefreshMessage('❌ Failed to export CSV file. Please try again.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      setRefreshMessage('❌ Error exporting CSV file. Please try again.');
      setTimeout(() => setRefreshMessage(''), 3000);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/analytics');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.analytics);
        }
      }
    } catch (error) {
      // Error fetching analytics data - fail silently
    }
  }, []);

  // Load analytics data when reports section is opened
  React.useEffect(() => {
    if (activeSection === 'reports' && !analyticsData) {
      fetchAnalyticsData();
    }
  }, [activeSection, analyticsData, fetchAnalyticsData]);

  // Auto-refresh analytics data every 30 seconds when on reports page
  React.useEffect(() => {
    let interval;
    if (activeSection === 'reports') {
      interval = setInterval(() => {
        fetchAnalyticsData();
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSection, fetchAnalyticsData]);

  // Confirm delete student
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/students/delete/${studentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh dashboard stats
        fetchDashboardData();
        setRefreshMessage('🗑️ Student deleted successfully!');
        setTimeout(() => setRefreshMessage(''), 3000);
        setShowDeleteConfirmModal(false);
        setStudentToDelete(null);
      } else {
        setRefreshMessage('❌ ' + (data.error || 'Failed to delete student. Please try again.'));
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setRefreshMessage('🌐 Network error occurred. Please check your internet connection and try again.');
      setTimeout(() => setRefreshMessage(''), 3000);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete student
  const cancelDeleteStudent = () => {
    setShowDeleteConfirmModal(false);
    setStudentToDelete(null);
  };



  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  // Verify email and update credentials (includes admin approval)
  const handleVerifyEmailAndUpdateCredentials = async (e) => {
    e.preventDefault();
    
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      setEmailVerificationMessage('⚠️ Please enter the complete 6-digit verification code from your email.');
      return;
    }
    
    // Check if this is an email-only change (already approved via link)
    const isEmailOnlyChange = pendingCredentials && pendingCredentials.email && 
                              pendingCredentials.email !== adminEmail &&
                              (!pendingCredentials.newUsername || pendingCredentials.newUsername === null) && 
                              (!pendingCredentials.newPassword || pendingCredentials.newPassword === null);
    
    console.log('Email verification debug:', {
      pendingCredentials,
      adminEmail,
      isEmailOnlyChange,
      hasAdminApprovalCode: !!adminApprovalCode
    });
    
    // For email-only changes, skip admin approval requirement
    if (isEmailOnlyChange) {
      console.log('Email-only change detected, skipping admin approval requirement');
    } else if (!adminApprovalCode || adminApprovalCode.length !== 6) {
      setEmailVerificationMessage('🔑 Admin approval code is required. Please go back and complete admin approval first.');
      return;
    }
    
    try {
      setEmailVerificationLoading(true);
      setEmailVerificationMessage('');
      
      const credentialsToUpdate = {
        ...pendingCredentials,
        otp: emailVerificationCode
      };
      
      // Only add admin approval OTP if it's not an email-only change
      if (!isEmailOnlyChange) {
        credentialsToUpdate.adminApprovalOtp = adminApprovalCode;
      }
      
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialsToUpdate)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmailVerificationMessage('🎉 Your credentials have been updated successfully!');
        
        // Reset all states
        setEmailVerificationCode('');
        setAdminApprovalCode('');
        setPendingCredentials(null);
        
        // Update admin email display
        fetchAdminEmail();
        
        // Close modals after 2 seconds
        setTimeout(() => {
          setShowEmailVerification(false);
          setShowAdminApproval(false);
          setEmailVerificationMessage('');
          // Clear admin approval message
        }, 2000);
      } else {
        setEmailVerificationMessage('❌ ' + (data.message || 'Invalid verification code. Please check the code and try again.'));
      }
    } catch (error) {
      console.error('Error verifying email and updating credentials:', error);
      setEmailVerificationMessage('Network error. Please try again.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };





  // Resend email verification
  const handleResendEmailVerification = async () => {
    if (!pendingCredentials) return;
    
    try {
      setEmailVerificationLoading(true);
      setEmailVerificationMessage('');
      
      const response = await fetch('/api/admin/send-credential-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: pendingCredentials.currentPassword,
          newEmail: pendingCredentials.email
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmailVerificationMessage('📧 New verification code sent to your email. Please check your inbox.');
        setVerificationCountdown(300); // Reset to 5 minutes
        setCanResendVerification(false);
        setResendVerificationCountdown(60); // 60 seconds before next resend
      } else {
        setEmailVerificationMessage('❌ ' + (data.message || 'Failed to resend verification code. Please try again in a moment.'));
      }
    } catch (error) {
      console.error('Error resending email verification:', error);
      setEmailVerificationMessage('🌐 Network error occurred. Please check your connection and try again.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Handle saving meal windows
  const handleSaveMealWindows = async () => {
    try {
      setMealWindowsLoading(true);
      setMealWindowsMessage('');
      
      const response = await fetch('/api/meal-windows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealWindows }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMealWindowsMessage('✅ Meal windows saved successfully!');
        // Update local state with saved data
        if (data.mealWindows) {
          setMealWindows(data.mealWindows);
        }
        setTimeout(() => {
          setMealWindowsMessage('');
        }, 3000);
      } else {
        setMealWindowsMessage('❌ ' + (data.error || 'Failed to save meal windows.'));
      }
    } catch (error) {
      console.error('Error saving meal windows:', error);
      setMealWindowsMessage('❌ Network error: ' + error.message);
    } finally {
      setMealWindowsLoading(false);
    }
  };

  // Handle resetting meal windows to defaults
  const handleResetMealWindows = () => {
    setMealWindows({
      breakfast: {
        startTime: '06:00',
        endTime: '09:00',
        beforeWindow: 30,
        afterWindow: 30,
        enabled: true
      },
      lunch: {
        startTime: '11:00',
        endTime: '14:00',
        beforeWindow: 30,
        afterWindow: 30,
        enabled: true
      },
      dinner: {
        startTime: '16:00',
        endTime: '20:00',
        beforeWindow: 30,
        afterWindow: 30,
        enabled: true
      },
      lateNight: {
        startTime: '01:00',
        endTime: '05:30',
        beforeWindow: 15,
        afterWindow: 15,
        enabled: true
      }
    });
    setMealWindowsMessage('✅ Meal windows reset to defaults!');
    setTimeout(() => {
      setMealWindowsMessage('');
    }, 3000);
  };








  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/system-status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemStatus(data.status);
        }
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };


  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsLightTheme(!isLightTheme);
  };

  // Notification handlers
  const handleMarkNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setNewStudentRegistrations([]);
  };



  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isLightTheme ? 'light-theme' : ''}`}>
      {/* Top Navigation Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <i className="fas fa-cube"></i>
            <span className="brand-name">Admin Dashboard</span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="header-icons">
            <Notification
              lowAttendanceAlert={lowAttendanceAlert}
              mealWindows={mealWindows}
              mealWindowStatus={mealWindowStatus}
              lastUpdated={lastUpdated}
              refreshMessage={refreshMessage}
              newStudentRegistrations={newStudentRegistrations}
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onClearAll={handleClearAllNotifications}
            />
            <button 
              className="header-icon-btn theme-toggle-btn" 
              title={isLightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
              onClick={handleThemeToggle}
            >
              <i className={`fas ${isLightTheme ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <div className="admin-profile-section">
              <button 
                className="header-icon-btn admin-profile-btn" 
                title="Admin Profile"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <i className="fas fa-user-circle" style={{ marginRight: '5px' }}></i>
                <span className="admin-email">{adminEmail}</span>
                <i className={`fas fa-chevron-down dropdown-arrow ${showProfileDropdown ? 'rotated' : ''}`}></i>
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-icons">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <div className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <h2>Dashboard</h2>
            <p className="welcome-text">Welcome, admin</p>
          </div>
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <i className="fas fa-home"></i>
              <span>Home</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('attendance');
              }}
            >
              <i className="fas fa-user-check"></i>
              <span>Attendance</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
              onClick={() => setActiveSection('students')}
            >
              <i className="fas fa-users"></i>
              <span>Students</span>
            </div>
           
            <div 
              className={`nav-item ${activeSection === 'meal-windows' ? 'active' : ''}`}
              onClick={() => setActiveSection('meal-windows')}
            >
              <i className="fas fa-clock"></i>
              <span>Meal Window</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'database-reset' ? 'active' : ''}`}
              onClick={() => setActiveSection('database-reset')}
            >
              <i className="fas fa-database"></i>
              <span>Database Reset</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </div>
            
           
            <div 
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <div className="header-left-content">
              <h1>
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'attendance' && 'Meal Attendance'}
                {activeSection === 'students' && 'Students Management'}
                {activeSection === 'reports' && 'Meal Reports'}
                {activeSection === 'meal-windows' && 'Meal Windows Configuration'}
                {activeSection === 'database-reset' && 'Database Reset Management'}
                {activeSection === 'settings' && 'Settings'}
              </h1>
            </div>
            <div className="header-actions">
              {refreshMessage && (
                <div className={`refresh-message ${refreshMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {refreshMessage}
                </div>
              )}
              <span className="last-updated">
                Last Updated: {lastUpdated || '07:51:11 PM'}
              </span>
              <button onClick={fetchDashboardData} className="refresh-btn" disabled={isLoading}>
                <i className={`fas fa-sync-alt ${isLoading ? 'spinning' : ''}`}></i> 
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Content Area */}
            {activeSection === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="stats-overview-section">
                  <h2><i className="fas fa-chart-line"></i> Overview</h2>
                  <div className="stats-grid">
                    <div className="metric-card total-students-card">
                      <div className="metric-icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{stats.totalStudents}</div>
                        <div className="metric-label">Total Students</div>
                        <div className="metric-trend positive">
                          <i className="fas fa-arrow-up"></i>
                          Registered
                        </div>
                      </div>
                    </div>

                    <div className={`metric-card attendance-card ${lowAttendanceAlert?.isActive ? 'low-attendance' : ''}`}>
                      <div className="metric-icon">
                        <i className="fas fa-calendar-check"></i>
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{stats.todayAttendance}</div>
                        <div className="metric-label">Today's Attendance</div>
                        <div className={`metric-trend ${stats.attendancePercentage >= 70 ? 'positive' : 'negative'}`}>
                          <i className={`fas fa-arrow-${stats.attendancePercentage >= 70 ? 'up' : 'down'}`}></i>
                          {stats.attendancePercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                  <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
                  <div className="quick-actions-grid">
                    <div className="quick-action-card" onClick={() => setActiveSection('students')}>
                      <div className="action-icon">
                        <i className="fas fa-user-plus"></i>
                      </div>
                      <div className="action-content">
                        <h3>Add Student</h3>
                        <p>Register new student</p>
                      </div>
                    </div>
                    <div className="quick-action-card" onClick={() => setActiveSection('attendance')}>
                      <div className="action-icon">
                        <i className="fas fa-clipboard-check"></i>
                      </div>
                      <div className="action-content">
                        <h3>View Attendance</h3>
                        <p>Check today's records</p>
                      </div>
                    </div>
                    <div className="quick-action-card" onClick={() => setActiveSection('reports')}>
                      <div className="action-icon">
                        <i className="fas fa-chart-bar"></i>
                      </div>
                      <div className="action-content">
                        <h3>Generate Report</h3>
                        <p>Export attendance data</p>
                      </div>
                    </div>
                    <div className="quick-action-card" onClick={() => setActiveSection('meal-windows')}>
                      <div className="action-icon">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="action-content">
                        <h3>Meal Windows</h3>
                        <p>Configure meal times</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="system-status-section">
                  <h2><i className="fas fa-server"></i> System Status</h2>
                  <div className="status-grid">
                    <div className="status-card">
                      <div className="status-header">
                        <i className="fas fa-database"></i>
                        <span>Database</span>
                      </div>
                      <div className={`status-indicator ${systemStatus.database}`}>
                        <span className="status-dot"></span>
                        {systemStatus.database === 'connected' ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                    <div className="status-card">
                      <div className="status-header">
                        <i className="fas fa-clock"></i>
                        <span>Meal Windows</span>
                      </div>
                      <div className={`status-indicator ${systemStatus.mealWindows}`}>
                        <span className="status-dot"></span>
                        {mealWindowStatus.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    <div className="status-card">
                      <div className="status-header">
                        <i className="fas fa-shield-alt"></i>
                        <span>System Uptime</span>
                      </div>
                      <div className="status-indicator connected">
                        <span className="status-dot"></span>
                        {systemStatus.uptime}
                      </div>
                    </div>
                    <div className="status-card">
                      <div className="status-header">
                        <i className="fas fa-users"></i>
                        <span>Active Sessions</span>
                      </div>
                      <div className="status-indicator active">
                        <span className="status-dot"></span>
                        {stats.todayAttendance} Students
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}


            {activeSection === 'attendance' && (
              <>
                <div className="attendance-section">
                  <h2>Recent Attendance Records</h2>
                  <div className="attendance-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Roll-no</th>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Meal Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.length > 0 ? (
                          attendanceData.map((record, index) => (
                            <tr key={index}>
                              <td className="roll-no-cell">
                                <span className="roll-no-badge">{index + 1}</span>
                              </td>
                              <td>{record.studentId}</td>
                              <td>{record.studentName}</td>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>{record.mealType || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="no-data">No recent attendance records</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'students' && (
              <>
                <div className="students-section">
                  
                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button 
                      className="action-btn search-btn"
                      onClick={() => window.location.href = '/search-student'}
                    >
                      <i className="fas fa-search"></i>
                      <span>Search Student</span>
                    </button>
                    <button 
                      className="action-btn add-btn"
                      onClick={() => window.location.href = '/add-student'}
                    >
                      <i className="fas fa-user-plus"></i>
                      <span>Add New Student</span>
                    </button>
                    <button 
                      className="action-btn view-btn"
                      onClick={() => window.location.href = '/view-all-students'}
                    >
                        <i className="fas fa-users"></i>
                        <span>View All Students</span>
                      </button>
                    </div>

                    {/* Search functionality moved to separate SearchStudent component */}
                </div>
              </>
            )}

            {activeSection === 'reports' && (
              <>
                <div className="reports-section">
                  <div className="report-header">
                    <div className="report-title">
                      <p className="report-subtitle">Current Session Analytics - {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="report-actions">
                      <button onClick={handleExport} className="export-btn csv-btn">
                        <i className="fas fa-download"></i>
                        Export Report
                      </button>
                    </div>
                  </div>

                  {analyticsData && (
                    <>

                      {/* Attendance Overview Pie Chart */}
                      <div className="report-section">
                        <div className="chart-container">
                            <div className="pie-chart-wrapper">
                            <div 
                              className="pie-chart"
                              style={{
                                '--percentage': analyticsData.attendanceRate,
                                '--color': '#667eea'
                              }}
                            >
                              <div className="pie-center">
                                <div className="pie-percentage">{analyticsData.attendanceRate}%</div>
                                <div className="pie-label">Used Meals</div>
                              </div>
                            </div>
                            <div className="chart-legend">
                              <div className="legend-item">
                                <div className="legend-color" style={{backgroundColor: '#667eea'}}></div>
                                <span>Meals Used</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color" style={{backgroundColor: '#e1e5e9'}}></div>
                                <span>Remaining Capacity</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Report Footer */}
                      <div className="report-footer">
                        <div className="footer-info">
                          <p><strong>Report Generated:</strong> {new Date().toLocaleString()}</p>
                          <p><strong>Data Source:</strong> Meal Attendance System</p>
                          <p><strong>Report Type:</strong> Current Session Analytics</p>
                        </div>
                        <div className="footer-note">
                          <p><em>Note: This report reflects real-time data from the current meal session. Data resets after each meal period.</em></p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {activeSection === 'meal-windows' && (
              <>
                <div className="meal-windows-section">
                  <div className="section-header">
                    <p>Configure attendance time windows for each meal period. Students can mark attendance within the specified time ranges.</p>
                  </div>

                  {mealWindowsMessage && (
                    <div className={`modal-message ${mealWindowsMessage.includes('✅') ? 'success' : 'error'}`}>
                      {mealWindowsMessage}
                    </div>
                  )}

                  <div className="meal-windows-grid">
                    {Object.entries(mealWindows).map(([mealType, config]) => (
                      <div key={mealType} className="meal-window-card">
                        <div className="meal-card-header">
                          <h3>
                            <i className={`fas ${
                              mealType === 'breakfast' ? 'fa-coffee' :
                              mealType === 'lunch' ? 'fa-hamburger' :
                              mealType === 'dinner' ? 'fa-utensils' :
                              'fa-moon'
                            }`}></i>
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                          </h3>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={config.enabled}
                              onChange={(e) => setMealWindows(prev => ({
                                ...prev,
                                [mealType]: { ...prev[mealType], enabled: e.target.checked }
                              }))}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className={`meal-card-content ${!config.enabled ? 'disabled' : ''}`}>
                          <div className="time-range-section">
                            <h4>Meal Service Hours</h4>
                            <div className="time-inputs">
                              <div className="time-input-group">
                                <label>Start Time</label>
                                <input
                                  type="time"
                                  value={config.startTime}
                                  disabled={!config.enabled}
                                  onChange={(e) => setMealWindows(prev => ({
                                    ...prev,
                                    [mealType]: { ...prev[mealType], startTime: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="time-input-group">
                                <label>End Time</label>
                                <input
                                  type="time"
                                  value={config.endTime}
                                  disabled={!config.enabled}
                                  onChange={(e) => setMealWindows(prev => ({
                                    ...prev,
                                    [mealType]: { ...prev[mealType], endTime: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="attendance-window-section">
                            <h4>Attendance Window</h4>
                            <div className="window-inputs">
                              <div className="window-input-group">
                                <label>Before Start (minutes)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={config.beforeWindow}
                                  disabled={!config.enabled}
                                  onChange={(e) => setMealWindows(prev => ({
                                    ...prev,
                                    [mealType]: { ...prev[mealType], beforeWindow: parseInt(e.target.value) }
                                  }))}
                                />
                              </div>
                              <div className="window-input-group">
                                <label>After End (minutes)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={config.afterWindow}
                                  disabled={!config.enabled}
                                  onChange={(e) => setMealWindows(prev => ({
                                    ...prev,
                                    [mealType]: { ...prev[mealType], afterWindow: parseInt(e.target.value) }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="window-preview">
                            <h5>Attendance Window Preview</h5>
                            <div className="preview-timeline">
                              <div className="timeline-item before">
                                <span className="time">{
                                  new Date(`2000-01-01T${config.startTime}`).getTime() - (config.beforeWindow * 60000) > 0 ?
                                  new Date(new Date(`2000-01-01T${config.startTime}`).getTime() - (config.beforeWindow * 60000)).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}) :
                                  '00:00'
                                }</span>
                                <span className="label">Window Opens</span>
                              </div>
                              <div className="timeline-item meal">
                                <span className="time">{config.startTime} - {config.endTime}</span>
                                <span className="label">Meal Service</span>
                              </div>
                              <div className="timeline-item after">
                                <span className="time">{
                                  new Date(new Date(`2000-01-01T${config.endTime}`).getTime() + (config.afterWindow * 60000)).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})
                                }</span>
                                <span className="label">Window Closes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="meal-windows-actions">
                    <button 
                      className="btn-save-windows"
                      onClick={handleSaveMealWindows}
                      disabled={mealWindowsLoading}
                    >
                      {mealWindowsLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          Save Meal Windows
                        </>
                      )}
                    </button>
                    <button 
                      className="btn-reset-windows"
                      onClick={handleResetMealWindows}
                      disabled={mealWindowsLoading}
                    >
                      <i className="fas fa-undo"></i>
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'database-reset' && (
              <DatabaseResetComponent fetchDashboardData={fetchDashboardData} />
            )}

            {activeSection === 'settings' && (
              <>
                <div className="settings-section">
                  <div className="feature-list">
                    
                    <div className="feature-item clickable" onClick={() => window.location.href = '/admin-credentials'}>
                      <i className="fas fa-user-shield"></i>
                      <span>Admin Credential</span>
                    </div>
                    
                    <div 
                      className="feature-item clickable"
                      onClick={() => window.location.href = '/scanner-credentials'}
                    >
                      <i className="fas fa-users-cog"></i>
                      <span>Scanner Credential</span>
                    </div>
                    
                  </div>
                </div>
              </>
            )}
        </div>
      </div>



      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelDeleteStudent}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <h3>Delete Student</h3>
              <button 
                className="modal-close-btn"
                onClick={cancelDeleteStudent}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <i className="fas fa-exclamation-triangle warning-icon"></i>
                <p>Are you sure you want to delete this student?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={cancelDeleteStudent}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-delete-confirm"
                  onClick={confirmDeleteStudent}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash"></i>
                      Delete Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}





      {/* Email Verification Modal for Credential Update */}
      {showEmailVerification && (
        <div className="modal-overlay" onClick={() => setShowEmailVerification(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-shield-alt"></i>
                Email Verification Required
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowEmailVerification(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {emailVerificationMessage && (
                <div className={`modal-message ${emailVerificationMessage.includes('successfully') || emailVerificationMessage.includes('sent') ? 'success' : 'error'}`}>
                  {emailVerificationMessage}
                </div>
              )}
              
              <form onSubmit={handleVerifyEmailAndUpdateCredentials} className="settings-form">
                <div className="settings-section">
                  <h4>
                    <i className="fas fa-envelope"></i>
                    Verify New Email Address
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
                    We've sent a 6-digit verification code to your new email address. 
                    Please enter the code below to complete the credential update.
                  </p>
                  
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={emailVerificationCode}
                      onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      style={{
                        textAlign: 'center',
                        fontSize: '18px',
                        letterSpacing: '4px',
                        fontFamily: 'monospace'
                      }}
                      required
                    />
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px'}}>
                    <div style={{fontSize: '13px', color: '#666'}}>
                      {verificationCountdown > 0 ? (
                        <>Code expires in: <strong>{formatTime(verificationCountdown)}</strong></>
                      ) : (
                        <span style={{color: '#e53e3e'}}>Code expired</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleResendEmailVerification}
                      disabled={!canResendVerification || emailVerificationLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: canResendVerification ? '#3182ce' : '#a0aec0',
                        cursor: canResendVerification ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        textDecoration: 'underline'
                      }}
                    >
                      {resendVerificationCountdown > 0 ? `Resend in ${resendVerificationCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowEmailVerification(false);
                    }}
                    disabled={emailVerificationLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-register"
                    disabled={emailVerificationLoading || emailVerificationCode.length !== 6 || verificationCountdown === 0}
                  >
                    {emailVerificationLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Verify & Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* Bottom Taskbar */}
      <div className="taskbar">
      </div>
    </div>
  );
};

export default Dashboard;
