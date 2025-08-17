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
                  <h2>Student Management</h2>
                  
                  {/* Search Section */}
                  <div className="search-section">
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                          type="text"
                          placeholder="Search by Student ID or Name..."
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
                      <button className="action-btn add-btn">
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
                  <h2>System Settings</h2>
                  <div className="feature-list">
                    <div className="feature-item">
                      <i className="fas fa-cog"></i>
                      <span>General Settings</span>
                    </div>
                    <div className="feature-item">
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

      {/* Bottom Taskbar */}
      <div className="taskbar">
      </div>
    </div>
  );
};

export default Dashboard;
