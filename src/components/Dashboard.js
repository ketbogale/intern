import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    weeklyAttendance: 0,
    attendancePercentage: 0
  });
  const [lowAttendanceAlert, setLowAttendanceAlert] = useState(null);
  const [securityNotifications, setSecurityNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [refreshMessage, setRefreshMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    id: '',
    name: '',
    department: '',
    photoUrl: ''
  });
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentMessage, setAddStudentMessage] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    username: '',
    password: ''
  });
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffMessage, setAddStaffMessage] = useState('');
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentData, setEditStudentData] = useState({
    id: '',
    name: '',
    department: '',
    photoUrl: ''
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentMessage, setEditStudentMessage] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showGeneralSettingsModal, setShowGeneralSettingsModal] = useState(false);
  const [showAdminCredentialsModal, setShowAdminCredentialsModal] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
    email: ''
  });
  const [adminCredentialsLoading, setAdminCredentialsLoading] = useState(false);
  const [adminCredentialsMessage, setAdminCredentialsMessage] = useState('');
  
  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [generalSettings, setGeneralSettings] = useState({
    attendanceWindowBefore: 30,
    attendanceWindowAfter: 30,
    mealResetTimes: {
      breakfast: '06:00',
      lunch: '12:00',
      dinner: '18:00',
      lateNight: '23:00'
    },
    lowAttendanceThreshold: 50,
    loginAttemptLimit: 5,
    lockoutDurationMinutes: 5
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [showAllStudentsModal, setShowAllStudentsModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);

  // Fetch security notifications
  const fetchSecurityNotifications = async () => {
    try {
      const response = await fetch('/api/security/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSecurityNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error('Error fetching security notifications:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSecurityNotifications();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    let interval;
    if (showOTPModal && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) {
            setOtpMessage('Verification code expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTPModal, otpCountdown]);

  // Resend OTP countdown
  useEffect(() => {
    let interval;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setRefreshMessage('');
      console.log('Fetching dashboard data...');
      const response = await fetch('/api/dashboard/stats');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setStats({
          totalStudents: data.stats.totalStudents || 0,
          todayAttendance: data.stats.todayAttendance || 0,
          weeklyAttendance: data.stats.weeklyAttendance || 0,
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
        setRefreshMessage('Data has been refreshed successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
      } else {
        console.error('API error:', data.error || 'Unknown error');
        setStats({
          totalStudents: 0,
          todayAttendance: 0,
          weeklyAttendance: 0
        });
        setAttendanceData([]);
        setIsLoading(false);
        setRefreshMessage('Failed to refresh data. Please try again.');
        
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
      setRefreshMessage('Failed to refresh data. Please try again.');
      
      // Clear error message after 3 seconds
    }
  };

  const handleStudentSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setSearchMessage('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchMessage('');
      
      console.log('Searching for:', query);
      const response = await fetch(`/api/dashboard/search?query=${encodeURIComponent(query.trim())}`);
      console.log('Search response status:', response.status);
      
      const data = await response.json();
      console.log('Search response data:', data);
      
      if (response.ok && data.success) {
        setSearchResults(data.students);
        if (data.students.length === 0) {
          setSearchMessage('No students found matching your search.');
        } else {
          setSearchMessage(`Found ${data.students.length} student(s).`);
        }
      } else {
        setSearchResults([]);
        setSearchMessage(data.error || 'Error searching students.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchMessage('Network error. Please check if the backend server is running.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search - wait 500ms after user stops typing
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      handleStudentSearch(value);
    }, 500);
  };

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
        
        setRefreshMessage('CSV export completed successfully!');
        setTimeout(() => setRefreshMessage(''), 3000);
      } else {
        setRefreshMessage('Failed to export CSV file.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setRefreshMessage('Error exporting CSV file.');
      setTimeout(() => setRefreshMessage(''), 3000);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/dashboard/analytics');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load analytics data when reports section is opened
  React.useEffect(() => {
    if (activeSection === 'reports' && !analyticsData) {
      fetchAnalyticsData();
    }
  }, [activeSection]);

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
  }, [activeSection]);

  // Handle adding new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudentData.id.trim() || !newStudentData.name.trim()) {
      setAddStudentMessage('Student ID and Name are required fields.');
      return;
    }

    try {
      setAddStudentLoading(true);
      setAddStudentMessage('');
      
      const response = await fetch('/api/students/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudentData),
      });

      const data = await response.json();

      if (response.ok) {
        setAddStudentMessage('Student registered successfully!');
        // Reset form data
        setNewStudentData({
          id: '',
          name: '',
          department: '',
          photoUrl: ''
        });
        // Refresh dashboard stats
        fetchDashboardData();
        // Clear success message after 3 seconds but keep modal open
        setTimeout(() => {
          setAddStudentMessage('');
        }, 2500);
      } else {
        setAddStudentMessage(data.error || 'Failed to register student.');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      setAddStudentMessage('Network error. Please check if the backend server is running.');
    } finally {
      setAddStudentLoading(false);
    }
  };

  // Handle editing student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentData({
      id: student.id,
      name: student.name,
      department: student.department,
      photoUrl: student.photoUrl || ''
    });
    setShowEditStudentModal(true);
  };

  // Handle updating student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    if (!editStudentData.id.trim() || !editStudentData.name.trim()) {
      setEditStudentMessage('Student ID and Name are required fields.');
      return;
    }

    try {
      setEditStudentLoading(true);
      setEditStudentMessage('');
      
      const response = await fetch(`/api/students/update/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editStudentData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditStudentMessage('Student updated successfully!');
        // Refresh search results
        handleStudentSearch(searchQuery);
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowEditStudentModal(false);
          setEditStudentMessage('');
          setEditingStudent(null);
        }, 2000);
      } else {
        setEditStudentMessage(data.error || 'Failed to update student.');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setEditStudentMessage('Network error. Please check if the backend server is running.');
    } finally {
      setEditStudentLoading(false);
    }
  };

  // Handle deleting student
  const handleDeleteStudent = (studentId) => {
    setStudentToDelete(studentId);
    setShowDeleteConfirmModal(true);
  };

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
        // Refresh search results and dashboard stats
        handleStudentSearch(searchQuery);
        fetchDashboardData();
        setRefreshMessage('Student deleted successfully!');
        setTimeout(() => setRefreshMessage(''), 3000);
        setShowDeleteConfirmModal(false);
        setStudentToDelete(null);
      } else {
        setRefreshMessage(data.error || 'Failed to delete student.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setRefreshMessage('Network error. Please check if the backend server is running.');
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

  // Security notification helper functions
  const getSecurityIcon = (type) => {
    switch (type) {
      case 'failed_login': return 'fa-shield-exclamation';
      case 'unusual_access': return 'fa-map-marker-alt';
      case 'password_reset': return 'fa-key';
      case 'account_locked': return 'fa-lock';
      default: return 'fa-shield-alt';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const dismissNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/security/notifications/${notificationId}/dismiss`, {
        method: 'PATCH'
      });
      if (response.ok) {
        setSecurityNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/security/notifications/mark-all-read', {
        method: 'PATCH'
      });
      if (response.ok) {
        setSecurityNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage('Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      setOtpLoading(true);
      setOtpMessage('');
      
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: otpCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOtpMessage('Login successful! Redirecting...');
        
        // Close OTP modal and redirect to dashboard
        setTimeout(() => {
          setShowOTPModal(false);
          setOtpCode('');
          setOtpMessage('');
          // Refresh the page to load admin dashboard
          window.location.reload();
        }, 1500);
      } else {
        setOtpMessage(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpMessage('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);
      setOtpMessage('');
      
      const response = await fetch('/api/admin/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOtpMessage('New verification code sent to your email');
        setOtpCountdown(300); // Reset to 5 minutes
        setCanResendOTP(false);
        setResendCountdown(60); // 60 seconds before next resend
      } else {
        setOtpMessage(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setOtpMessage('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle admin credentials update
  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    
    try {
      setAdminCredentialsLoading(true);
      setAdminCredentialsMessage('');
      
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminCredentials)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdminCredentialsMessage('Admin credentials updated successfully!');
        setAdminCredentials({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAdminCredentialsModal(false);
          setAdminCredentialsMessage('');
        }, 2000);
      } else {
        setAdminCredentialsMessage(data.message || 'Failed to update credentials');
      }
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      setAdminCredentialsMessage('Network error. Please try again.');
    } finally {
      setAdminCredentialsLoading(false);
    }
  };

  // Handle saving general settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    try {
      setSettingsLoading(true);
      setSettingsMessage('');
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generalSettings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettingsMessage('✅ Settings saved successfully!');
        setTimeout(() => {
          setSettingsMessage('');
        }, 3000);
      } else {
        setSettingsMessage('❌ ' + (data.error || 'Failed to save settings.'));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setSettingsMessage('❌ Network error: ' + error.message);
    } finally {
      setSettingsLoading(false);
    }
  };


  // Handle adding new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    if (!newStaffData.username.trim() || !newStaffData.password.trim()) {
      setAddStaffMessage('Username and Password are required fields.');
      return;
    }

    try {
      setAddStaffLoading(true);
      setAddStaffMessage('');
      
      const response = await fetch('/api/staff/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaffData),
      });

      const data = await response.json();

      if (response.ok) {
        setAddStaffMessage('Staff registered successfully!');
        // Reset form data
        setNewStaffData({
          username: '',
          password: ''
        });
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddStaffModal(false);
          setAddStaffMessage('');
        }, 2000);
      } else {
        setAddStaffMessage(data.error || 'Failed to register staff.');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      setAddStaffMessage('Network error. Please check if the backend server is running.');
    } finally {
      setAddStaffLoading(false);
    }
  };

  // Handle viewing all students
  const handleViewAllStudents = async () => {
    try {
      setAllStudentsLoading(true);
      setShowAllStudentsModal(true);
      
      const response = await fetch('/api/students/all');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAllStudents(data.students);
      } else {
        console.error('Error fetching all students:', data.error);
        setAllStudents([]);
      }
    } catch (error) {
      console.error('Error fetching all students:', error);
      setAllStudents([]);
    } finally {
      setAllStudentsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <i className="fas fa-cube"></i>
            <span className="brand-name">Dashboard</span>
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
              <i className="fas fa-chart-bar"></i>
              <span>Overview</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveSection('attendance')}
            >
              <i className="fas fa-calendar-check"></i>
              <span>Attendance</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <i className="fas fa-bell"></i>
              <span>Notifications</span>
            </div>
            <hr className='nav-divider'/>
            <div 
              className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
              onClick={() => setActiveSection('students')}
            >
              <i className="fas fa-users"></i>
              <span>Students</span>
            </div>
            <div 
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Reports</span>
            </div>
            <hr className='nav-divider'/>
            <div 
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </div>
            <div className="nav-item logout-btn" onClick={() => window.location.href = 'login.html'}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className={`content-header ${headerShrunk ? 'shrunk' : ''}`}>
            <div className="header-left-content">
              <h1>
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'attendance' && 'Meal Attendance'}
                {activeSection === 'notifications' && 'Notifications'}
                {activeSection === 'students' && 'Students Management'}
                {activeSection === 'reports' && 'Meal Reports'}
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
                <div className="stats-grid">
                  <div className="stat-card total-students">
                    <div className="stat-content">
                      <h3>TOTAL STUDENTS</h3>
                      <div className="stat-number">{stats.totalStudents}</div>
                    </div>
                  </div>

                  <div className={`stat-card today-attendance ${lowAttendanceAlert?.isActive ? 'low-attendance' : ''}`}>
                    <div className="stat-content">
                      <h3>TODAY'S ATTENDANCE</h3>
                      <div className="stat-number">{stats.todayAttendance}</div>
                      <div className="stat-percentage">{stats.attendancePercentage}%</div>
                    </div>
                  </div>

                  <div className="stat-card weekly-attendance">
                    <div className="stat-content">
                      <h3>WEEKLY ATTENDANCE</h3>
                      <div className="stat-number">{stats.weeklyAttendance}</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Summary */}
                <div className="recent-activity">
                  <h2>Dashboard Summary</h2>
                  <div className="activity-summary">
                    <p>Here you can view overall statistics and recent activity.</p>
                    <ul>
                      <li>Monitor daily attendance rates</li>
                      <li>Track weekly attendance trends</li>
                      <li>View total registered students</li>
                      <li>Access detailed reports and analytics</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <div className="notifications-section">
                  <div className="notification-header-controls">
                    <div className="notification-filters">
                      <select 
                        value={notificationFilter} 
                        onChange={(e) => setNotificationFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">All Notifications</option>
                        <option value="security">Security & Access</option>
                        <option value="attendance">Attendance Alerts</option>
                        <option value="system">System Status</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Security Notifications */}
                  {securityNotifications
                    .filter(notif => notificationFilter === 'all' || notificationFilter === 'security')
                    .map(notification => (
                    <div key={notification._id} className={`notification-item ${notification.severity}`}>
                      <div className="notification-header">
                        <div className="notification-title">
                          <i className={`fas ${getSecurityIcon(notification.type)}`}></i>
                          {notification.title}
                          {!notification.isRead && <span className="unread-dot"></span>}
                        </div>
                        <div className="notification-actions">
                          <span className="notification-time">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <button 
                            className="notification-dismiss"
                            onClick={() => dismissNotification(notification._id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <div className="notification-body">
                        <p className="notification-message">{notification.message}</p>
                        <div className="notification-meta">
                          <span className={`notification-badge ${notification.severity}`}>
                            {notification.severity.toUpperCase()}
                          </span>
                          {notification.metadata?.ipAddress && (
                            <span className="notification-badge">
                              IP: {notification.metadata.ipAddress}
                            </span>
                          )}
                          {notification.metadata?.attemptCount && (
                            <span className="notification-badge">
                              Attempts: {notification.metadata.attemptCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Low Attendance Alert */}
                  {lowAttendanceAlert && lowAttendanceAlert.isActive && 
                   (notificationFilter === 'all' || notificationFilter === 'attendance') && (
                    <div className="notification-item high">
                      <div className="notification-header">
                        <div className="notification-title">
                          <i className="fas fa-exclamation-triangle"></i>
                          Low Attendance Alert
                        </div>
                        <div className="notification-actions">
                          <span className="notification-time">Now</span>
                          <button 
                            className="notification-dismiss"
                            onClick={() => setLowAttendanceAlert(null)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <div className="notification-body">
                        <p className="notification-message">{lowAttendanceAlert.message}</p>
                        <div className="notification-meta">
                          <span className="notification-badge high">HIGH</span>
                          <span className="notification-badge">
                            Threshold: {lowAttendanceAlert.threshold}%
                          </span>
                          <span className="notification-badge">
                            Missing: {lowAttendanceAlert.missingStudents} students
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No notifications message */}
                  {(!lowAttendanceAlert || !lowAttendanceAlert.isActive) && 
                   securityNotifications.length === 0 && (
                    <div className="no-notifications">
                      <i className="fas fa-shield-check"></i>
                      <p>All systems secure. No alerts at this time.</p>
                    </div>
                  )}
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
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.length > 0 ? (
                          attendanceData.map((record, index) => (
                            <tr key={index}>
                              <td>{record.studentId}</td>
                              <td>{record.studentName}</td>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>{new Date(record.date).toLocaleTimeString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="no-data">No recent attendance records</td>
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
                  
                  {/* Search Section */}
                  <div className="search-section">
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                          type="text"
                          placeholder="Search Student ID or Name..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          className="search-input"
                        />
                        {searchLoading && <i className="fas fa-spinner fa-spin loading-icon"></i>}
                      </div>
                      {searchMessage && (
                        <div className={`search-message ${searchResults.length > 0 ? 'success' : 'info'}`}>
                          {searchMessage}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button 
                        className="action-btn add-btn"
                        onClick={() => setShowAddStudentModal(true)}
                      >
                        <i className="fas fa-user-plus"></i>
                        <span>Add New Student</span>
                      </button>
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleViewAllStudents()}
                      >
                        <i className="fas fa-users"></i>
                        <span>View All Students</span>
                      </button>
                    </div>

                    {/* Student Information Display - Positioned Absolutely */}
                    {searchResults.length > 0 && (
                      <div className="student-info-panel">
                        <button 
                          className="modal-close-btn student-panel-close"
                          onClick={() => setSearchResults([])}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <h3>Student Information</h3>
                        {searchResults.map((student) => (
                          <div key={student._id} className="student-details-card">
                            <div className="student-header">
                              {student.photoUrl && (
                                <div className="student-avatar">
                                  <img src={student.photoUrl} alt={student.name} />
                                </div>
                              )}
                              <div className="student-basic-info">
                                <h4>{student.name}</h4>
                                <p className="student-id-display">{student.id}</p>
                              </div>
                            </div>
                            <div className="student-details">
                              <div className="detail-row">
                                <span className="detail-label">ID:</span>
                                <span className="detail-value">{student.id}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{student.name}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Department:</span>
                                <span className="detail-value">{student.department}</span>
                              </div>
                            </div>
                            <div className="student-actions">
                              <button 
                                className="btn-edit"
                                onClick={() => handleEditStudent(student)}
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              <button 
                                className="btn-delete"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <i className="fas fa-trash"></i>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

            {activeSection === 'settings' && (
              <>
                <div className="settings-section">
                  <div className="feature-list">
                    <div className="feature-item clickable" onClick={() => setShowGeneralSettingsModal(true)}>
                      <i className="fas fa-cog"></i>
                      <span>General Settings</span>
                    </div>
                    
                    {user.role === 'admin' && (
                      <div className="feature-item clickable" onClick={() => setShowAdminCredentialsModal(true)}>
                        <i className="fas fa-user-shield"></i>
                        <span>Admin Credentials</span>
                      </div>
                    )}
                    
                    <div 
                      className="feature-item clickable"
                      onClick={() => setShowAddStaffModal(true)}
                    >
                      <i className="fas fa-users-cog"></i>
                      <span>Scanner Management</span>
                    </div>
                    <div className="feature-item">
                      <i className="fas fa-database"></i>
                      <span>Database Configuration</span>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Student</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowAddStudentModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {addStudentMessage && (
                <div className={`modal-message ${addStudentMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {addStudentMessage}
                </div>
              )}
              
              <form onSubmit={handleAddStudent} className="add-student-form">
                <div className="form-group">
                  <label htmlFor="studentId">Student ID</label>
                  <input
                    type="text"
                    id="studentId"
                    value={newStudentData.id}
                    onChange={(e) => setNewStudentData({...newStudentData, id: e.target.value})}
                    placeholder="Enter student ID"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="studentName">Name</label>
                  <input
                    type="text"
                    id="studentName"
                    value={newStudentData.name}
                    onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="studentDepartment">Department</label>
                  <input
                    type="text"
                    id="studentDepartment"
                    value={newStudentData.department}
                    onChange={(e) => setNewStudentData({...newStudentData, department: e.target.value})}
                    placeholder="Enter department"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="studentPhotoUrl">Photo Path</label>
                  <input
                    type="text"
                    id="studentPhotoUrl"
                    value={newStudentData.photoUrl}
                    onChange={(e) => setNewStudentData({...newStudentData, photoUrl: e.target.value})}
                    placeholder="e.g., /public/images/student.jpg"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowAddStudentModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={addStudentLoading}
                  >
                    {addStudentLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Staff</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowAddStaffModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {addStaffMessage && (
                <div className={`modal-message ${addStaffMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {addStaffMessage}
                </div>
              )}
              
              <form onSubmit={handleAddStaff} className="add-staff-form">
                <div className="form-group">
                  <label htmlFor="staffUsername">Username</label>
                  <input
                    type="text"
                    id="staffUsername"
                    value={newStaffData.username}
                    onChange={(e) => setNewStaffData({...newStaffData, username: e.target.value})}
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="staffPassword">Password</label>
                  <input
                    type="password"
                    id="staffPassword"
                    value={newStaffData.password}
                    onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowAddStaffModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={addStaffLoading}
                  >
                    {addStaffLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Registering...
                      </>
                    ) : (
                      'Register Staff'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <div className="modal-overlay" onClick={() => setShowEditStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Student Data</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowEditStudentModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {editStudentMessage && (
                <div className={`modal-message ${editStudentMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {editStudentMessage}
                </div>
              )}
              
              <form onSubmit={handleUpdateStudent} className="edit-student-form">
                <div className="form-group">
                  <label htmlFor="editStudentId">Student ID</label>
                  <input
                    type="text"
                    id="editStudentId"
                    value={editStudentData.id}
                    onChange={(e) => setEditStudentData({...editStudentData, id: e.target.value})}
                    placeholder="Enter student ID"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editStudentName">Name</label>
                  <input
                    type="text"
                    id="editStudentName"
                    value={editStudentData.name}
                    onChange={(e) => setEditStudentData({...editStudentData, name: e.target.value})}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editStudentDepartment">Department</label>
                  <input
                    type="text"
                    id="editStudentDepartment"
                    value={editStudentData.department}
                    onChange={(e) => setEditStudentData({...editStudentData, department: e.target.value})}
                    placeholder="Enter department"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editStudentPhotoUrl">Photo Path</label>
                  <input
                    type="text"
                    id="editStudentPhotoUrl"
                    value={editStudentData.photoUrl}
                    onChange={(e) => setEditStudentData({...editStudentData, photoUrl: e.target.value})}
                    placeholder="e.g., /public/images/student.jpg"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowEditStudentModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={editStudentLoading}
                  >
                    {editStudentLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

      {/* General Settings Modal */}
      {showGeneralSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowGeneralSettingsModal(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>General Settings</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowGeneralSettingsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {settingsMessage && (
                <div className={`modal-message ${settingsMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {settingsMessage}
                </div>
              )}
              
              <form onSubmit={handleSaveSettings} className="settings-form">
                {/* Attendance Window Settings */}
                <div className="settings-section">
                  <h4><i className="fas fa-clock"></i> Attendance Window</h4>
                  <div className="settings-row">
                    <div className="form-group">
                      <label>Minutes Before Meal Time</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={generalSettings.attendanceWindowBefore}
                        onChange={(e) => setGeneralSettings({...generalSettings, attendanceWindowBefore: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Minutes After Meal Time</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={generalSettings.attendanceWindowAfter}
                        onChange={(e) => setGeneralSettings({...generalSettings, attendanceWindowAfter: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* Meal Reset Times */}
                <div className="settings-section">
                  <h4><i className="fas fa-calendar-day"></i> Meal Reset Times</h4>
                  <div className="settings-row">
                    <div className="form-group">
                      <label>Breakfast Reset Time</label>
                      <input
                        type="time"
                        value={generalSettings.mealResetTimes.breakfast}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings, 
                          mealResetTimes: {
                            ...generalSettings.mealResetTimes,
                            breakfast: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lunch Reset Time</label>
                      <input
                        type="time"
                        value={generalSettings.mealResetTimes.lunch}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings, 
                          mealResetTimes: {
                            ...generalSettings.mealResetTimes,
                            lunch: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="form-group">
                      <label>Dinner Reset Time</label>
                      <input
                        type="time"
                        value={generalSettings.mealResetTimes.dinner}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings, 
                          mealResetTimes: {
                            ...generalSettings.mealResetTimes,
                            dinner: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Late Night Reset Time</label>
                      <input
                        type="time"
                        value={generalSettings.mealResetTimes.lateNight}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings, 
                          mealResetTimes: {
                            ...generalSettings.mealResetTimes,
                            lateNight: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="settings-note">
                    <p><i className="fas fa-info-circle"></i> Database will automatically reset at these times to clear meal attendance data for each period.</p>
                  </div>
                </div>

                {/* Low Attendance Alerts */}
                <div className="settings-section">
                  <h4><i className="fas fa-exclamation-triangle"></i> Low Attendance Alerts</h4>
                  <div className="form-group">
                    <label>Alert when attendance drops below (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={generalSettings.lowAttendanceThreshold}
                      onChange={(e) => setGeneralSettings({...generalSettings, lowAttendanceThreshold: parseInt(e.target.value)})}
                    />
                  </div>
                </div>


                {/* Login Security */}
                <div className="settings-section">
                  <h4><i className="fas fa-shield-alt"></i> Login Security</h4>
                  <div className="settings-row">
                    <div className="form-group">
                      <label>Maximum login attempts before lockout</label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={generalSettings.loginAttemptLimit}
                        onChange={(e) => setGeneralSettings({...generalSettings, loginAttemptLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lockout duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={generalSettings.lockoutDurationMinutes}
                        onChange={(e) => setGeneralSettings({...generalSettings, lockoutDurationMinutes: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>


                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowGeneralSettingsModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="modal-overlay" onClick={() => setShowOTPModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-shield-alt"></i>
                Email Verification
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowOTPModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {otpMessage && (
                <div className={`modal-message ${otpMessage.includes('successful') || otpMessage.includes('sent') ? 'success' : 'error'}`}>
                  {otpMessage}
                </div>
              )}
              
              <form onSubmit={handleVerifyOTP} className="settings-form">
                <div className="settings-section">
                  <h4>
                    <i className="fas fa-envelope"></i>
                    Enter Verification Code
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
                    We've sent a 6-digit verification code to <strong>ket***@gmail.com</strong>
                  </p>
                  
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                      {otpCountdown > 0 ? (
                        <>⏰ Code expires in: <strong>{formatTime(otpCountdown)}</strong></>
                      ) : (
                        <span style={{color: '#e53e3e'}}>⚠️ Code expired</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResendOTP || otpLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: canResendOTP ? '#3182ce' : '#a0aec0',
                        cursor: canResendOTP ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        textDecoration: 'underline'
                      }}
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowOTPModal(false)}
                    disabled={otpLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={otpLoading || otpCode.length !== 6 || otpCountdown === 0}
                  >
                    {otpLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Credentials Modal */}
      {showAdminCredentialsModal && (
        <div className="modal-overlay" onClick={() => setShowAdminCredentialsModal(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Admin Credentials
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowAdminCredentialsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {adminCredentialsMessage && (
                <div className={`modal-message ${adminCredentialsMessage.includes('✅') ? 'success' : 'error'}`}>
                  {adminCredentialsMessage}
                </div>
              )}
              
              <form onSubmit={handleUpdateAdminCredentials} className="settings-form">
                <div className="settings-section">
                  <h4>
                    <i className="fas fa-lock"></i>
                    Change Admin Credentials
                  </h4>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={adminCredentials.currentPassword}
                        onChange={(e) => setAdminCredentials(prev => ({
                          ...prev,
                          currentPassword: e.target.value
                        }))}
                        required
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>New Username</label>
                      <input
                        type="text"
                        value={adminCredentials.newUsername}
                        onChange={(e) => setAdminCredentials(prev => ({
                          ...prev,
                          newUsername: e.target.value
                        }))}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={adminCredentials.newPassword}
                        onChange={(e) => setAdminCredentials(prev => ({
                          ...prev,
                          newPassword: e.target.value
                        }))}
                        placeholder="Leave blank to keep current"
                        minLength="6"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={adminCredentials.confirmPassword}
                        onChange={(e) => setAdminCredentials(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        placeholder="Confirm new password"
                        disabled={!adminCredentials.newPassword}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={adminCredentials.email}
                        onChange={(e) => setAdminCredentials(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="Enter admin email address"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowAdminCredentialsModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={adminCredentialsLoading || !adminCredentials.currentPassword}
                  >
                    {adminCredentialsLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View All Students Modal */}
      {showAllStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowAllStudentsModal(false)}>
          <div className="modal-content all-students-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>All Students</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowAllStudentsModal(false)}
              >
              <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {allStudentsLoading ? (
                <div className="loading-container">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading students...</p>
                </div>
              ) : (
                <div className="students-table-container">
                  <div className="students-count">
                    Total Students: <strong>{allStudents.length}</strong>
                  </div>
                  
                  <div className="students-table-wrapper">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Department</th>
                          <th>Photo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.length > 0 ? (
                          allStudents.map((student) => (
                            <tr key={student._id}>
                              <td>{student.id}</td>
                              <td>{student.name}</td>
                              <td>{student.department || 'N/A'}</td>
                              <td>
                                {student.photoUrl ? (
                                  <img 
                                    src={student.photoUrl} 
                                    alt={student.name}
                                    className="student-photo-small"
                                    onError={(e) => {
                                      e.target.src = '/images/default-student.png';
                                    }}
                                  />
                                ) : (
                                  <div className="no-photo">No Photo</div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="no-data">No students found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
