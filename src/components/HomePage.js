import React from 'react';
import { Navbar } from 'react-bootstrap';
import './HomePage.css';

const HomePage = () => {
  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div
      className="min-vh-100 app-light-bg"
    >
      {/* Header to match LoginPage */}
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
          <a href="/login" onClick={(e)=>{ e.preventDefault(); goToLogin(); }} className="text-dark fw-semibold text-decoration-none">
            <i className="fas fa-right-to-bracket me-2"></i>
            Login
          </a>
        </div>
      </Navbar>
      
      {/* Hero section with logo and welcome text */}
      <div className="container py-5">
        <div className="text-center hero-content">
          <img
            src="/images/salale_university_logo.png"
            alt="Salale University"
            className="hero-logo mb-3"
            style={{ borderRadius: '0px' }}
          />
          <h2 className="mb-2 hero-title">
            Welcome to the official Salale University meal tracking system
          </h2>
          <p className="hero-subtitle">
            Track attendance, manage students, and configure settings in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

