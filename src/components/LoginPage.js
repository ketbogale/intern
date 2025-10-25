import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Navbar } from 'react-bootstrap';
import './LoginPage.css';
import { API_BASE_URL } from '../config/api';
const MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your internet connection and try again.',
  OTP_EXPIRED: 'Verification code expired. Please request a new one to continue.',
  INVALID_OTP_LENGTH: 'Please enter the complete 6-digit verification code from your email.',
  EMAIL_REQUIRED: 'Please enter your admin email address to continue.'
};

// Utility functions

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
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showHelp, setShowHelp] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // No OTP/email modal logic needed here; admin email verification uses a dedicated route/component

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
        // Direct navigation to admin email verification
        setTimeout(() => { window.location.href = '/admin-email-verification'; }, 800);
      } else {
        // Try regular staff login
        const { response, data } = await apiCall('/api/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        if (response.ok && data.success && data.user) {
          // Navigate based on role directly
          setTimeout(() => {
            if (data.user.role === 'admin') {
              window.location.href = '/dashboard';
            } else if (data.user.role === 'scanner') {
              window.location.href = '/attendance';
            } else {
              window.location.href = '/';
            }
          }, 800);
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

  // Help: fetch admin phone and open modal
  const openHelp = async () => {
    try {
      setHelpLoading(true);
      setHelpError('');
      setAdminPhone('');
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (res.ok && data && data.success) {
        setAdminPhone(data.phone || '');
      } else {
        setHelpError(data && data.message ? data.message : 'Unable to load admin contact.');
      }
    } catch (e) {
      setHelpError('Network error while loading contact.');
    } finally {
      setHelpLoading(false);
      setShowHelp(true);
    }
  };

  // No OTP/email handlers here; dedicated verification pages handle that flow


  // Main render
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
          <i className="fas fa-utensils text-dark fs-3"></i>
        </div>
      </Navbar>

      {/* Login Form */}
      <Container fluid className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 76px)'}}>
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={5} xl={4}>
            <Card className="shadow-lg light-card">
              <Card.Body className="p-4">
                <h2 className="text-center mb-4">Sign In</h2>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username:</Form.Label>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-baseline" style={{ flexWrap: 'nowrap', columnGap: '8px' }}>
                      <Form.Label className="mb-0">Password:</Form.Label>
                      <Button
                        variant="link"
                        className="p-0 forgot-link"
                        onClick={() => { window.location.href = '/forgot-password'; }}
                        disabled={isLoading}
                        style={{ textDecoration: 'none', color: '#0d6efd', whiteSpace: 'nowrap', lineHeight: 1, fontSize: '10px', padding: 0, minHeight: 0 }}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
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

                

                <div className="text-center mt-2">
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={openHelp}
                    disabled={isLoading}
                  >
                    <i className="fas fa-question-circle me-2"></i>
                    Need help? Contact admin
                  </Button>
                </div>

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

    {/* Admin email/OTP verification handled on dedicated routes; no modals here */}

    {/* Help Modal */}
    <Modal 
      show={showHelp}
      onHide={() => setShowHelp(false)}
      centered
    >
      <div style={{background: 'rgba(52, 73, 94, 0.95)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px'}}>
        <Modal.Header closeButton style={{borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent'}}>
          <Modal.Title style={{color: 'white'}}>Contact Administrator</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'transparent'}}>
          {helpLoading ? (
            <div className="text-center" style={{color: 'white'}}>
              <i className="fas fa-spinner fa-spin me-2"></i> Loading contact...
            </div>
          ) : helpError ? (
            <Alert variant="warning" className="mb-0">{helpError}</Alert>
          ) : adminPhone ? (
            <div className="text-center">
              <div className="mb-2" style={{color: 'rgba(255,255,255,0.9)'}}>Administrator Phone</div>
              <a href={`tel:${adminPhone}`} className="btn btn-success">
                <i className="fas fa-phone-alt me-2"></i> Call {adminPhone}
              </a>
            </div>
          ) : (
            <div className="text-center" style={{color: 'rgba(255,255,255,0.9)'}}>No phone number available. Please contact your system administrator.</div>
          )}
        </Modal.Body>
      </div>
    </Modal>
    </div>
  );
};

export default LoginPage;
