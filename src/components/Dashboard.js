import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    weeklyAttendance: 0
  });
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
          weeklyAttendance: data.stats.weeklyAttendance || 0
        });
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
      setTimeout(() => {
        setRefreshMessage('');
      }, 3000);
    }
  };

  // Fetch current analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/dashboard/analytics');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAnalyticsData(data.analytics);
      } else {
        console.error('Analytics error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle student search
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

  // Load analytics data when reports section is opened
  React.useEffect(() => {
    if (activeSection === 'reports' && !analyticsData) {
      fetchAnalyticsData();
    }
  }, [activeSection]);

  // Auto-refresh analytics every 30 seconds when on reports page
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
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddStudentModal(false);
          setAddStudentMessage('');
        }, 2000);
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
          <div className="content-header">
            <div className="header-left-content">
              <h1>
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'attendance' && 'Meal Attendance'}
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

                  <div className="stat-card today-attendance">
                    <div className="stat-content">
                      <h3>TODAY'S ATTENDANCE</h3>
                      <div className="stat-number">{stats.todayAttendance}</div>
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
                        <span>Add New Students</span>
                      </button>
                      <button className="action-btn view-btn">
                        <i className="fas fa-users"></i>
                        <span>View All Students</span>
                      </button>
                    </div>

                    {/* Student Information Display - Positioned Absolutely */}
                    {searchResults.length > 0 && (
                      <div className="student-info-panel">
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
                    <div className="feature-item">
                      <i className="fas fa-cog"></i>
                      <span>General Settings</span>
                    </div>
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

      {/* Bottom Taskbar */}
      <div className="taskbar">
      </div>
    </div>
  );
};

export default Dashboard;
