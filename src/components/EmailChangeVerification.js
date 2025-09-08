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
      const response = await fetch(`/api/admin/verify-email-change/${token}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        setNewEmail(data.newEmail);
        setMessage(data.message);
        
        // Redirect immediately to email verification code page
        window.location.href = '/email-verification?newEmail=' + encodeURIComponent(data.newEmail);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Invalid or expired verification link');
      }
    } catch (error) {
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
          <h1>Email Verification Required</h1>
        </div>
        
        <div className="email-verification-content">
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Verifying email change approval...</p>
            </div>
          ) : (
            <>
              <div className="result-section" style={{ marginBottom: '24px' }}>
                <div className="result-message">
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '16px', 
                    margin: '0',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>{success ? 'Email change approval sent successfully!' : ''}</p>
                </div>
              </div>
              
              {!success && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                marginBottom: '32px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ color: '#dc2626', fontSize: '20px' }}></div>
                <p style={{ 
                  margin: '0', 
                  color: '#dc2626',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>{message}</p>
              </div>
            )}
            
            {success && newEmail && (
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <p style={{ 
                  margin: '0', 
                  color: '#166534',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>Check your current email for the approval link and then click on the link to verify your email, then enter the verification code sent to</p>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: '#166534',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>{newEmail}</p>
              </div>
              )}
              
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleReturnToDashboard}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailChangeVerification;
