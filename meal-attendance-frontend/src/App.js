import React, { useState } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import AttendancePage from './components/AttendancePage';

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

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <AttendancePage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
