import React, { useState, useMemo } from 'react';
import './EmailChangeVerification.css';

const ScannerCredentialsUpdate = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [staffData, setStaffData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasLetterOrNumber: false
  });

  // Memoize password validation result to prevent infinite re-renders
  const isPasswordValid = useMemo(() => {
    return Object.values(passwordValidation).every(Boolean);
  }, [passwordValidation]);

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 6,
      hasLetterOrNumber: /[a-zA-Z0-9]/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setStaffData({...staffData, password: newPassword});
    validatePassword(newPassword);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    if (!staffData.username.trim() || !staffData.password.trim()) {
      setMessage('Please fill in both Username and Password - these fields are required.');
      setSuccess(false);
      return;
    }

    if (!isPasswordValid) {
      setMessage('Password does not meet security requirements. Please check the requirements below.');
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/staff/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage('Scanner credentials updated successfully!');
        setTimeout(() => {
          setStaffData({
            username: '',
            password: ''
          });
          setMessage('');
          setSuccess(false);
        }, 2500);
      } else {
        setSuccess(false);
        setMessage('Failed to register staff member: ' + (data.error || 'Please check the information and try again.'));
        setTimeout(() => setMessage(''), 2500);
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error occurred. Please check your internet connection and try again.');
      setTimeout(() => setMessage(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '450px' }}>
        <div className="email-verification-header">
          <h1>Scanner Credential</h1>
        </div>
        
        <div className="email-verification-content">
          {message && (
            <div className={`result-section ${success ? 'success' : 'error'}`}>
              <div className="result-message">
                <p>{message}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleAddStaff} className="form-section">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={staffData.username}
                onChange={(e) => setStaffData({...staffData, username: e.target.value})}
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={staffData.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
                  style={{ paddingRight: '45px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password Requirements */}
              {staffData.password && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Password Requirements:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      color: passwordValidation.length ? '#059669' : '#6b7280'
                    }}>
                      <span style={{ marginRight: '6px', fontSize: '12px' }}>
                        {passwordValidation.length ? '●' : '○'}
                      </span>
                      At least 6 characters
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      color: passwordValidation.hasLetterOrNumber ? '#059669' : '#6b7280'
                    }}>
                      <span style={{ marginRight: '6px', fontSize: '12px' }}>
                        {passwordValidation.hasLetterOrNumber ? '●' : '○'}
                      </span>
                      Contains letters or numbers
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleBackToDashboard}
                style={{
                  flex: '1',
                  padding: '16px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={loading || !staffData.username.trim() || !staffData.password.trim() || !isPasswordValid}
                style={{
                  flex: '1',
                  padding: '16px 24px',
                  backgroundColor: loading || !staffData.username.trim() || !staffData.password.trim() || !isPasswordValid ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || !staffData.username.trim() || !staffData.password.trim() || !isPasswordValid ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!loading && staffData.username.trim() && staffData.password.trim() && isPasswordValid) {
                    e.target.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && staffData.username.trim() && staffData.password.trim() && isPasswordValid) {
                    e.target.style.backgroundColor = '#10b981';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
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
  );
};

export default ScannerCredentialsUpdate;
