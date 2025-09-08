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
          borderRadius: '0',
          border: '1px solid #4a5568',
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
            Admin Email Verification
          </h1>
          
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Please enter your admin email address. We'll send a secure verification code to confirm your identity.
          </p>
          
          <form onSubmit={handleEmailVerification}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Email Address
              </label>
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
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            {emailMessage && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: emailMessage.includes('sent') || emailMessage.includes('successfully') ? '#dcfce7' : '#fef3c7',
                color: emailMessage.includes('sent') || emailMessage.includes('successfully') ? '#166534' : '#92400e',
                fontSize: '14px',
                marginBottom: '32px',
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
                padding: '16px 24px',
                backgroundColor: emailLoading || !adminEmail ? '#d1d5db' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: emailLoading || !adminEmail ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: '24px'
              }}
              onMouseEnter={(e) => {
                if (!emailLoading && adminEmail) {
                  e.target.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (!emailLoading && adminEmail) {
                  e.target.style.backgroundColor = '#10b981';
                }
              }}
            >
              {emailLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
          
          <button
            onClick={() => navigate('/login')}
            disabled={emailLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            ← Back to Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailVerification;
