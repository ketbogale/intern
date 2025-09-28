import React from 'react';
import { Container, Row, Col, Card, Button, Navbar } from 'react-bootstrap';
import './HomePage.css';

const HomePage = () => {
  const goToLogin = () => {
    window.location.href = '/login_meal_attendance';
  };

  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #0f1419 0%, #1e2a3a 100%)'}}>
      {/* Header to match LoginPage */}
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

      {/* Centered card like LoginPage */}
      <Container fluid className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 76px)'}}>
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={10} md={8} lg={7} xl={6} xxl={5}>
            <Card className="shadow-lg border-0" style={{background: 'rgba(52, 73, 94, 0.9)', backdropFilter: 'blur(15px)'}}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-center mb-3">
                  <img
                    src="/images/salale_university_logo.png"
                    alt="Salale University"
                    width="72"
                    height="72"
                    style={{ borderRadius: '0px' }}
                  />
                </div>
                <h2
                  className="text-center text-light mb-1 hero-title-animated"
                  style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '0.2px' }}
                >
                  Welcome to the official Salale University meal tracking system
                </h2>
                <p className="text-center mb-4" style={{color: 'rgba(255, 255, 255, 0.85)'}}>
                  Track attendance, manage students, and configure settings in one place.
                </p>

                <div className="d-flex justify-content-center">
                  <Button
                    variant="primary"
                    size="sm"
                    className="px-3"
                    onClick={goToLogin}
                  >
                    Go to Login
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
