import React, { useState, useEffect } from 'react';
import './EmailChangeVerification.css';

const AdminCredentialsUpdate = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [showApprovalCode, setShowApprovalCode] = useState(false);
  const [approvalCode, setApprovalCode] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Fetch admin email on component mount
  useEffect(() => {
    const fetchAdminEmail = async () => {
      try {
        const response = await fetch('/api/admin/email');
        const data = await response.json();
        if (data.success) {
          setAdminEmail(data.email);
        }
      } catch (error) {
        // Error fetching admin email - fail silently
      }
    };
    fetchAdminEmail();
  }, []);

  const handleBackToDashboard = () => {
    window.location.href = '/';
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

    if (!hasUsername && !hasPassword && !hasEmail) {
      setMessage('Please enter at least one field to update (username, password, or email)');
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
          newPassword: adminCredentials.newPassword?.trim() || undefined
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
      setMessage('🌐 Network error occurred. Please check your connection and try again.');
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
          newPassword: adminCredentials.newPassword?.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('📧 Admin approval code sent to your email! Enter the 6-digit code below.');
        setPendingCredentials(adminCredentials);
        setShowApprovalCode(true);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to send admin approval');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('🌐 Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedAfterAdminApproval = async () => {
    if (!approvalCode || approvalCode.length !== 6) {
      setMessage('⚠️ Please enter the complete 6-digit admin approval code from your email.');
      setSuccess(false);
      return;
    }
    
    try {
      setLoading(true);
      setMessage('');
      
      const credentialsToUpdate = {
        ...pendingCredentials,
        adminApprovalOtp: approvalCode
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
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Invalid admin approval code. Please check the code and try again.');
      }
    } catch (error) {
      console.error('Error updating credentials after admin approval:', error);
      setSuccess(false);
      setMessage('🌐 Network error occurred. Please check your connection and try again.');
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
                <input
                  type="text"
                  value={approvalCode}
                  onChange={(e) => setApprovalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="verification-code-input"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleProceedAfterAdminApproval}
                  disabled={loading || approvalCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    'Update Credentials'
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleResendApprovalCode}
                  disabled={loading}
                >
                  Resend Code
                </button>
                
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={handleBackToDashboard}
                >
                  Cancel
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
              <input
                type="password"
                value={adminCredentials.currentPassword}
                onChange={(e) => setAdminCredentials({...adminCredentials, currentPassword: e.target.value})}
                placeholder="Enter current password"
                required
              />
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
