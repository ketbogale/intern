import React, { useState, useEffect, useCallback, useRef } from 'react';
import './EmailChangeVerification.css';

const EmailChangeVerification = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const hasVerifiedRef = useRef(false);

  const verifyEmailChangeApproval = useCallback(async () => {
    if (hasVerifiedRef.current) return; // Prevent duplicate calls
    
    try {
      setLoading(true);
      hasVerifiedRef.current = true; // Mark as verified to prevent duplicate calls
      console.log('Verifying token:', token);
      console.log('Making request to:', `/api/admin/verify-email-change/${token}`);
      
      const response = await fetch(`/api/admin/verify-email-change/${token}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      console.log('Data success value:', data.success);
      console.log('Data success type:', typeof data.success);
      
      if (response.ok && data.success) {
        setSuccess(true);
        setNewEmail(data.newEmail);
        setMessage(data.message);
        
        // Redirect to dashboard immediately with verification modal trigger
        setTimeout(() => {
          window.location.href = '/?showEmailVerification=true&newEmail=' + encodeURIComponent(data.newEmail);
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Invalid or expired verification link');
      }
    } catch (error) {
      console.error('Error verifying email change approval:', error);
      setSuccess(false);
      setMessage('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyEmailChangeApproval();
    }
  }, [token, verifyEmailChangeApproval]);

  const handleReturnToDashboard = () => {
    window.location.href = '/';
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card">
        <div className="email-verification-header">
          <h1>🔐 Email Change Verification</h1>
        </div>
        
        <div className="email-verification-content">
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Verifying email change approval...</p>
            </div>
          ) : (
            <div className={`result-section ${success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {success ? '✅' : '❌'}
              </div>
              
              <div className="result-message">
                <p>{message}</p>
                
                {success && newEmail && (
                  <div className="success-details">
                    <p><strong>Next Step:</strong></p>
                    <p>A verification code has been sent to <strong>{newEmail}</strong></p>
                    <p>Please check your new email and enter the verification code in the dashboard settings to complete the email change.</p>
                  </div>
                )}
              </div>
              
              <div className="action-buttons">
                <button 
                  onClick={handleReturnToDashboard}
                  className="return-button"
                >
                  Return to Dashboard
                </button>
              </div>
              
              {success && (
                <div className="auto-redirect">
                  <p>You will be automatically redirected to the dashboard in 2 seconds to enter the verification code...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailChangeVerification;
