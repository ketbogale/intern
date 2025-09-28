const Staff = require('../models/staff');
const bcrypt = require('bcrypt');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../services/emailService');
const notificationService = require('../services/notificationService');

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    // Find admin user
    const adminUser = await Staff.findOne({ role: 'admin' });
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      email: adminUser.email,
      username: adminUser.username,
      phone: adminUser.phone
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Send verification link to current admin email for email change approval
const sendEmailChangeApprovalLink = async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Find current admin user
    const adminUser = await Staff.findById(req.session.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await adminUser.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Clear any existing email change requests
    await OTP.deleteMany({ 
      adminId: adminUser._id, 
      purpose: 'email_change_approval' 
    });
    
    // Generate verification token for the link
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    
    // Save email change request with verification token
    const emailChangeRequest = new OTP({
      email: adminUser.email, // Current admin email
      otp: verificationToken,
      purpose: 'email_change_approval',
      adminId: adminUser._id,
      metadata: { newEmail: newEmail } // Store new email in metadata
    });
    await emailChangeRequest.save();
    
    // Send verification link to current admin email
    const { sendEmailChangeApprovalEmail } = require('../services/emailService');
    const emailSent = await sendEmailChangeApprovalEmail(
      adminUser.email, 
      verificationToken, 
      newEmail
    );
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
    
    res.json({
      success: true,
      message: 'Email change approval link sent to your current email address',
      currentEmail: adminUser.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      newEmail: newEmail.replace(/(.{3}).*(@.*)/, '$1***$2')
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification link'
    });
  }
};

// Verify email change approval link and send OTP to new email
const verifyEmailChangeApproval = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verifying email change token
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    // Find email change request
    const emailChangeRequest = await OTP.findOne({
      otp: token,
      purpose: 'email_change_approval'
    });
    
    if (!emailChangeRequest) {
      // Check if there are any email_change_approval records
      const allApprovalRequests = await OTP.find({ purpose: 'email_change_approval' });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link'
      });
    }
    
    const newEmail = emailChangeRequest.metadata.newEmail;
    const adminId = emailChangeRequest.adminId;
    
    // Clear any existing OTP for the new email
    await OTP.deleteMany({ 
      email: newEmail,
      purpose: 'credential_update',
      adminId: adminId
    });
    
    // Generate OTP for new email verification
    const { generateOTP } = require('../services/emailService');
    const otp = generateOTP();
    
    // Save OTP for new email verification
    const otpRecord = new OTP({
      email: newEmail,
      otp: otp,
      purpose: 'credential_update',
      adminId: adminId
    });
    
    await otpRecord.save();
    
    // Send OTP to new email
    const { sendOTPEmail } = require('../services/emailService');
    const emailSent = await sendOTPEmail(newEmail, otp, 'Email Change Verification');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code to new email'
      });
    }
    
    // Clean up the approval request
    await OTP.deleteOne({ _id: emailChangeRequest._id });
    
    res.json({
      success: true,
      message: 'Email change approved! Verification code sent to new email address',
      newEmail: newEmail
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while processing email change approval'
    });
  }
};

// Send admin email approval OTP before any credential update
const sendAdminApprovalOTP = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Find current admin user
    const adminUser = await Staff.findById(req.session.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await adminUser.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Clear any existing approval OTP for this admin
    await OTP.deleteMany({ 
      email: adminUser.email, 
      purpose: 'admin_approval',
      adminId: adminUser._id 
    });
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Save OTP to database with admin approval context
    const otpRecord = new OTP({
      email: adminUser.email,
      otp: otp,
      purpose: 'admin_approval',
      adminId: adminUser._id
    });
    await otpRecord.save();
    
    // Send OTP email to current admin email
    const emailSent = await sendOTPEmail(adminUser.email, otp, 'Admin Identity Verification - Credential Update');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin verification code sent to your current email address',
      email: adminUser.email.replace(/(.{3}).*(@.*)/, '$1***$2') // Mask email for security
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification code'
    });
  }
};

// Update admin credentials after admin approval and email verification
const updateAdminCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword, confirmPassword, email, newPhone, otp, adminApprovalOtp } = req.body;
    
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Find current admin user
    const adminUser = await Staff.findById(req.session.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    // Check if this is an email-only change (already approved via verification link)
    const isEmailOnlyChange = email && email !== adminUser.email && !newUsername && !newPassword && !newPhone;
    
    // Only verify current password for non-email changes or if password is not marked as verified
    if (!isEmailOnlyChange || currentPassword !== 'verified') {
      const isCurrentPasswordValid = await adminUser.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }
    }
    
    // Initialize adminApprovalRecord variable
    let adminApprovalRecord = null;
    
    // Require admin approval OTP for non-email changes
    if (!isEmailOnlyChange) {
      if (!adminApprovalOtp) {
        return res.status(400).json({
          success: false,
          message: 'Admin approval verification code is required for all credential updates.'
        });
      }

      // Verify admin approval OTP
      adminApprovalRecord = await OTP.findOne({ 
        email: adminUser.email, 
        purpose: 'admin_approval',
        adminId: adminUser._id
      });
      
      if (!adminApprovalRecord) {
        return res.status(400).json({
          success: false,
          message: 'Admin approval code expired or not found. Please request a new approval code.'
        });
      }
    }
    
    // Verify admin approval OTP for non-email changes
    if (!isEmailOnlyChange && adminApprovalRecord) {
      // Check attempts limit for admin approval
      if (adminApprovalRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: adminApprovalRecord._id });
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts for admin approval. Please request a new code.'
        });
      }
      
      // Verify admin approval OTP code
      if (adminApprovalRecord.otp !== adminApprovalOtp) {
        adminApprovalRecord.attempts += 1;
        await adminApprovalRecord.save();
        
        return res.status(400).json({
          success: false,
          message: `Invalid admin approval code. ${3 - adminApprovalRecord.attempts} attempts remaining.`
        });
      }
    }

    // If email is being changed, also verify new email OTP
    if (email && email !== adminUser.email) {
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'Email verification code is required for email changes.'
        });
      }

      console.log('Looking for OTP with:', {
        email: email,
        purpose: 'credential_update',
        adminId: adminUser._id
      });
      
      // First, let's see ALL OTP records in the database
      const allOtpRecords = await OTP.find({});
      console.log('ALL OTP records in database:', allOtpRecords);
      
      // Check specifically for credential_update purpose
      const credentialUpdateRecords = await OTP.find({ purpose: 'credential_update' });
      console.log('All credential_update OTP records:', credentialUpdateRecords);
      
      // Check for any records with this email (any purpose)
      const emailRecords = await OTP.find({ email: email });
      console.log('All records with email ' + email + ':', emailRecords);
      
      // Since email might be masked, let's find the OTP record by adminId and purpose first
      let otpRecord = await OTP.findOne({ 
        purpose: 'credential_update',
        adminId: adminUser._id
      });
      
      console.log('Found OTP record by adminId and purpose:', otpRecord);
      
      // If found, verify the email matches (in case there are multiple)
      if (otpRecord && email.includes('***')) {
        console.log('Email is masked, using OTP record found by adminId');
      } else if (otpRecord && otpRecord.email !== email) {
        console.log('Email mismatch - OTP email:', otpRecord.email, 'vs provided email:', email);
      }
      
      if (!otpRecord) {
        // Fallback: try direct email lookup
        const fallbackOtpRecord = await OTP.findOne({ 
          email: email, 
          purpose: 'credential_update'
        });
        console.log('Fallback OTP record:', fallbackOtpRecord);
        otpRecord = fallbackOtpRecord;
        
        if (!fallbackOtpRecord) {
          return res.status(400).json({
            success: false,
            message: 'Email verification code expired or not found. Please request a new code.'
          });
        }
        
        // Use fallback record
        otpRecord = fallbackOtpRecord;
      }
      
      // Check attempts limit for email verification
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts for email verification. Please request a new verification code.'
        });
      }
      
      // Verify email OTP
      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        
        return res.status(400).json({
          success: false,
          message: `Invalid email verification code. ${3 - otpRecord.attempts} attempts remaining.`
        });
      }
      
      // Clean up email verification OTP after successful verification
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    // Clean up admin approval OTP after successful verification (only if it exists)
    if (!isEmailOnlyChange && adminApprovalRecord) {
      await OTP.deleteOne({ _id: adminApprovalRecord._id });
    }

    // Validate new password if provided
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match.'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }
    }

    // Check if new username is already taken (if changing username)
    if (newUsername && newUsername !== adminUser.username) {
      const existingUser = await Staff.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }
    }

    // Update credentials
    const updates = {};
    if (newUsername && newUsername !== adminUser.username) {
      updates.username = newUsername;
    }
    if (newPassword) {
      updates.password = newPassword; // Will be hashed by pre-save middleware
    }
    if (email && email !== adminUser.email) {
      updates.email = email;
    }
    if (newPhone && newPhone !== adminUser.phone) {
      updates.phone = newPhone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided.'
      });
    }

    // Apply updates
    Object.assign(adminUser, updates);
    await adminUser.save();

    // Update session with new username, email, and phone if changed
    if (newUsername) {
      req.session.user.username = newUsername;
    }
    if (email) {
      req.session.user.email = email;
    }
    if (newPhone) {
      req.session.user.phone = newPhone;
    }

    res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      updatedFields: Object.keys(updates)
    });

  } catch (error) {
    console.error('Error updating admin credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credentials.',
      error: error.message
    });
  }
};

// Get current admin info
const getAdminInfo = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const adminUser = await Staff.findById(req.session.user.id).select('-password');
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    res.json({
      success: true,
      admin: {
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin info.',
      error: error.message
    });
  }
};

// Check admin credentials (username/password only)
const checkAdminCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user in database
    const adminUser = await Staff.findOne({ username, role: 'admin' });
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await adminUser.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      message: 'Admin credentials verified'
    });

  } catch (error) {
    console.error('Error checking admin credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking credentials'
    });
  }
};

// Send OTP for admin login
const sendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find admin user by email
    const adminUser = await Staff.findOne({ email, role: 'admin' });
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const adminEmail = adminUser.email;
    
    // Clear any existing OTP for this email
    await OTP.deleteMany({ email: adminEmail });
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Save OTP to database
    const otpRecord = new OTP({
      email: adminEmail,
      otp: otp
    });
    await otpRecord.save();
    
    // Send OTP email
    const emailSent = await sendOTPEmail(adminEmail, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
    
    res.json({
      success: true,
      message: 'Verification code sent to admin email',
      email: adminEmail.replace(/(.{3}).*(@.*)/, '$1***$2') // Mask email for security
    });
    
  } catch (error) {
    console.error('Error sending admin OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification code'
    });
  }
};

// Verify OTP and complete admin login
const verifyAdminOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Find admin user to get correct email
    const adminUser = await Staff.findOne({ role: 'admin' });
    if (!adminUser || !adminUser.email) {
      return res.status(500).json({
        success: false,
        message: 'Admin user or email not found in database'
      });
    }
    
    // Find OTP record using admin's actual email
    const otpRecord = await OTP.findOne({ email: adminUser.email });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found'
      });
    }
    
    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${3 - otpRecord.attempts} attempts remaining.`
      });
    }
    
    // Admin user already found above, use it for session creation
    if (!adminUser) {
      return res.status(500).json({
        success: false,
        message: 'Admin user not found in database'
      });
    }

    // OTP is valid - create admin session
    req.session.user = {
      id: adminUser._id,
      username: adminUser.username,
      role: adminUser.role,
      email: adminUser.email
    };
    
    // Clean up OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        username: adminUser.username,
        role: adminUser.role
      }
    });
    
  } catch (error) {
    console.error('Error verifying admin OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying code'
    });
  }
};

// Resend OTP
const resendAdminOTP = async (req, res) => {
  try {
    // Find admin user to get correct email
    const adminUser = await Staff.findOne({ role: 'admin' });
    if (!adminUser || !adminUser.email) {
      return res.status(500).json({
        success: false,
        message: 'Admin user or email not found in database'
      });
    }
    
    const adminEmail = adminUser.email;
    
    // Check if there's an existing OTP that's less than 60 seconds old
    const existingOTP = await OTP.findOne({ email: adminEmail });
    if (existingOTP) {
      const timeDiff = Date.now() - existingOTP.createdAt.getTime();
      if (timeDiff < 60000) { // 60 seconds
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil((60000 - timeDiff) / 1000)} seconds before requesting a new code`
        });
      }
    }
    
    // Clear existing OTP
    await OTP.deleteMany({ email: adminEmail });
    
    // Generate and send new OTP
    const otp = generateOTP();
    const otpRecord = new OTP({
      email: adminEmail,
      otp: otp
    });
    await otpRecord.save();
    
    const emailSent = await sendOTPEmail(adminEmail, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
    
    res.json({
      success: true,
      message: 'New verification code sent'
    });
    
  } catch (error) {
    console.error('Error resending admin OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending code'
    });
  }
};

// Verify email change code (for new email verification)
const verifyEmailChangeCode = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    
    if (!otp || !newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Verification code and email are required'
      });
    }
    
    // Find OTP record for the new email
    const otpRecord = await OTP.findOne({
      email: newEmail,
      otp: otp,
      purpose: 'credential_update'
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }
    
    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }
    
    // Update admin email in database
    const adminId = otpRecord.adminId;
    const adminUser = await Staff.findById(adminId);
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }
    
    // Update admin email
    adminUser.email = newEmail;
    await adminUser.save();
    
    // Create admin session after successful email verification
    req.session.user = {
      id: adminUser._id,
      username: adminUser.username,
      role: adminUser.role,
      email: adminUser.email
    };
    
    // Clean up OTP records
    await OTP.deleteMany({ 
      $or: [
        { _id: otpRecord._id },
        { adminId: adminId, purpose: 'email_change_approval' }
      ]
    });
    
    res.json({
      success: true,
      message: 'Email verification successful! Your email has been updated.'
    });
    
  } catch (error) {
    console.error('Error verifying email change code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying code'
    });
  }
};

// Resend email change verification code
const resendEmailChangeCode = async (req, res) => {
  try {
    const { newEmail } = req.body;
    
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    // Find existing OTP record for this email
    const existingOTP = await OTP.findOne({
      email: newEmail,
      purpose: 'credential_update'
    });
    
    if (!existingOTP) {
      return res.status(400).json({
        success: false,
        message: 'No verification request found for this email'
      });
    }
    
    // Check if there's a recent OTP (less than 60 seconds old)
    const timeDiff = Date.now() - existingOTP.createdAt.getTime();
    if (timeDiff < 60000) { // 60 seconds
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil((60000 - timeDiff) / 1000)} seconds before requesting a new code`
      });
    }
    
    // Generate new OTP
    const { generateOTP } = require('../services/emailService');
    const otp = generateOTP();
    
    // Update existing OTP record
    existingOTP.otp = otp;
    existingOTP.attempts = 0;
    existingOTP.createdAt = new Date();
    await existingOTP.save();
    
    // Send new OTP
    const { sendOTPEmail } = require('../services/emailService');
    const emailSent = await sendOTPEmail(newEmail, otp, 'Email Change Verification');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
    
    res.json({
      success: true,
      message: 'New verification code sent'
    });
    
  } catch (error) {
    console.error('Error resending email change code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending code'
    });
  }
};

// Send phone verification OTP
const sendPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format (basic validation, prefers E.164)
    const phoneRegex = /^\+?[\d\s-()]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in memory (similar to bulk payment OTP system)
    if (!global.phoneVerificationCodes) {
      global.phoneVerificationCodes = {};
    }
    
    const verificationId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    global.phoneVerificationCodes[verificationId] = {
      phoneNumber: phoneNumber.trim(),
      code: otpCode,
      expires: Date.now() + (5 * 60 * 1000), // 5 minutes
      adminId: req.session.user.id
    };

    // Send SMS using notification service and surface failures
    try {
      const provider = process.env.SMS_PROVIDER || 'mock';
      console.log('SMS provider:', provider);
      const smsResult = await notificationService.sendAuthorizationCode(
        phoneNumber.trim(), 
        otpCode, 
        'phone verification'
      );
      if (!smsResult || smsResult.success !== true) {
        console.error('SMS sending failed:', smsResult);
        return res.status(502).json({
          success: false,
          message: 'Failed to send verification SMS. Please check SMS provider configuration.'
        });
      }
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      return res.status(502).json({
        success: false,
        message: 'SMS provider error while sending verification code'
      });
    }

    console.log('=== PHONE VERIFICATION SEND DEBUG ===');
    console.log('Generated OTP code:', otpCode);
    console.log('Phone number:', phoneNumber.trim());
    console.log('Verification ID:', verificationId);
    console.log('Admin ID:', req.session.user.id);
    console.log('Stored verification object:', global.phoneVerificationCodes[verificationId]);

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
      verificationId: verificationId
    });

  } catch (error) {
    console.error('Error sending phone verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification code'
    });
  }
};

// Verify phone verification OTP
const verifyPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    console.log('=== PHONE VERIFICATION DEBUG ===');
    console.log('Request body:', { phoneNumber, verificationCode });
    console.log('Session user ID:', req.session.user?.id);
    console.log('All stored phone verification codes:', global.phoneVerificationCodes);
    
    if (!phoneNumber || !verificationCode) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    // Find matching verification code
    let matchingVerificationId = null;
    let storedVerification = null;

    if (global.phoneVerificationCodes) {
      console.log('Searching through verification codes...');
      for (const [verificationId, verification] of Object.entries(global.phoneVerificationCodes)) {
        console.log(`Checking verification ID: ${verificationId}`);
        console.log(`  - Stored phone: "${verification.phoneNumber}"`);
        console.log(`  - Request phone: "${phoneNumber.trim()}"`);
        console.log(`  - Phone match: ${verification.phoneNumber === phoneNumber.trim()}`);
        console.log(`  - Stored adminId: ${verification.adminId}`);
        console.log(`  - Request adminId: ${req.session.user.id}`);
        console.log(`  - Admin match: ${verification.adminId === req.session.user.id}`);
        console.log(`  - Stored code: "${verification.code}"`);
        console.log(`  - Request code: "${verificationCode.trim()}"`);
        console.log(`  - Code match: ${verification.code === verificationCode.trim()}`);
        console.log(`  - Expires: ${new Date(verification.expires)}`);
        console.log(`  - Current time: ${new Date()}`);
        console.log(`  - Expired: ${Date.now() > verification.expires}`);
        
        if (verification.phoneNumber === phoneNumber.trim() && 
            verification.adminId.toString() === req.session.user.id.toString()) {
          matchingVerificationId = verificationId;
          storedVerification = verification;
          console.log(`Found matching verification: ${verificationId}`);
          break;
        }
      }
    } else {
      console.log('No phone verification codes stored in global object');
    }

    if (!storedVerification) {
      console.log('No matching verification found');
      return res.status(400).json({
        success: false,
        message: 'Verification code not found or expired'
      });
    }

    // Check if code matches and hasn't expired
    if (storedVerification.code !== verificationCode.trim()) {
      console.log('Code mismatch - stored:', storedVerification.code, 'provided:', verificationCode.trim());
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (Date.now() > storedVerification.expires) {
      console.log('Code expired');
      // Clean up expired code
      delete global.phoneVerificationCodes[matchingVerificationId];
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Code is valid - clean up and return success
    console.log('Verification successful, cleaning up code');
    delete global.phoneVerificationCodes[matchingVerificationId];

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying phone'
    });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminCredentials,
  sendEmailChangeApprovalLink,
  verifyEmailChangeApproval,
  verifyEmailChangeCode,
  resendEmailChangeCode,
  sendAdminApprovalOTP,
  checkAdminCredentials,
  sendAdminOTP,
  verifyAdminOTP,
  resendAdminOTP,
  sendPhoneVerification,
  verifyPhoneVerification
};
