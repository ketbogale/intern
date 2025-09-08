import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import AttendancePage from './components/AttendancePage';
import Dashboard from './components/Dashboard';
import EmailChangeVerification from './components/EmailChangeVerification';
import AdminEmailVerification from './components/AdminEmailVerification';
import AdminOTPVerification from './components/AdminOTPVerification';
import EmailVerificationCode from './components/EmailVerificationCode';
import AdminCredentialsUpdate from './components/AdminCredentialsUpdate';
import AddStudent from './components/AddStudent';
import ScannerCredentialsUpdate from './components/ScannerCredentialsUpdate';
import SearchStudent from './components/SearchStudent';
import ViewAllStudents from './components/ViewAllStudents';

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication status on app load and when tab becomes visible
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for tab visibility changes to refresh auth status
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Checking auth status
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Response received
      
      if (response.ok) {
        const data = await response.json();
        // Auth data received
        
        if (data.isAuthenticated && data.user && data.user.role) {
          // Setting authenticated user
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          // No valid auth data
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        // Auth request failed
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      // Auth error occurred
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Another small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      // Logout error occurred
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login_meal_attendance', { replace: true });
    }
  };

  // Handle role-based navigation
  useEffect(() => {
    if (isLoggedIn && user && (location.pathname === '/' || location.pathname === '/login_meal_attendance')) {
      // Role-based navigation triggered
      
      switch (user.role) {
        case 'admin':
          // Admin detected - navigating to dashboard
          navigate('/dashboard', { replace: true });
          break;
        case 'scanner':
          // Scanner detected - navigating to meal_attendance
          navigate('/meal_attendance', { replace: true });
          break;
        default:
          // Invalid or unknown role
          break;
      }
    } else {
      // Navigation conditions not met
    }
  }, [isLoggedIn, user, location.pathname, navigate]);


  // Show loading spinner while checking authentication or logging out
  if (isCheckingAuth || isLoggingOut) {
    return (
      <div className="App">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>{isLoggingOut ? 'Logging out...' : 'Checking authentication...'}</p>
        </div>
      </div>
    );
  }

  // Check current URL for special routes
  const currentPath = location.pathname;
  const isEmailVerificationRoute = currentPath.startsWith('/admin/verify-email-change/');
  
  // Handle special routes
  if (isEmailVerificationRoute) {
    const token = currentPath.split('/admin/verify-email-change/')[1];
    return (
      <div className="App">
        <EmailChangeVerification token={token} />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Specific routes first - these take precedence */}
        <Route path="/dashboard" element={
          !isLoggedIn ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <Dashboard user={user} onLogout={handleLogout} />
          )
        } />
        <Route path="/meal_attendance" element={
          !isLoggedIn ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <AttendancePage user={user} onLogout={handleLogout} />
          )
        } />
        
        {/* Other specific routes */}
        <Route path="/admin-email-verification" element={<AdminEmailVerification />} />
        <Route path="/admin-otp-verification" element={<AdminOTPVerification />} />
        <Route path="/email-verification" element={<EmailVerificationCode />} />
        <Route path="/admin-credentials" element={<AdminCredentialsUpdate />} />
        <Route path="/add-student" element={<AddStudent />} />
        <Route path="/scanner-credentials" element={<ScannerCredentialsUpdate />} />
        <Route path="/search-student" element={<SearchStudent />} />
        <Route path="/view-all-students" element={<ViewAllStudents />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/login_meal_attendance" element={<LoginPage onLogin={handleLogin} />} />
        
        {/* Root route redirects to login_meal_attendance */}
        <Route path="/" element={
          <Navigate to="/login_meal_attendance" replace />
        } />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
