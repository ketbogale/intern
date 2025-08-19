const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const cron = require('node-cron');

// Store active cron jobs to allow updating
let activeCronJobs = {
  breakfast: null,
  lunch: null,
  dinner: null,
  lateNight: null
};

// POST /api/settings/general - Save general settings
router.post('/general', async (req, res) => {
  console.log('Settings POST endpoint called');
  console.log('Request body:', req.body);
  try {
    const {
      attendanceWindowBefore,
      attendanceWindowAfter,
      mealResetTimes,
      lowAttendanceThreshold,
      loginAttemptLimit,
      lockoutDurationMinutes
    } = req.body;

    // Validate required fields
    if (attendanceWindowBefore === undefined || attendanceWindowAfter === undefined) {
      return res.status(400).json({ error: 'Attendance window settings are required' });
    }

    if (!mealResetTimes || !mealResetTimes.breakfast || !mealResetTimes.lunch || 
        !mealResetTimes.dinner || !mealResetTimes.lateNight) {
      return res.status(400).json({ error: 'All four meal reset times are required' });
    }

    // Find existing settings or create new ones
    let settings = await Settings.findOne();
    
    if (settings) {
      // Update existing settings
      settings.attendanceWindowBefore = attendanceWindowBefore;
      settings.attendanceWindowAfter = attendanceWindowAfter;
      settings.mealResetTimes = mealResetTimes;
      settings.lowAttendanceThreshold = lowAttendanceThreshold;
      settings.loginAttemptLimit = loginAttemptLimit;
      settings.lockoutDurationMinutes = lockoutDurationMinutes;
      settings.updatedAt = new Date();
    } else {
      // Create new settings
      settings = new Settings({
        attendanceWindowBefore,
        attendanceWindowAfter,
        mealResetTimes,
        lowAttendanceThreshold,
        loginAttemptLimit,
        lockoutDurationMinutes
      });
    }

    await settings.save();

    // Update cron schedules with new times
    updateScheduledResets(settings.mealResetTimes);

    res.status(200).json({
      message: 'Settings saved successfully',
      settings: {
        attendanceWindowBefore: settings.attendanceWindowBefore,
        attendanceWindowAfter: settings.attendanceWindowAfter,
        mealResetTimes: settings.mealResetTimes,
        lowAttendanceThreshold: settings.lowAttendanceThreshold,
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
          mealResetTimes: {
            breakfast: '06:00',
            lunch: '12:00',
            dinner: '18:00',
            lateNight: '23:00'
          },
          lowAttendanceThreshold: 50,
          loginAttemptLimit: 5,
          lockoutDurationMinutes: 5
        }
      });
    }

    res.status(200).json({
      settings: {
        attendanceWindowBefore: settings.attendanceWindowBefore,
        attendanceWindowAfter: settings.attendanceWindowAfter,
        mealResetTimes: settings.mealResetTimes,
        lowAttendanceThreshold: settings.lowAttendanceThreshold,
        loginAttemptLimit: settings.loginAttemptLimit,
        lockoutDurationMinutes: settings.lockoutDurationMinutes
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error while fetching settings' });
  }
});

// Database reset functionality for scheduled resets
const resetMealDatabase = async (mealType) => {
  try {
    const MealCurrent = require('../models/mealCurrent');
    
    // Clear today's attendance records for the specific meal type
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const result = await MealCurrent.deleteMany({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      mealType: mealType
    });
    
    console.log(`Scheduled database reset for ${mealType}: ${result.deletedCount} records cleared`);
    return { success: true, deletedCount: result.deletedCount, mealType };
  } catch (error) {
    console.error(`Error resetting database for ${mealType}:`, error);
    return { success: false, error: error.message, mealType };
  }
};

// Update scheduled resets with new times
const updateScheduledResets = (mealResetTimes) => {
  try {
    // Destroy existing cron jobs
    Object.values(activeCronJobs).forEach(job => {
      if (job) job.stop();
    });
    
    const { breakfast, lunch, dinner, lateNight } = mealResetTimes;
    
    // Schedule breakfast reset
    const breakfastCron = convertTimeToCron(breakfast);
    activeCronJobs.breakfast = cron.schedule(breakfastCron, () => {
      console.log('Scheduled breakfast database reset triggered');
      resetMealDatabase('breakfast');
    });
    
    // Schedule lunch reset
    const lunchCron = convertTimeToCron(lunch);
    activeCronJobs.lunch = cron.schedule(lunchCron, () => {
      console.log('Scheduled lunch database reset triggered');
      resetMealDatabase('lunch');
    });
    
    // Schedule dinner reset
    const dinnerCron = convertTimeToCron(dinner);
    activeCronJobs.dinner = cron.schedule(dinnerCron, () => {
      console.log('Scheduled dinner database reset triggered');
      resetMealDatabase('dinner');
    });
    
    // Schedule late night reset
    const lateNightCron = convertTimeToCron(lateNight);
    activeCronJobs.lateNight = cron.schedule(lateNightCron, () => {
      console.log('Scheduled late night database reset triggered');
      resetMealDatabase('lateNight');
    });
    
    console.log('Meal database reset schedules updated:');
    console.log(`- Breakfast: ${breakfast} (${breakfastCron})`);
    console.log(`- Lunch: ${lunch} (${lunchCron})`);
    console.log(`- Dinner: ${dinner} (${dinnerCron})`);
    console.log(`- Late Night: ${lateNight} (${lateNightCron})`);
    
  } catch (error) {
    console.error('Error updating scheduled resets:', error);
  }
};

// Initialize scheduled resets based on current settings
const initializeScheduledResets = async () => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.mealResetTimes) {
      console.log('No meal reset times configured, using defaults');
      const defaultTimes = {
        breakfast: '06:00',
        lunch: '11:00',
        dinner: '16:00',
        lateNight: '01:00'
      };
      updateScheduledResets(defaultTimes);
      return;
    }
    
    updateScheduledResets(settings.mealResetTimes);
    
  } catch (error) {
    console.error('Error initializing scheduled resets:', error);
  }
};

// Convert HH:MM time format to cron expression
const convertTimeToCron = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  return `${minutes} ${hours} * * *`; // minute hour * * * (daily)
};

// Initialize schedules when module loads
initializeScheduledResets();

module.exports = router;
