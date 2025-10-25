import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Navbar } from 'react-bootstrap';
import './LoginPage.css';
import { API_BASE_URL } from '../config/api';

const ResetPasswordPage = () => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMessageType('danger');
      setIsVerifying(false);
    }
  }, []);

  const verifyToken = async (tokenParam) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token/${tokenParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setEmail(data.email);
        setMessage('');
      } else {
        setMessage(data.message || 'Invalid or expired reset token.');
        setMessageType('danger');
        setTokenValid(false);
      }
    } catch (error) {
      setMessage('Network error occurred. Please check your internet connection and try again.');
      setMessageType('danger');
      setTokenValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage(passwordError);
      setMessageType('danger');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('danger');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setMessage(data.message || 'An error occurred. Please try again.');
        setMessageType('danger');
      }
    } catch (error) {
      setMessage('Network error occurred. Please check your internet connection and try again.');
      setMessageType('danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/login';
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&])/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'weak', color: '#dc3545', text: 'Weak' };
    return { level: 'strong', color: '#28a745', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (isVerifying) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center app-light-bg">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin fs-1 mb-3"></i>
          <h4>Verifying reset token...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 app-light-bg">
      {/* Header */}
      <Navbar className="px-4 shadow-sm mint-header">
        <Navbar.Brand className="d-flex align-items-center">
          <img 
            src="/images/salale_university_logo.png" 
            width="50" 
            height="50" 
            className="me-3" 
            alt="Salale University"
          />
          <h1 className="h4 mb-0 text-dark">Salale University</h1>
        </Navbar.Brand>
        <div className="ms-auto">
          <i className="fas fa-key text-dark fs-3"></i>
        </div>
      </Navbar>

      {/* Reset Password Form */}
      <Container fluid className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 76px)'}}>
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={5} xl={4}>
            <Card className="shadow-lg light-card">
              <Card.Body className="p-4">
                {tokenValid ? (
                  <>
                    <div className="text-center mb-4">
                      <i className="fas fa-shield-alt fs-1 text-success mb-3"></i>
                      <h2 className="mb-2">Reset Password</h2>
                      <p className="opacity-75">
                        Enter your new password for: <strong>{email}</strong>
                      </p>
                    </div>
                    
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>New Password:</Form.Label>
                        <div style={{ position: 'relative' }}>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            style={{ paddingRight: '45px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        {newPassword && (
                          <div className="mt-2">
                            <small>
                              Password strength: 
                              <span style={{color: passwordStrength.color, fontWeight: 'bold', marginLeft: '5px'}}>
                                {passwordStrength.text}
                              </span>
                            </small>
                            <div className="progress mt-1" style={{height: '4px'}}>
                              <div 
                                className="progress-bar" 
                                style={{
                                  width: `${passwordStrength.level === 'weak' ? 30 : 100}%`,
                                  backgroundColor: passwordStrength.color
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password:</Form.Label>
                        <div style={{ position: 'relative' }}>
                          <Form.Control
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            style={{ paddingRight: '45px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                            {showConfirmPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <small className="text-danger mt-1 d-block">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Passwords do not match
                          </small>
                        )}
                      </Form.Group>


                      <Button 
                        type="submit" 
                        className="w-100 mb-3"
                        variant="success"
                        size="lg"
                        disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            Resetting Password...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check me-2"></i>
                            Reset Password
                          </>
                        )}
                      </Button>
                    </Form>
                  </>
                ) : (
                  <div className="text-center">
                    <i className="fas fa-exclamation-triangle fs-1 text-warning mb-3"></i>
                    <h2 className="mb-3">Invalid Reset Link</h2>
                    <p className="opacity-75 mb-4">
                      This password reset link is invalid or has expired. Please request a new one.
                    </p>
                  </div>
                )}

                <div className="text-center mt-2">
                  <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} className="text-muted text-decoration-none">
                    Back to Login
                  </a>
                </div>

                {message && (
                  <Alert variant={messageType} className="mt-3">
                    {messageType === 'success' && <i className="fas fa-check-circle me-2"></i>}
                    {messageType === 'danger' && <i className="fas fa-exclamation-triangle me-2"></i>}
                    {message}
                    {messageType === 'success' && (
                      <div className="mt-2">
                        <small>Redirecting to login page in 3 seconds...</small>
                      </div>
                    )}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResetPasswordPage;
