import React, { useState } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import AttendancePage from './components/AttendancePage';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const renderUserInterface = () => {
    if (!user) return null;

    // Role-based routing
    switch (user.role) {
      case 'admin':
        return <Dashboard user={user} onLogout={handleLogout} />;
      case 'scanner':
        return <AttendancePage user={user} onLogout={handleLogout} />;
      default:
        return (
          <div className="error-container">
            <h2>Access Denied</h2>
            <p>Invalid user role. Please contact administrator.</p>
            <button onClick={handleLogout}>Back to Login</button>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        renderUserInterface()
      )}
    </div>
  );
}

export default App;
