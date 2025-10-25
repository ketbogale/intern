import React, { useState, useEffect } from 'react';
import './AdminCredentialsUpdate.css';
import './EmailChangeVerification.css';
import VerificationCodeInput from './VerificationCodeInput';

const AdminCredentialsUpdate = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [showApprovalCode, setShowApprovalCode] = useState(false);
  const [approvalCode, setApprovalCode] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Fetch admin profile on component mount
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        const data = await response.json();
        if (data.success) {
          setAdminEmail(data.email);
          // Pre-populate phone field if it exists
          if (data.phone) {
            setAdminCredentials(prev => ({
              ...prev,
              phone: data.phone
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchAdminProfile();
  }, []);

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard?section=settings';
  };

  const handleUpdateAdminCredentials = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!adminCredentials.currentPassword) {
      setMessage('Current password is required');
      setSuccess(false);
      return;
    }

    // Check if any field has a value to update
    const hasUsername = adminCredentials.newUsername && adminCredentials.newUsername.trim();
    const hasPassword = adminCredentials.newPassword && adminCredentials.newPassword.trim();
    const hasEmail = adminCredentials.email && adminCredentials.email.trim();
    const hasPhone = adminCredentials.phone && adminCredentials.phone.trim();

    if (!hasUsername && !hasPassword && !hasEmail && !hasPhone) {
      setMessage('Please enter at least one field to update (username, password, email, or phone)');
      setSuccess(false);
      return;
    }

    // Password validation only if password is being changed
    if (hasPassword) {
      if (adminCredentials.newPassword !== adminCredentials.confirmPassword) {
        setMessage('New passwords do not match');
        setSuccess(false);
        return;
      }

      if (adminCredentials.newPassword.length < 6) {
        setMessage('New password must be at least 6 characters long');
        setSuccess(false);
        return;
      }
    }

    // Phone number change is optional — do not require phone verification
    // if (hasPhone && !phoneVerified) {
    //   handleSendPhoneVerification();
    //   return;
    // }

    // Check if email is being changed
    if (hasEmail && adminCredentials.email !== adminEmail) {
      // Email is being changed, use two-step email change approval process
      handleSendEmailChangeApproval();
      return;
    }
    
    // No email change or email-only update, use regular admin approval process
    handleSendAdminApproval();
  };

  const handleSendEmailChangeApproval = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/admin/send-email-change-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: adminCredentials.currentPassword,
          newEmail: adminCredentials.email?.trim(),
          newUsername: adminCredentials.newUsername?.trim() || undefined,
          newPassword: adminCredentials.newPassword?.trim() || undefined,
          newPhone: adminCredentials.phone?.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('Email change approval sent! Check your current email for the approval link.');
        setPendingCredentials({
          ...adminCredentials,
          email: adminCredentials.email
        });
        
        // Show email verification option
        setTimeout(() => {
          setShowEmailVerification(true);
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to send email change approval');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAdminApproval = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/admin/request-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: adminCredentials.currentPassword,
          newUsername: adminCredentials.newUsername?.trim() || undefined,
          newPassword: adminCredentials.newPassword?.trim() || undefined,
          newPhone: adminCredentials.phone?.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('Admin approval code sent to your email! Enter the 6-digit code below.');
        setPendingCredentials(adminCredentials);
        setShowApprovalCode(true);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to send admin approval');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedAfterAdminApprovalWithCode = async (code) => {
    console.log('Processing approval with code:', code, 'Length:', code?.length);
    
    if (!code || code.length !== 6) {
      setMessage('Please enter the complete 6-digit admin approval code from your email.');
      setSuccess(false);
      return;
    }
    
    try {
      setLoading(true);
      setMessage('');
      
      // Build payload explicitly and map phone -> newPhone as required by backend
      const credentialsToUpdate = {
        currentPassword: pendingCredentials?.currentPassword,
        newUsername: pendingCredentials?.newUsername?.trim() || undefined,
        newPassword: pendingCredentials?.newPassword?.trim() || undefined,
        email: pendingCredentials?.email?.trim() || undefined,
        newPhone: pendingCredentials?.phone?.trim() || undefined,
        adminApprovalOtp: code
      };
      
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialsToUpdate)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('Your admin credentials have been updated successfully!');
        
        // Redirect to dashboard settings after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard?section=settings';
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Invalid admin approval code. Please check the code and try again.');
      }
    } catch (error) {
      console.error('Error updating credentials after admin approval:', error);
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedAfterAdminApproval = async () => {
    handleProceedAfterAdminApprovalWithCode(approvalCode);
  };

  const handleSendPhoneVerification = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('=== FRONTEND SEND PHONE VERIFICATION DEBUG ===');
      console.log('Phone number:', adminCredentials.phone?.trim());
      
      const response = await fetch('/api/admin/send-phone-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: adminCredentials.phone?.trim()
        })
      });
      
      const data = await response.json();
      console.log('Send verification response:', data);
      
      if (data.success) {
        setSuccess(true);
        setMessage('Verification code sent to your phone! Enter the 6-digit code below.');
        setShowPhoneVerification(true);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to send phone verification code');
      }
    } catch (error) {
      console.error('Frontend send verification error:', error);
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (code) => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('=== FRONTEND PHONE VERIFICATION DEBUG ===');
      console.log('Phone number:', adminCredentials.phone?.trim());
      console.log('Verification code:', code);
      
      const response = await fetch('/api/admin/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: adminCredentials.phone?.trim(),
          verificationCode: code
        })
      });
      
      const data = await response.json();
      console.log('Response from server:', data);
      
      if (data.success) {
        setPhoneVerified(true);
        setShowPhoneVerification(false);
        setSuccess(true);
        setMessage('Phone number verified successfully! You can now update your credentials.');
        
        // Continue with credential update
        setTimeout(() => {
          handleUpdateAdminCredentials({ preventDefault: () => {} });
        }, 1000);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Frontend verification error:', error);
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendApprovalCode = async () => {
    if (!pendingCredentials) return;
    
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/admin/resend-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: pendingCredentials.currentPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('New admin approval code sent to your email!');
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to resend approval code');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };


  if (showEmailVerification) {
    return (
      <div className="email-verification-container">
        <div className="email-verification-card">
          <div className="email-verification-header">
            <h1>Email Verification Required</h1>
          </div>
          
          <div className="email-verification-content">
            <div className="result-section success" style={{ marginBottom: '24px' }}>
              <div className="result-message">
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '16px', 
                  margin: '0',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>Email change approval link sent successfully!</p>
              </div>
            </div>
                
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
              }}>{pendingCredentials?.email}</p>
            </div>
              
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={handleBackToDashboard}
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
      </div>
    );
  }

  if (showPhoneVerification) {
    return (
      <div className="email-verification-container">
        <div className="email-verification-card">
          <div className="email-verification-header">
            <h1>Phone Verification Required</h1>
          </div>
          
          <div className="email-verification-content">
            {message && (
              <div className={`result-section ${success ? 'success' : 'error'}`}>
                <div className="result-message">
                  <p>{message}</p>
                </div>
              </div>
            )}
            
            <div className="form-section">
              <div className="form-group">
                <label>Enter 6-digit verification code sent to your phone:</label>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                  Code sent to: {adminCredentials.phone}
                </p>
                <VerificationCodeInput
                  value={phoneOtpCode}
                  onCodeChange={(code) => {
                    setPhoneOtpCode(code);
                  }}
                  onComplete={(code) => {
                    if (code && code.length === 6) {
                      handleVerifyPhone(code);
                    }
                  }}
                  disabled={loading}
                  error={message && !success}
                  length={6}
                />
              </div>
              
              <div className="form-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleSendPhoneVerification}
                  disabled={loading}
                  style={{ 
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    color: '#6b7280',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Resend Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showApprovalCode) {
    return (
      <div className="email-verification-container">
        <div className="email-verification-card">
          <div className="email-verification-header">
            <h1>Admin Approval Required</h1>
          </div>
          
          <div className="email-verification-content">
            {message && (
              <div className={`result-section ${success ? 'success' : 'error'}`}>
                <div className="result-message">
                  <p>{message}</p>
                </div>
              </div>
            )}
            
            <div className="form-section">
              <div className="form-group">
                <label>Enter 6-digit approval code from your email:</label>
                <VerificationCodeInput
                  value={approvalCode}
                  onCodeChange={(code) => {
                    console.log('Code changed:', code, 'Length:', code?.length);
                    setApprovalCode(code);
                  }}
                  onComplete={(code) => {
                    console.log('onComplete called with:', code, 'Length:', code?.length);
                    // Use the code directly from the callback instead of state
                    if (code && code.length === 6) {
                      handleProceedAfterAdminApprovalWithCode(code);
                    }
                  }}
                  disabled={loading}
                  error={message && !success}
                  length={6}
                />
              </div>
              
              <div className="form-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleResendApprovalCode}
                  disabled={loading}
                  style={{ 
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    color: '#6b7280',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Resend Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '450px' }}>
        <div className="email-verification-header">
          <h1>Update Admin Credentials</h1>
        </div>
        
        <div className="email-verification-content">
          {message && (
            <div className={`result-section ${success ? 'success' : 'error'}`}>
              <div className="result-message">
                <p>{message}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleUpdateAdminCredentials} className="form-section">
            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={adminCredentials.currentPassword}
                  onChange={(e) => setAdminCredentials({...adminCredentials, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  required
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                  {showCurrentPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>New Username</label>
              <input
                type="text"
                value={adminCredentials.newUsername}
                onChange={(e) => setAdminCredentials({...adminCredentials, newUsername: e.target.value})}
                placeholder="Leave blank to keep current"
              />
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={adminCredentials.newPassword}
                  onChange={(e) => setAdminCredentials({...adminCredentials, newPassword: e.target.value})}
                  placeholder="Leave blank to keep current"
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
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
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={adminCredentials.confirmPassword}
                  onChange={(e) => setAdminCredentials({...adminCredentials, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                placeholder="Enter admin email address"
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number (optional)</label>
              <input
                type="tel"
                value={adminCredentials.phone}
                onChange={(e) => setAdminCredentials(prev => ({
                  ...prev,
                  phone: e.target.value
                }))}
                placeholder="Enter phone number (e.g., +251911123456)"
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Optional. You can add/update without phone code verification.
              </small>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleBackToDashboard}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !adminCredentials.currentPassword}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Updating...
                  </>
                ) : (
                  'Update Credentials'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCredentialsUpdate;
