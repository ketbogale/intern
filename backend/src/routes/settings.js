const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// POST /api/settings/general - Save general settings
router.post('/general', async (req, res) => {
  console.log('Settings POST endpoint called');
  console.log('Request body:', req.body);
  try {
    const {
      attendanceWindowBefore,
      attendanceWindowAfter,
      dailyResetTime,
      lowAttendanceThreshold,
      language,
      loginAttemptLimit,
      lockoutDurationMinutes
    } = req.body;

    // Validate required fields
    if (attendanceWindowBefore === undefined || attendanceWindowAfter === undefined) {
      return res.status(400).json({ error: 'Attendance window settings are required' });
    }

    if (!dailyResetTime) {
      return res.status(400).json({ error: 'Daily reset time is required' });
    }

    // Find existing settings or create new ones
    let settings = await Settings.findOne();
    
    if (settings) {
      // Update existing settings
      settings.attendanceWindowBefore = attendanceWindowBefore;
      settings.attendanceWindowAfter = attendanceWindowAfter;
      settings.dailyResetTime = dailyResetTime;
      settings.lowAttendanceThreshold = lowAttendanceThreshold;
      settings.language = language;
      settings.loginAttemptLimit = loginAttemptLimit;
      settings.lockoutDurationMinutes = lockoutDurationMinutes;
      settings.updatedAt = new Date();
    } else {
      // Create new settings
      settings = new Settings({
        attendanceWindowBefore,
        attendanceWindowAfter,
        dailyResetTime,
        lowAttendanceThreshold,
        language,
        loginAttemptLimit,
        lockoutDurationMinutes
      });
    }

    await settings.save();

    res.status(200).json({
      message: 'Settings saved successfully',
      settings: {
        attendanceWindowBefore: settings.attendanceWindowBefore,
        attendanceWindowAfter: settings.attendanceWindowAfter,
        dailyResetTime: settings.dailyResetTime,
        lowAttendanceThreshold: settings.lowAttendanceThreshold,
        language: settings.language,
        loginAttemptLimit: settings.loginAttemptLimit,
        lockoutDurationMinutes: settings.lockoutDurationMinutes
      }
    });

  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Internal server error while saving settings' });
  }
});

// GET /api/settings/general - Get general settings
router.get('/general', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      // Return default settings if none exist
      return res.status(200).json({
        settings: {
          attendanceWindowBefore: 30,
          attendanceWindowAfter: 30,
          dailyResetTime: '00:00',
          lowAttendanceThreshold: 50,
          language: 'en',
          loginAttemptLimit: 5,
          lockoutDurationMinutes: 5
        }
      });
    }

    res.status(200).json({
      settings: {
        attendanceWindowBefore: settings.attendanceWindowBefore,
        attendanceWindowAfter: settings.attendanceWindowAfter,
        dailyResetTime: settings.dailyResetTime,
        lowAttendanceThreshold: settings.lowAttendanceThreshold,
        language: settings.language,
        loginAttemptLimit: settings.loginAttemptLimit,
        lockoutDurationMinutes: settings.lockoutDurationMinutes
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error while fetching settings' });
  }
});

module.exports = router;
