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

  // Export function - can be used in reports section if needed
  // const handleExportData = async () => {
  //   try {
  //     const response = await fetch('/api/dashboard/export');
  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
  //     document.body.appendChild(a);
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);
  //   } catch (error) {
  //     console.error('Error exporting data:', error);
  //   }
  // };

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
      </div>

      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <div className="sidebar">
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
                {activeSection === 'reports' && 'Reports'}
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
                  <div className="feature-list">
                    <div className="feature-item">
                      <i className="fas fa-user-plus"></i>
                      <span>Add New Students</span>
                    </div>
                    <div className="feature-item">
                      <i className="fas fa-search"></i>
                      <span>Search Students</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'reports' && (
              <>
                <div className="reports-section">
                  <h2>Reports & Analytics</h2>
                  <div className="feature-list">
                    <div className="feature-item">
                      <i className="fas fa-chart-bar"></i>
                      <span>Attendance Analytics</span>
                    </div>
                    <div className="feature-item">
                      <i className="fas fa-download"></i>
                      <span>Export Reports</span>
                    </div>
                  </div>
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
        <div className="taskbar-left">
          <div className="taskbar-item active">
            <i className="fas fa-home"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
