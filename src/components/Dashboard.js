import React, { useState, useEffect, useRef } from 'react';
import VerificationCodeInput from './VerificationCodeInput';
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
    weeklyAttendance: 0,
    attendancePercentage: 0
  });
  const [lowAttendanceAlert, setLowAttendanceAlert] = useState(null);
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
  
  // Admin approval states (required for all credential updates)
  const [showAdminApproval, setShowAdminApproval] = useState(false);
  const [adminApprovalCode, setAdminApprovalCode] = useState('');
  const [adminApprovalLoading, setAdminApprovalLoading] = useState(false);
  const [adminApprovalMessage, setAdminApprovalMessage] = useState('');
  const [adminApprovalCountdown, setAdminApprovalCountdown] = useState(300); // 5 minutes
  const [canResendAdminApproval, setCanResendAdminApproval] = useState(false);
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
  
  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Database Configuration states
  const [showDatabaseConfigModal, setShowDatabaseConfigModal] = useState(false);
  const [databaseConfig, setDatabaseConfig] = useState({
    connectionString: 'mongodb://localhost:27017/meal_attendance',
    backupSchedule: 'daily',
    backupTime: '02:00',
    dataRetentionMonths: 24,
    archiveAfterMonths: 12,
    connectionPoolSize: 10,
    connectionTimeout: 30,
    cacheEnabled: true,
    cacheDurationMinutes: 30,
    indexOptimization: true,
    gdprCompliance: true
  });
  const [databaseConfigLoading, setDatabaseConfigLoading] = useState(false);
  const [databaseConfigMessage, setDatabaseConfigMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  // Create ref for search input
  const searchInputRef = useRef(null);
  
  // Meal Windows state
  const [mealWindows, setMealWindows] = useState({});
  const [mealWindowsLoading, setMealWindowsLoading] = useState(false);
  const [mealWindowsMessage, setMealWindowsMessage] = useState('');
  const [showAllStudentsModal, setShowAllStudentsModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    username: '',
    password: ''
  });
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffMessage, setAddStaffMessage] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [newStudentRegistrations, setNewStudentRegistrations] = useState([]);
  
  // Meal window states
  const [mealWindowStatus, setMealWindowStatus] = useState({
    isOpen: false,
    nextMealTime: null,
    timeUntilOpen: null,
    mealType: 'Dinner'
  });
  const [attendanceBlocked, setAttendanceBlocked] = useState(false);

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
        console.log('Admin profile data:', data); // Debug log
        setAdminEmail(data.email || '');
      } else {
        console.error('Failed to fetch admin profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching admin email:', error);
    }
  };

  // Meal window timing logic
  const checkMealWindow = () => {
    // Don't process if meal windows haven't been loaded from database yet
    if (Object.keys(mealWindows).length === 0) {
      console.log('Dashboard: Meal windows not loaded yet, skipping check');
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
      if (!isInMealWindow && currentTime < windowStart) {
        if (!nextMealTime || windowStart < nextMealTime) {
          nextMealTime = windowStart;
          nextMealType = mealType;
          timeUntilOpen = windowStart - currentTime;
        }
      }
    });
    
    // If no meal found today, next is breakfast tomorrow
    if (!isInMealWindow && !nextMealType) {
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
    
    setAttendanceBlocked(!isInMealWindow);
    
    // Notification logic moved to Notification.js to avoid duplicates
  };

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
      console.error('Error fetching meal windows:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAdminEmail();
    fetchMealWindows();
    checkMealWindow();
    
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
    
    // Check meal window every minute
    const mealWindowInterval = setInterval(checkMealWindow, 60000);
    
    return () => clearInterval(mealWindowInterval);
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
            setAdminApprovalMessage('Admin approval code expired. Please request a new one.');
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
            setCanResendAdminApproval(true);
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
        setRefreshMessage('✅ Dashboard data refreshed successfully!');
        
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
        setRefreshMessage('❌ Failed to refresh data. Please try again.');
        
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
      setRefreshMessage('❌ Failed to refresh data. Please check your connection and try again.');
      
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
          setSearchMessage('🔍 No students found matching your search. Try different keywords or check spelling.');
        } else {
          setSearchMessage(`✅ Found ${data.students.length} student(s) matching your search.`);
        }
      } else {
        setSearchResults([]);
        setSearchMessage('❌ ' + (data.error || 'Error searching students. Please try again.'));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchMessage('🌐 Network error occurred. Please check your internet connection and try again.');
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
        
        setRefreshMessage('📄 CSV export completed successfully!');
        setTimeout(() => setRefreshMessage(''), 3000);
      } else {
        setRefreshMessage('❌ Failed to export CSV file. Please try again.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setRefreshMessage('❌ Error exporting CSV file. Please try again.');
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
      setAddStudentMessage('📝 Please fill in both Student ID and Name - these fields are required.');
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
        setAddStudentMessage('🎉 Student registered successfully! You can now add another student or close this window.');
        
        // Track new student registration for notifications
        trackNewStudentRegistration(newStudentData);
        
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
        setAddStudentMessage('❌ ' + (data.error || 'Failed to register student. Please check the information and try again.'));
      }
    } catch (error) {
      console.error('Error adding student:', error);
      setAddStudentMessage('🌐 Network error occurred. Please check your internet connection and try again.');
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
      setEditStudentMessage('📝 Please fill in both Student ID and Name - these fields are required.');
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
        setEditStudentMessage('✅ Student information updated successfully!');
        // Refresh search results
        handleStudentSearch(searchQuery);
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowEditStudentModal(false);
          setEditStudentMessage('');
          setEditingStudent(null);
        }, 2000);
      } else {
        setEditStudentMessage('❌ ' + (data.error || 'Failed to update student. Please check the information and try again.'));
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setEditStudentMessage('🌐 Network error occurred. Please check your internet connection and try again.');
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


  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage('⚠️ Please enter the complete 6-digit verification code from your email.');
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
        setOtpMessage('🎉 Login successful! Redirecting to your dashboard...');
        
        // Close OTP modal and redirect to dashboard
        setTimeout(() => {
          setShowOTPModal(false);
          setOtpCode('');
          setOtpMessage('');
          // Refresh the page to load admin dashboard
          window.location.reload();
        }, 1500);
      } else {
        setOtpMessage('❌ ' + (data.message || 'Invalid verification code. Please check the code and try again.'));
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpMessage('🌐 Network error occurred. Please check your connection and try again.');
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
        setOtpMessage('📧 New verification code sent to your email. Please check your inbox.');
        setOtpCountdown(300); // Reset to 5 minutes
        setCanResendOTP(false);
        setResendCountdown(60); // 60 seconds before next resend
      } else {
        setOtpMessage('❌ ' + (data.message || 'Failed to resend verification code. Please try again in a moment.'));
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setOtpMessage('🌐 Network error occurred. Please check your connection and try again.');
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

  // Send email change approval link to current admin email
  const handleSendEmailChangeApproval = async () => {
    if (!adminCredentials.email || !adminCredentials.currentPassword) {
      setAdminCredentialsMessage('Please enter current password and new email address.');
      return;
    }

    try {
      setEmailVerificationLoading(true);
      setEmailVerificationMessage('');
      
      const response = await fetch('/api/admin/send-email-change-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: adminCredentials.currentPassword,
          newEmail: adminCredentials.email
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdminCredentialsMessage(`📧 Email change approval link sent to ${data.currentEmail}. Please check your current email and click the approval link. After clicking, return here to enter the verification code.`);
        setPendingCredentials(adminCredentials);
      } else {
        setAdminCredentialsMessage(data.message || 'Failed to send approval email');
      }
    } catch (error) {
      console.error('Error sending email change approval:', error);
      setAdminCredentialsMessage('Network error. Please try again.');
    } finally {
      setEmailVerificationLoading(false);
    }
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
        setAdminCredentials({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
          email: ''
        });
        setEmailVerificationCode('');
        setAdminApprovalCode('');
        setPendingCredentials(null);
        
        // Update admin email display
        fetchAdminEmail();
        
        // Close modals after 2 seconds
        setTimeout(() => {
          setShowEmailVerification(false);
          setShowAdminApproval(false);
          setShowAdminCredentialsModal(false);
          setEmailVerificationMessage('');
          setAdminApprovalMessage('');
          setAdminCredentialsMessage('');
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

  // Send admin approval OTP (required for all credential updates)
  const handleSendAdminApproval = async () => {
    if (!adminCredentials.currentPassword) {
      setAdminCredentialsMessage('🔒 Please enter your current password to verify your identity before making any changes.');
      return;
    }

    try {
      setAdminApprovalLoading(true);
      setAdminApprovalMessage('');
      
      const response = await fetch('/api/admin/send-admin-approval-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: adminCredentials.currentPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAdminApproval(true);
        setAdminApprovalCountdown(300); // Reset to 5 minutes
        setCanResendAdminApproval(false);
        setResendAdminApprovalCountdown(60); // 60 seconds before next resend
        setAdminApprovalMessage(`✅ Admin verification code sent to ${data.email}. Please check your email and enter the 6-digit code below.`);
        setPendingCredentials(adminCredentials);
      } else {
        setAdminCredentialsMessage('❌ ' + (data.message || 'Failed to send admin approval code. Please check your current password and try again.'));
      }
    } catch (error) {
      console.error('Error sending admin approval:', error);
      setAdminCredentialsMessage('🌐 Network error occurred. Please check your internet connection and try again.');
    } finally {
      setAdminApprovalLoading(false);
    }
  };

  // Handle admin credentials update - now requires admin approval first
  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    
    // Check if email is being changed
    if (adminCredentials.email && adminCredentials.email !== adminEmail) {
      // Email is being changed, use two-step email change approval process
      handleSendEmailChangeApproval();
      return;
    }
    
    // No email change, use regular admin approval process
    handleSendAdminApproval();
  };

  // Proceed with credential update after admin approval
  const handleProceedAfterAdminApproval = async () => {
    if (!adminApprovalCode || adminApprovalCode.length !== 6) {
      setAdminApprovalMessage('⚠️ Please enter the complete 6-digit admin approval code from your email.');
      return;
    }
    
    // No email change, proceed with credential update
    try {
      setAdminApprovalLoading(true);
      setAdminApprovalMessage('');
      
      const credentialsToUpdate = {
        ...pendingCredentials,
        adminApprovalOtp: adminApprovalCode
      };
      
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialsToUpdate)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdminApprovalMessage('🎉 Your admin credentials have been updated successfully!');
        
        // Reset all states
        setAdminCredentials({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
          email: ''
        });
        setAdminApprovalCode('');
        setPendingCredentials(null);
        
        // Close modals after 2 seconds
        setTimeout(() => {
          setShowAdminApproval(false);
          setShowAdminCredentialsModal(false);
          setAdminApprovalMessage('');
          setAdminCredentialsMessage('');
        }, 2000);
      } else {
        setAdminApprovalMessage('❌ ' + (data.message || 'Invalid admin approval code. Please check the code and try again.'));
      }
    } catch (error) {
      console.error('Error updating credentials after admin approval:', error);
      setAdminApprovalMessage('🌐 Network error occurred. Please check your connection and try again.');
    } finally {
      setAdminApprovalLoading(false);
    }
  };

  // Resend admin approval OTP
  const handleResendAdminApproval = async () => {
    if (!pendingCredentials) return;
    
    try {
      setAdminApprovalLoading(true);
      setAdminApprovalMessage('');
      
      const response = await fetch('/api/admin/send-admin-approval-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: pendingCredentials.currentPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdminApprovalMessage('📧 New admin approval code sent to your email. Please check your inbox.');
        setAdminApprovalCountdown(300); // Reset to 5 minutes
        setCanResendAdminApproval(false);
        setResendAdminApprovalCountdown(60); // 60 seconds before next resend
      } else {
        setAdminApprovalMessage('❌ ' + (data.message || 'Failed to resend admin approval code. Please try again in a moment.'));
      }
    } catch (error) {
      console.error('Error resending admin approval:', error);
      setAdminApprovalMessage('🌐 Network error occurred. Please check your connection and try again.');
    } finally {
      setAdminApprovalLoading(false);
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




  // Handle adding new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    if (!newStaffData.username.trim() || !newStaffData.password.trim()) {
      setAddStaffMessage('📝 Please fill in both Username and Password - these fields are required.');
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
        setAddStaffMessage('✅ Staff member registered successfully!');
        
        // Track new staff registration for notifications
        trackNewStudentRegistration({
          id: newStaffData.username,
          name: `Staff: ${newStaffData.username}`,
          department: 'Staff'
        });
        
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
        setAddStaffMessage('❌ ' + (data.error || 'Failed to register staff member. Please check the information and try again.'));
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      setAddStaffMessage('🌐 Network error occurred. Please check your internet connection and try again.');
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

  // Handle database configuration save
  const handleSaveDatabaseConfig = async (e) => {
    e.preventDefault();
    
    try {
      setDatabaseConfigLoading(true);
      setDatabaseConfigMessage('');
      
      const response = await fetch('/api/database/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(databaseConfig),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDatabaseConfigMessage('✅ Database configuration saved successfully!');
        setTimeout(() => {
          setDatabaseConfigMessage('');
        }, 3000);
      } else {
        setDatabaseConfigMessage('❌ ' + (data.error || 'Failed to save database configuration.'));
      }
    } catch (error) {
      console.error('Error saving database config:', error);
      setDatabaseConfigMessage('❌ Network error: ' + error.message);
    } finally {
      setDatabaseConfigLoading(false);
    }
  };

  // Handle GDPR data export
  const handleGDPRExport = async () => {
    try {
      setDatabaseConfigLoading(true);
      setDatabaseConfigMessage('');
      
      const response = await fetch('/api/database/gdpr-export', {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gdpr_data_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setDatabaseConfigMessage('✅ GDPR data export completed successfully!');
      } else {
        setDatabaseConfigMessage('❌ Failed to export GDPR data.');
      }
    } catch (error) {
      console.error('Error exporting GDPR data:', error);
      setDatabaseConfigMessage('❌ Network error during GDPR export.');
    } finally {
      setDatabaseConfigLoading(false);
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

  // Track new student registrations for notifications
  const trackNewStudentRegistration = (studentData) => {
    const newRegistration = {
      id: studentData.id,
      name: studentData.name,
      department: studentData.department,
      registeredAt: new Date()
    };
    
    setNewStudentRegistrations(prev => {
      // Keep only last 10 registrations to avoid memory issues
      const updated = [newRegistration, ...prev].slice(0, 10);
      return updated;
    });
    
    // Clear the registration after 24 hours
    setTimeout(() => {
      setNewStudentRegistrations(prev => 
        prev.filter(reg => reg.id !== studentData.id)
      );
    }, 24 * 60 * 60 * 1000); // 24 hours
  };

  // Handle data purge (GDPR compliance)
  const handleGDPRPurge = async () => {
    if (!window.confirm('Are you sure you want to purge old data according to retention policy? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDatabaseConfigLoading(true);
      setDatabaseConfigMessage('');
      
      const response = await fetch('/api/database/gdpr-purge', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDatabaseConfigMessage(`✅ Data purge completed. ${data.deletedRecords} records removed.`);
      } else {
        setDatabaseConfigMessage('❌ ' + (data.error || 'Failed to purge old data.'));
      }
    } catch (error) {
      console.error('Error purging data:', error);
      setDatabaseConfigMessage('❌ Network error during data purge.');
    } finally {
      setDatabaseConfigLoading(false);
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
              attendanceBlocked={attendanceBlocked}
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
              className={`nav-item ${activeSection === 'attendance' ? 'active' : ''} ${attendanceBlocked ? 'disabled' : ''}`}
              onClick={() => {
                if (attendanceBlocked) {
                  const timeText = mealWindowStatus.timeUntilOpen === 1 ? '1 minute' : `${mealWindowStatus.timeUntilOpen} minutes`;
                  alert(`Attendance is currently blocked. ${mealWindowStatus.mealType.charAt(0).toUpperCase() + mealWindowStatus.mealType.slice(1)} window opens in ${timeText}.`);
                  return;
                }
                setActiveSection('attendance');
              }}
            >
              <i className="fas fa-user-check"></i>
              <span>Attendance</span>
              {attendanceBlocked && <i className="fas fa-lock" style={{marginLeft: '8px', fontSize: '12px', color: '#f56565'}}></i>}
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
                  
                  {/* Search Section */}
                  <div className="search-section">
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                          ref={searchInputRef}
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
                    
                    <div className="feature-item clickable" onClick={() => setShowAdminCredentialsModal(true)}>
                      <i className="fas fa-user-shield"></i>
                      <span>Admin Credential</span>
                    </div>
                    
                    <div 
                      className="feature-item clickable"
                      onClick={() => setShowAddStaffModal(true)}
                    >
                      <i className="fas fa-users-cog"></i>
                      <span>Scanner Credential</span>
                    </div>
                    
                    <div 
                      className="feature-item clickable"
                      onClick={() => setShowDatabaseConfigModal(true)}
                    >
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
                
                {addStudentMessage && (
                  <div className={`modal-message ${addStudentMessage.includes('successfully') ? 'success' : 'error'}`}>
                    {addStudentMessage}
                  </div>
                )}
                
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
                
                {addStaffMessage && (
                  <div className={`modal-message ${addStaffMessage.includes('successfully') ? 'success' : 'error'}`}>
                    {addStaffMessage}
                  </div>
                )}
                
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
                
                {editStudentMessage && (
                  <div className={`modal-message ${editStudentMessage.includes('successfully') ? 'success' : 'error'}`}>
                    {editStudentMessage}
                  </div>
                )}
                
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
              
              <div className="settings-form" style={{textAlign: 'center', padding: '40px 20px'}}>
                <h4 className="mb-2" style={{color: '#2d3748', fontWeight: '600'}}>Check your inbox</h4>
                <p style={{color: '#666', fontSize: '14px', marginBottom: '30px'}}>
                  {emailVerificationMessage}
                </p>
                
                <VerificationCodeInput
                  value={otpCode}
                  onCodeChange={setOtpCode}
                  onComplete={(code) => {
                    setOtpCode(code);
                    // Auto-submit when complete
                    if (code.length === 6) {
                      handleVerifyOTP({ preventDefault: () => {} });
                    }
                  }}
                  error={otpCode.length > 0 && otpCode.length < 6}
                  disabled={otpLoading}
                />
                
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '20px'}}>
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
                
                <div className="d-flex justify-content-center">
                  <button 
                    type="button" 
                    onClick={() => setShowOTPModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#718096',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                  >
                    ← Back to Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Credentials Modal */}
      {showAdminCredentialsModal && !showAdminApproval && !showEmailVerification && (
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
                <div className={`modal-message ${adminCredentialsMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {adminCredentialsMessage}
                </div>
              )}
              
              <form onSubmit={handleUpdateAdminCredentials} className="settings-form">
                <div className="settings-section">
                  <h4>
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
                      />
                      <small style={{color: '#666', fontSize: '12px', marginTop: '4px'}}>
                        {adminCredentials.email && adminCredentials.email !== adminEmail ? 
                          'Email verification will be required for this change' : 
                          'Leave blank to keep current email'
                        }
                      </small>
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
                  
                  {/* Show verification code button if email change is pending */}
                  {pendingCredentials && pendingCredentials.email && pendingCredentials.email !== adminEmail && (
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setShowAdminCredentialsModal(false);
                        setShowEmailVerification(true);
                        setEmailVerificationMessage(`📧 Enter the 6-digit verification code sent to ${pendingCredentials.email}`);
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      <i className="fas fa-key"></i>
                      Enter Verification Code
                    </button>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn-register"
                    disabled={adminCredentialsLoading || !adminCredentials.currentPassword}
                  >
                    {adminCredentialsLoading || adminApprovalLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Sending Admin Approval...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-alt"></i>
                        Request Admin Approval
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approval Modal (Required for all credential updates) */}
      {showAdminApproval && (
        <div className="modal-overlay" onClick={() => setShowAdminApproval(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-shield-alt"></i>
                Admin Identity Verification
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowAdminApproval(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {adminApprovalMessage && (
                <div className={`modal-message ${adminApprovalMessage.includes('successfully') || adminApprovalMessage.includes('sent') ? 'success' : 'error'}`}>
                  {adminApprovalMessage}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleProceedAfterAdminApproval(); }} className="settings-form">
                <div className="settings-section">
                  <h4>
                    <i className="fas fa-user-shield"></i>
                    Verify Admin Identity
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
                    For security purposes, we need to verify your identity before making any credential changes. 
                    We've sent a verification code to your current admin email address.
                  </p>
                  
                  <div className="form-group">
                    <label>Admin Approval Code</label>
                    <input
                      type="text"
                      value={adminApprovalCode}
                      onChange={(e) => setAdminApprovalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                      {adminApprovalCountdown > 0 ? (
                        <>⏰ Code expires in: <strong>{formatTime(adminApprovalCountdown)}</strong></>
                      ) : (
                        <span style={{color: '#e53e3e'}}>⚠️ Code expired</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleResendAdminApproval}
                      disabled={!canResendAdminApproval || adminApprovalLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: canResendAdminApproval ? '#3182ce' : '#a0aec0',
                        cursor: canResendAdminApproval ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        textDecoration: 'underline'
                      }}
                    >
                      {resendAdminApprovalCountdown > 0 ? `Resend in ${resendAdminApprovalCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowAdminApproval(false);
                      setShowAdminCredentialsModal(true);
                    }}
                    disabled={adminApprovalLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-register"
                    disabled={adminApprovalLoading || adminApprovalCode.length !== 6 || adminApprovalCountdown === 0}
                  >
                    {adminApprovalLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-shield"></i>
                        Verify & Continue
                      </>
                    )}
                  </button>
                </div>
              </form>
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
                        <>⏰ Code expires in: <strong>{formatTime(verificationCountdown)}</strong></>
                      ) : (
                        <span style={{color: '#e53e3e'}}>⚠️ Code expired</span>
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
                      setShowAdminCredentialsModal(true);
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

      {/* Database Configuration Modal */}
      {showDatabaseConfigModal && (
        <div className="modal-overlay" onClick={() => setShowDatabaseConfigModal(false)}>
          <div className="modal-content database-config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-database"></i>
                Database Configuration
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowDatabaseConfigModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {databaseConfigMessage && (
                <div className={`modal-message ${databaseConfigMessage.includes('✅') ? 'success' : 'error'}`}>
                  {databaseConfigMessage}
                </div>
              )}
              
              <form onSubmit={handleSaveDatabaseConfig} className="database-config-form">
                {/* Connection Settings */}
                <div className="config-section">
                  <h4><i className="fas fa-plug"></i> Connection Settings</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>MongoDB Connection String</label>
                      <input
                        type="text"
                        value={databaseConfig.connectionString}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, connectionString: e.target.value})}
                        placeholder="mongodb://localhost:27017/meal_attendance"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Connection Pool Size</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={databaseConfig.connectionPoolSize}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, connectionPoolSize: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Connection Timeout (seconds)</label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={databaseConfig.connectionTimeout}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, connectionTimeout: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* Backup Settings */}
                <div className="config-section">
                  <h4><i className="fas fa-save"></i> Backup Settings</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Backup Schedule</label>
                      <select
                        value={databaseConfig.backupSchedule}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, backupSchedule: e.target.value})}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Backup Time</label>
                      <input
                        type="time"
                        value={databaseConfig.backupTime}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, backupTime: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Data Retention & Archive */}
                <div className="config-section">
                  <h4><i className="fas fa-archive"></i> Data Retention & Archive</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Data Retention (months)</label>
                      <input
                        type="number"
                        min="6"
                        max="60"
                        value={databaseConfig.dataRetentionMonths}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, dataRetentionMonths: parseInt(e.target.value)})}
                      />
                      <small>Keep attendance records for this duration</small>
                    </div>
                    <div className="form-group">
                      <label>Archive After (months)</label>
                      <input
                        type="number"
                        min="3"
                        max="24"
                        value={databaseConfig.archiveAfterMonths}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, archiveAfterMonths: parseInt(e.target.value)})}
                      />
                      <small>Move old records to archive storage</small>
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="config-section">
                  <h4><i className="fas fa-tachometer-alt"></i> Performance Settings</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={databaseConfig.cacheEnabled}
                          onChange={(e) => setDatabaseConfig({...databaseConfig, cacheEnabled: e.target.checked})}
                        />
                        Enable Caching
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Cache Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={databaseConfig.cacheDurationMinutes}
                        onChange={(e) => setDatabaseConfig({...databaseConfig, cacheDurationMinutes: parseInt(e.target.value)})}
                        disabled={!databaseConfig.cacheEnabled}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={databaseConfig.indexOptimization}
                          onChange={(e) => setDatabaseConfig({...databaseConfig, indexOptimization: e.target.checked})}
                        />
                        Enable Index Optimization
                      </label>
                      <small>Automatically optimize database queries</small>
                    </div>
                  </div>
                </div>

                {/* GDPR Compliance */}
                <div className="config-section">
                  <h4><i className="fas fa-shield-alt"></i> GDPR Compliance</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={databaseConfig.gdprCompliance}
                          onChange={(e) => setDatabaseConfig({...databaseConfig, gdprCompliance: e.target.checked})}
                        />
                        Enable GDPR Compliance Features
                      </label>
                      <small>Data export, deletion, and privacy controls</small>
                    </div>
                  </div>
                  
                  {databaseConfig.gdprCompliance && (
                    <div className="d-flex justify-content-center mt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowEmailVerification(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#718096',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        ← Back to Settings
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowDatabaseConfigModal(false)}
                  >
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Configuration
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
