import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import AttendancePage from './components/AttendancePage';
import Dashboard from './components/Dashboard';
import EmailChangeVerification from './components/EmailChangeVerification';
import AdminEmailVerification from './components/AdminEmailVerification';
import AdminOTPVerification from './components/AdminOTPVerification';
import EmailVerificationCode from './components/EmailVerificationCode';

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const location = useLocation();

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
      console.log('🔍 Checking auth status...');
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Auth data:', data);
        
        console.log('🔍 Auth data details:', {
          isAuthenticated: data.isAuthenticated,
          hasUser: !!data.user,
          userRole: data.user?.role,
          fullData: data
        });
        
        if (data.isAuthenticated && data.user && data.user.role) {
          console.log('✅ Setting user with role:', data.user.role);
          console.log('✅ Full user data:', data.user);
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          console.log('❌ No valid auth data - isAuthenticated:', data.isAuthenticated, 'user:', data.user);
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        console.log('❌ Auth request failed');
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
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
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const renderUserInterface = () => {
    if (!user) {
      console.log('❌ No user data for rendering');
      return null;
    }

    console.log('🎯 Rendering interface for user role:', user.role);
    console.log('🎯 User object:', user);

    // Role-based routing
    switch (user.role) {
      case 'admin':
        console.log('📊 Rendering Dashboard for admin');
        return <Dashboard user={user} onLogout={handleLogout} />;
      case 'scanner':
        console.log('📱 Rendering AttendancePage for scanner');
        return <AttendancePage user={user} onLogout={handleLogout} />;
      default:
        console.log('❌ Invalid role:', user.role);
        return (
          <div className="error-container">
            <h2>Access Denied</h2>
            <p>Invalid user role: {user.role}. Please contact administrator.</p>
            <button onClick={handleLogout}>Back to Login</button>
          </div>
        );
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="App">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
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
        <Route path="/admin-email-verification" element={<AdminEmailVerification />} />
        <Route path="/admin-otp-verification" element={<AdminOTPVerification />} />
        <Route path="/email-verification" element={<EmailVerificationCode />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={
          !isLoggedIn ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            renderUserInterface()
          )
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
