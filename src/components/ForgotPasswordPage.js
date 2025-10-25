import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Navbar } from 'react-bootstrap';
import './LoginPage.css';
import { API_BASE_URL } from '../config/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('danger');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setEmail('');
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

      {/* Forgot Password Form */}
      <Container fluid className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 76px)'}}>
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={5} xl={4}>
            <Card className="shadow-lg light-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <i className="fas fa-lock fs-1 text-primary mb-3"></i>
                  <h2 className="mb-2">Forgot Password?</h2>
                  <p className="opacity-75">
                    Enter your admin email address and we'll send you a link to reset your password.
                  </p>
                </div>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Admin Email Address:</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      required
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    className="w-100 mb-3"
                    variant="primary"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Reset Link
                      </>
                    )}
                  </Button>

                  <div className="text-center mt-2">
                    <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} className="text-muted text-decoration-none">
                      Back to Login
                    </a>
                  </div>
                </Form>

                {message && (
                  <Alert variant={messageType} className="mt-3">
                    {messageType === 'success' && <i className="fas fa-check-circle me-2"></i>}
                    {messageType === 'danger' && <i className="fas fa-exclamation-triangle me-2"></i>}
                    {message}
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

export default ForgotPasswordPage;
