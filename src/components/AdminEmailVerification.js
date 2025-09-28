import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminEmailVerification = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMessage('');

    try {
      // Check if email exists in admin database
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const adminData = await response.json();
        
        // Check if entered email matches admin email in database
        if (adminData.email === adminEmail) {
          // Send OTP to the verified email using dynamic admin data
          const otpResponse = await fetch('/api/admin/send-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: adminEmail
            })
          });

          const otpData = await otpResponse.json();
          
          if (otpData.success) {
            setEmailMessage('🎉 Verification code sent! Check your email and enter the 6-digit code on the next page.');
            setTimeout(() => {
              navigate('/admin-otp-verification', { state: { email: adminEmail } });
            }, 1500);
          } else {
            setEmailMessage('❌ ' + (otpData.message || 'Unable to send verification code. Please try again.'));
          }
        } else {
          setEmailMessage('❌ This email address is not registered as an admin account. Please check your email and try again.');
        }
      } else {
        setEmailMessage('❌ Unable to verify admin credentials at this time. Please try again in a moment.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setEmailMessage('❌ Connection error. Please check your internet connection and try again.');
    } finally {
      setEmailLoading(false);
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
          marginBottom: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Enter Admin Email
        </h1>
        
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '32px',
          lineHeight: '1.5'
        }}>
          Please enter your admin email address to receive a verification code
        </p>
        
        <form onSubmit={handleEmailVerification}>
          <div style={{ marginBottom: '24px' }}>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          {emailMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: emailMessage.includes('sent') || emailMessage.includes('successfully') ? '#dcfce7' : '#fef3c7',
              color: emailMessage.includes('sent') || emailMessage.includes('successfully') ? '#166534' : '#92400e',
              fontSize: '14px',
              marginBottom: '24px',
              border: `1px solid ${emailMessage.includes('sent') || emailMessage.includes('successfully') ? '#bbf7d0' : '#fde68a'}`
            }}>
              {emailMessage}
            </div>
          )}
          
          <button
            type="submit"
            disabled={emailLoading || !adminEmail}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: emailLoading || !adminEmail ? '#d1d5db' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: emailLoading || !adminEmail ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              if (!emailLoading && adminEmail) {
                e.target.style.backgroundColor = '#6b7280';
              }
            }}
            onMouseLeave={(e) => {
              if (!emailLoading && adminEmail) {
                e.target.style.backgroundColor = '#9ca3af';
              }
            }}
          >
            {emailLoading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
        
        <div style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          Didn't receive the code? Check your spam folder or{' '}
        </div>
        
        <button
          onClick={() => navigate('/login')}
          disabled={emailLoading}
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
          Back to Sign in
        </button>
      </div>
    </div>
  );
};

export default AdminEmailVerification;
