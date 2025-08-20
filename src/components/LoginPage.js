import React, { useState, useEffect } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Admin email verification states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  
  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');

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

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // First check if admin credentials (username/password only)
      const adminCheckResponse = await fetch('/api/admin/check-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const adminCheckData = await adminCheckResponse.json();

      if (adminCheckResponse.ok && adminCheckData.success) {
        // Admin credentials valid - show email prompt
        setMessage('Admin credentials verified. Please enter your email.');
        setShowEmailModal(true);
      } else {
        // Try regular staff login
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMessage('Login successful!');
          onLogin(data.user);
        } else {
          setMessage(data.error || 'Login failed');
        }
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
        
        // Close OTP modal and login
        setTimeout(() => {
          setShowOTPModal(false);
          setOtpCode('');
          setOtpMessage('');
          onLogin(data.user);
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

  // Handle email verification for admin
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    
    if (!adminEmail) {
      setEmailMessage('Please enter your email address');
      return;
    }
    
    try {
      setEmailLoading(true);
      setEmailMessage('');
      
      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email: adminEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmailMessage('Verification code sent to your email');
        setMaskedEmail(data.email);
        setShowEmailModal(false);
        setShowOTPModal(true);
        setOtpCountdown(300);
        setCanResendOTP(false);
        setResendCountdown(60);
      } else {
        setEmailMessage(data.message || 'Invalid email address');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setEmailMessage('Network error. Please try again.');
    } finally {
      setEmailLoading(false);
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
        setOtpCountdown(300);
        setCanResendOTP(false);
        setResendCountdown(60);
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

  return (
    <div className="login-container">
      <div className="head-row">
        <img src="/images/salale_university_logo.png" alt="Salale University" />
        <h1>Salale University</h1>
        <i className="material-icons cafeteria-icon">restaurant</i>
      </div>

      <div className="container">
        <div className="header">
          <img src="/images/salale_university_logo.png" alt="Salale University Logo" />
          <h2>Salale University Meal <br />Attendance System</h2>
        </div>

        <div className="login-box">
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <label htmlFor="password">Password:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>


            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging...' : 'Login'}
            </button>
          </form>

          {message && (
            <div className={`login-message ${message.includes('successful') || message.includes('sent') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Email Verification Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-envelope"></i>
                Admin Email Verification
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowEmailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {emailMessage && (
                <div className={`modal-message ${emailMessage.includes('sent') ? 'success' : 'error'}`}>
                  {emailMessage}
                </div>
              )}
              
              <form onSubmit={handleEmailVerification} className="email-form">
                <div className="email-section">
                  <h4>
                    <i className="fas fa-user-shield"></i>
                    Enter Your Admin Email
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
                    Please enter the email address associated with your admin account
                  </p>
                  
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      className="email-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="email-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowEmailModal(false)}
                    disabled={emailLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-verify"
                    disabled={emailLoading || !adminEmail}
                  >
                    {emailLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      'Send Verification Code'
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
                Admin Verification
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
              
              <form onSubmit={handleVerifyOTP} className="otp-form">
                <div className="otp-section">
                  <h4>
                    <i className="fas fa-envelope"></i>
                    Enter Verification Code
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
                    We've sent a 6-digit verification code to <strong>{maskedEmail}</strong>
                  </p>
                  
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      className="otp-input"
                      required
                    />
                  </div>
                  
                  <div className="otp-footer">
                    <div className="countdown-info">
                      {otpCountdown > 0 ? (
                        <>⏰ Expires in: <strong>{formatTime(otpCountdown)}</strong></>
                      ) : (
                        <span style={{color: '#e53e3e'}}>⚠️ Code expired</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResendOTP || otpLoading}
                      className="resend-btn"
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
                
                <div className="otp-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowOTPModal(false)}
                    disabled={otpLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-verify"
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
    </div>
  );
};

export default LoginPage;
