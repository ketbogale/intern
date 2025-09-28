import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VerificationCodeInput from './VerificationCodeInput';

const AdminOTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const adminEmail = location.state?.email || '';

  const handleOTPVerification = async (otpValue) => {
    if (otpValue.length !== 6) return;
    
    setOtpLoading(true);
    setOtpMessage('');

    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          otp: otpValue
        })
      });

      const data = await response.json();

      if (data.success) {
        // Go directly to dashboard after session is set
        window.location.pathname = '/dashboard';
      } else {
        setOtpMessage('❌ ' + (data.message || 'Invalid verification code. Please check and try again.'));
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpMessage('❌ Connection error. Please check your internet connection and try again.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setOtpMessage('');

    try {
      const response = await fetch('/api/admin/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setOtpMessage('✅ New verification code sent! Check your email for the latest code.');
      } else {
        setOtpMessage('❌ ' + (data.message || 'Unable to resend code. Please try again in a moment.'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpMessage('❌ Connection error. Please check your internet connection and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5eddd',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h1 style={{
          color: '#374151',
          fontWeight: '600',
          fontSize: '24px',
          marginBottom: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Enter Verification Code
        </h1>
        
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '8px',
          lineHeight: '1.5'
        }}>
          We've sent a 6-digit verification code to
        </p>
        <p style={{
          color: '#374151',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          {adminEmail}
        </p>
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          The code will expire in 10 minutes
        </p>
        
        <div style={{ marginBottom: '32px' }}>
          <VerificationCodeInput
            value={otp}
            onCodeChange={setOtp}
            onComplete={handleOTPVerification}
            disabled={otpLoading}
          />
        </div>
        
        {otpMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: otpMessage.includes('sent') || otpMessage.includes('successfully') ? '#dcfce7' : '#fef3c7',
            color: otpMessage.includes('sent') || otpMessage.includes('successfully') ? '#166534' : '#92400e',
            fontSize: '14px',
            marginBottom: '24px',
            border: `1px solid ${otpMessage.includes('sent') || otpMessage.includes('successfully') ? '#bbf7d0' : '#fde68a'}`
          }}>
            {otpMessage}
          </div>
        )}
        
        <button
          onClick={() => handleOTPVerification(otp)}
          disabled={otpLoading || otp.length !== 6}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: otpLoading || otp.length !== 6 ? '#d1d5db' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: otpLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            if (!otpLoading && otp.length === 6) {
              e.target.style.backgroundColor = '#6b7280';
            }
          }}
          onMouseLeave={(e) => {
            if (!otpLoading && otp.length === 6) {
              e.target.style.backgroundColor = '#9ca3af';
            }
          }}
        >
          {otpLoading ? 'Verifying...' : 'Verify Code'}
        </button>
        
        <div style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          Didn't receive the code? Check your spam folder or{' '}
          <button
            onClick={handleResendOTP}
            disabled={resendLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '14px',
              cursor: resendLoading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend'}
          </button>
        </div>
        
        <button
          onClick={() => navigate('/admin-email-verification')}
          disabled={otpLoading || resendLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: '400',
            transition: 'font-weight 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.fontWeight = '600';
          }}
          onMouseLeave={(e) => {
            e.target.style.fontWeight = '400';
          }}
        >
          ← Back to Email Verification
        </button>
      </div>
    </div>
  );
};

export default AdminOTPVerification;
