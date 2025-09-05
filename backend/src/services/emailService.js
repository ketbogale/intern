const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com', // Replace with your Gmail
    pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password' // Use App Password, not regular password
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
    ciphers: 'SSLv3'
  },
  secure: false,
  requireTLS: true
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'Admin Login Verification Code') => {
  const isCredentialUpdate = purpose.includes('Credential Update');
  
  const mailOptions = {
    from: process.env.GMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: purpose,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isCredentialUpdate ? '🔐 Admin Credential Update' : '🔐 Admin Verification'}
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">Verification Code</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            ${isCredentialUpdate ? 
              'You are updating your admin credentials. Please verify your new email address using the verification code below:' :
              'Someone is trying to access the admin dashboard. If this was you, please use the verification code below:'
            }
          </p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #718096; font-size: 14px;">
            ⏰ This code will expire in <strong>5 minutes</strong><br>
            🔒 If you didn't request this, please ignore this email
          </p>
          
          ${isCredentialUpdate ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> This verification is required to confirm your new email address before updating your admin credentials.
              </p>
            </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #a0aec0; font-size: 12px; text-align: center;">
              Meal Attendance System - Admin Security
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Verify transporter configuration
const verifyEmailService = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
};

// Send email change approval link to current admin email
const sendEmailChangeApprovalEmail = async (currentEmail, verificationToken, newEmail) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verify-email-change/${verificationToken}`;
  
  const mailOptions = {
    from: process.env.GMAIL_USER || 'your-email@gmail.com',
    to: currentEmail,
    subject: '🔐 Admin Email Change Approval Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            🔐 Email Change Approval
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">Email Change Request</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            You have requested to change your admin email address to:
          </p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <div style="font-size: 18px; font-weight: bold; color: #667eea;">
              ${newEmail}
            </div>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            To approve this email change, please click the button below. This will send a verification code to your new email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: linear-gradient(135deg, #667eea, #764ba2); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;">
              ✅ Approve Email Change
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> Only click this link if you initiated this email change request. After clicking, you'll receive a verification code at your new email address to complete the process.
            </p>
          </div>
          
          <p style="color: #718096; font-size: 14px;">
            ⏰ This link will expire in <strong>30 minutes</strong><br>
            🔒 If you didn't request this change, please ignore this email
          </p>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #a0aec0; font-size: 12px; text-align: center;">
              Meal Attendance System - Admin Security
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email change approval link sent to ${currentEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email change approval email:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendEmailChangeApprovalEmail,
  verifyEmailService
};
