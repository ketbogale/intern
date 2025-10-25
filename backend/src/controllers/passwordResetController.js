const Staff = require("../models/staff");
const PasswordReset = require("../models/PasswordReset");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Email configuration - using exact same config as working test
const createTransporter = () => {
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    secure: false,
    requireTLS: true
  });
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid email address." 
      });
    }

    // Find admin staff by email
    const staff = await Staff.findOne({ 
      email: email.toLowerCase(), 
      role: 'admin' 
    });

    // Always return success to prevent email enumeration
    if (!staff) {
      return res.json({ 
        success: true, 
        message: "If an admin account with this email exists, a password reset link has been sent." 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ staffId: staff._id });

    // Create new password reset record
    const passwordReset = new PasswordReset({
      email: email.toLowerCase(),
      token: resetToken,
      staffId: staff._id
    });

    await passwordReset.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: `"Salale University Meal System" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - Salale University Meal Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for the Salale University Meal Attendance System.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Salale University Meal Attendance System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);


    res.json({ 
      success: true, 
      message: "If an admin account with this email exists, a password reset link has been sent." 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request. Please try again later." 
    });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset token is required." 
      });
    }

    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({ 
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('staffId');

    if (!passwordReset) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token." 
      });
    }

    res.json({ 
      success: true, 
      message: "Token is valid.",
      email: passwordReset.email 
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while verifying the token." 
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required." 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Passwords do not match." 
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long." 
      });
    }

    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({ 
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('staffId');

    if (!passwordReset) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token." 
      });
    }

    // Update staff password
    const staff = passwordReset.staffId;
    staff.password = newPassword; // Will be hashed by pre-save middleware
    await staff.save();

    // Mark token as used
    passwordReset.used = true;
    await passwordReset.save();

    // Send confirmation email
    const mailOptions = {
      from: `"Salale University Meal System" <${process.env.GMAIL_USER}>`,
      to: passwordReset.email,
      subject: 'Password Reset Successful - Salale University',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Password Reset Successful</h2>
          <p>Your password has been successfully reset for the Salale University Meal Attendance System.</p>
          <p>You can now log in with your new password.</p>
          <p>If you did not perform this action, please contact the system administrator immediately.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Salale University Meal Attendance System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    try {
      const transporter = createTransporter();
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the password reset if email fails
    }


    res.json({ 
      success: true, 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while resetting your password. Please try again." 
    });
  }
};
