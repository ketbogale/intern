const Staff = require('../models/staff');
const bcrypt = require('bcrypt');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

// Update admin credentials (username and/or password)
const updateAdminCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword, confirmPassword } = req.body;
    
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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided.'
      });
    }

    // Apply updates
    Object.assign(adminUser, updates);
    await adminUser.save();

    // Update session with new username if changed
    if (newUsername) {
      req.session.user.username = newUsername;
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

// Send OTP for admin login
const sendAdminOTP = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate credentials first
    if (username !== 'username' || password !== 'jidfFDhgg45HVf@%$jkvh657465j,Ahyhj') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const adminEmail = 'ket1boggood@gmail.com';
    
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
    const adminEmail = 'ket1boggood@gmail.com';
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Find OTP record
    const otpRecord = await OTP.findOne({ email: adminEmail });
    
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
    
    // OTP is valid - create admin session
    req.session.user = {
      id: 'admin',
      username: 'username',
      role: 'admin',
      email: adminEmail
    };
    
    // Clean up OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        username: 'username',
        role: 'admin'
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
    const adminEmail = 'ket1boggood@gmail.com';
    
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

module.exports = {
  updateAdminCredentials,
  getAdminInfo,
  sendAdminOTP,
  verifyAdminOTP,
  resendAdminOTP
};
