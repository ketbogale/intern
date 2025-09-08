import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Navbar, InputGroup } from 'react-bootstrap';
import VerificationCodeInput from './VerificationCodeInput';
import './LoginPage.css';

// Constants
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const MESSAGES = {
  NETWORK_ERROR: '🌐 Network error occurred. Please check your internet connection and try again.',
  LOGIN_SUCCESS_WARNING: 'Login successful! Note: If you have other tabs open, they will be logged out automatically.',
  OTP_EXPIRED: '⏰ Verification code expired. Please request a new one to continue.',
  INVALID_OTP_LENGTH: '⚠️ Please enter the complete 6-digit verification code from your email.',
  EMAIL_REQUIRED: '📧 Please enter your admin email address to continue.'
};

// Utility functions

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const validateOTP = (otp) => /^\d{6}$/.test(otp);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// API utility
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    throw new Error(MESSAGES.NETWORK_ERROR);
  }
};

// Reusable components
const LoadingButton = ({ loading, loadingText, children, disabled, variant = "primary", ...props }) => (
  <Button disabled={disabled || loading} variant={variant} {...props}>
    {loading ? (
      <>
        <i className="fas fa-spinner fa-spin me-2" aria-hidden="true"></i>
        <span className="visually-hidden">Loading</span>
        {loadingText}
      </>
    ) : children}
  </Button>
);

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
  const [otpCountdown, setOtpCountdown] = useState(300);
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
            setOtpMessage(MESSAGES.OTP_EXPIRED);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // First check if admin credentials
      const { response: adminResponse, data: adminData } = await apiCall('/api/admin/check-credentials', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (adminResponse.ok && adminData.success) {
        setMessage('✅ Admin credentials verified! Redirecting to email verification...');
        setTimeout(() => {
          window.location.pathname = '/admin-email-verification';
        }, 1000);
      } else {
        // Try regular staff login
        const { response, data } = await apiCall('/api/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        if (response.ok && data.success && data.user) {
          setMessage(MESSAGES.LOGIN_SUCCESS_WARNING);
          setTimeout(() => onLogin(data.user), 1000);
        } else {
          setMessage(data.error || 'Login failed');
          setTimeout(() => setMessage(''), 2500);
        }
      }
    } catch (error) {
      setMessage(error.message || MESSAGES.NETWORK_ERROR);
      setTimeout(() => setMessage(''), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!validateOTP(otpCode)) {
      setOtpMessage(MESSAGES.INVALID_OTP_LENGTH);
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
        body: JSON.stringify({
          email: adminEmail,
          otp: otpCode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
        setOtpCode('');
        setOtpMessage('');
        onLogin(data.user);
      } else {
        setOtpMessage('❌ ' + (data.message || 'Invalid verification code. Please check the code and try again.'));
        setTimeout(() => setOtpMessage(''), 2500);
      }
    } catch (error) {
      setOtpMessage(error.message || MESSAGES.NETWORK_ERROR);
      setTimeout(() => setOtpMessage(''), 2500);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle email verification for admin
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    
    if (!adminEmail || !validateEmail(adminEmail)) {
      setEmailMessage(MESSAGES.EMAIL_REQUIRED);
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
        body: JSON.stringify({ email: adminEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmailMessage('✅ Verification code sent to your email. Please check your inbox.');
        setMaskedEmail(data.email);
        setShowEmailModal(false);
        setShowOTPModal(true);
        setOtpCountdown(300);
        setCanResendOTP(false);
        setResendCountdown(60);
      } else {
        setEmailMessage('❌ ' + (data.message || 'Invalid email address. Please check and try again.'));
      }
    } catch (error) {
      setEmailMessage(error.message || MESSAGES.NETWORK_ERROR);
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);
      setOtpMessage('');
      
      const { data } = await apiCall('/api/admin/resend-otp', {
        method: 'POST'
      });
      
      if (data.success) {
        setOtpMessage('📧 New verification code sent to your email. Please check your inbox.');
        setOtpCountdown(300);
        setCanResendOTP(false);
        setResendCountdown(60);
      } else {
        setOtpMessage('❌ ' + (data.message || 'Failed to resend verification code. Please try again in a moment.'));
      }
    } catch (error) {
      setOtpMessage(error.message || MESSAGES.NETWORK_ERROR);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #0f1419 0%, #1e2a3a 100%)'}}>
      {/* Header */}
      <Navbar bg="dark" variant="dark" className="px-4 shadow-sm" style={{background: 'rgba(30, 42, 58, 0.95) !important', backdropFilter: 'blur(10px)'}}>
        <Navbar.Brand className="d-flex align-items-center">
          <img 
            src="/images/salale_university_logo.png" 
            width="50" 
            height="50" 
            className="me-3" 
            alt="Salale University"
          />
          <h1 className="h4 mb-0 text-light">Salale University</h1>
        </Navbar.Brand>
        <div className="ms-auto">
          <i className="fas fa-utensils text-light fs-3"></i>
        </div>
      </Navbar>

      {/* Login Form */}
      <Container fluid className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 76px)'}}>
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0" style={{background: 'rgba(52, 73, 94, 0.9)', backdropFilter: 'blur(15px)'}}>
              <Card.Body className="p-4">
                <h2 className="text-center text-light mb-4">Sign In</h2>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Username:</Form.Label>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                      style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white'}}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Password:</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white'}}
                      />
                      <Button
                        variant="outline-light"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{border: '1px solid rgba(255,255,255,0.2)'}}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <LoadingButton 
                    type="submit" 
                    className="w-100 mb-3"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    loadingText="Logging in..."
                  >
                    Login
                  </LoadingButton>
                </Form>

                {message && (
                  <Alert variant={message.includes('successful') || message.includes('sent') ? 'success' : 'danger'} className="mt-3">
                    {message}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Email Verification Modal */}
      <Modal 
        show={showEmailModal} 
        onHide={() => setShowEmailModal(false)}
        backdrop="static"
        centered
        size="sm"
      >
        <Modal.Body className="p-0">
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px 32px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowEmailModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h4 style={{
              color: '#2d3748',
              fontWeight: '600',
              fontSize: '20px',
              marginBottom: '8px'
            }}>
              Admin Email Verification
            </h4>
            
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '32px',
              lineHeight: '1.5'
            }}>
              Please enter the email address associated with your admin account to receive a verification code
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter your admin email"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            {emailMessage && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: emailMessage.includes('sent') ? '#dbeafe' : '#fef3c7',
                color: emailMessage.includes('sent') ? '#1e40af' : '#92400e',
                fontSize: '14px',
                marginBottom: '24px'
              }}>
                {emailMessage}
              </div>
            )}
            
            <button
              onClick={handleEmailVerification}
              disabled={emailLoading || !adminEmail}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: emailLoading || !adminEmail ? '#d1d5db' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: emailLoading || !adminEmail ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '16px'
              }}
            >
              {emailLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
            
            <button
              onClick={() => setShowEmailModal(false)}
              disabled={emailLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              ← Back to Sign in
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal 
        show={showOTPModal} 
        onHide={() => setShowOTPModal(false)}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Admin Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h4 className="mb-2" style={{color: '#2d3748', fontWeight: '600'}}>Check your inbox</h4>
            <p className="text-muted mb-4" style={{fontSize: '14px'}}>
              Enter the verification code sent to<br/>
              <strong>{maskedEmail}</strong>
            </p>
            
            <VerificationCodeInput
              value={otpCode}
              onCodeChange={setOtpCode}
              onComplete={(code) => {
                setOtpCode(code);
                // Auto-submit when complete
                if (validateOTP(code)) {
                  handleVerifyOTP({ preventDefault: () => {} });
                }
              }}
              error={!validateOTP(otpCode) && otpCode.length > 0}
              disabled={otpLoading}
            />
            
            <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
              <small className="text-muted">
                {otpCountdown > 0 ? (
                  <>⏰ Expires in: <strong>{formatTime(otpCountdown)}</strong></>
                ) : (
                  <span className="text-danger">⚠️ Code expired</span>
                )}
              </small>
              
              <Button
                variant="link"
                size="sm"
                onClick={handleResendOTP}
                disabled={!canResendOTP || otpLoading}
                className="p-0"
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </Button>
            </div>
            
            {otpMessage && (
              <Alert variant={otpMessage.includes('successful') || otpMessage.includes('sent') ? 'info' : 'warning'} className="mb-3">
                {otpMessage}
              </Alert>
            )}
            
            <div className="d-flex justify-content-center mt-3">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowOTPModal(false)}
                disabled={otpLoading}
                style={{color: '#718096'}}
              >
                ← Back to Sign in
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LoginPage;
