import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VerificationCodeInput from './VerificationCodeInput';

const EmailVerificationCode = () => {
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get new email from URL parameters or location state
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('newEmail');
    const emailFromState = location.state?.newEmail;
    
    const email = emailFromUrl || emailFromState;
    if (email) {
      setNewEmail(email);
      setOtpMessage(`📧 Enter the 6-digit verification code sent to ${email}`);
    } else {
      setOtpMessage('❌ No email address provided. Please try the verification process again.');
    }
  }, [location]);

  const handleOTPVerification = async (otpValue) => {
    if (otpValue.length !== 6) return;
    
    setOtpLoading(true);
    setOtpMessage('');

    try {
      const response = await fetch('/api/admin/verify-email-change-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otpValue,
          newEmail: newEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpMessage('✅ Email verification successful! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setOtpMessage('❌ ' + (data.message || 'Invalid verification code. Please check and try again.'));
        setOtp('');
      }
    } catch (error) {
      setOtpMessage('❌ Connection error. Please check your internet connection and try again.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!newEmail) {
      setOtpMessage('❌ No email address available for resend.');
      return;
    }

    setResendLoading(true);
    setOtpMessage('');

    try {
      const response = await fetch('/api/admin/resend-email-change-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail: newEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpMessage('✅ New verification code sent! Check your email for the latest code.');
      } else {
        setOtpMessage('❌ ' + (data.message || 'Unable to resend code. Please try again in a moment.'));
      }
    } catch (error) {
      setOtpMessage('❌ Connection error. Please check your internet connection and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5eddd',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }} />
      
      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px 40px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <h1 style={{
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '28px',
            marginBottom: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Verify New Email
          </h1>
          
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Enter code sent to<br />
            <span style={{ color: '#1f2937', fontWeight: '500' }}>{newEmail}</span>
          </p>
          
          <div style={{ marginBottom: '32px' }}>
            <VerificationCodeInput
              value={otp}
              onChange={setOtp}
              onComplete={handleOTPVerification}
              disabled={otpLoading}
            />
          </div>
          
          {otpMessage && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: otpMessage.includes('sent') || otpMessage.includes('successfully') || otpMessage.includes('✅') ? '#dcfce7' : '#fef3c7',
              color: otpMessage.includes('sent') || otpMessage.includes('successfully') || otpMessage.includes('✅') ? '#166534' : '#92400e',
              fontSize: '14px',
              marginBottom: '32px',
              border: `1px solid ${otpMessage.includes('sent') || otpMessage.includes('successfully') || otpMessage.includes('✅') ? '#bbf7d0' : '#fde68a'}`
            }}>
              {otpMessage}
            </div>
          )}
          
          
          <div style={{ marginBottom: '24px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Didn't receive the code? Check your spam folder or 
            </span>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || !newEmail}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                cursor: resendLoading || !newEmail ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                marginLeft: '4px'
              }}
            >
              {resendLoading ? 'Sending...' : 'resend'}
            </button>
          </div>
          
          <button
            onClick={() => navigate('/')}
            disabled={otpLoading || resendLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: '#10b981',
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
              e.target.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#10b981';
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationCode;
