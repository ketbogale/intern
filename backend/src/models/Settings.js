const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Attendance Window Settings
  attendanceWindowBefore: {
    type: Number,
    required: true,
    default: 30,
    min: 0,
    max: 120
  },
  attendanceWindowAfter: {
    type: Number,
    required: true,
    default: 30,
    min: 0,
    max: 120
  },
  
  // Daily Reset Times (4 meal periods)
  mealResetTimes: {
    breakfast: {
      type: String,
      required: true,
      default: '06:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Reset time must be in HH:MM format'
      }
    },
    lunch: {
      type: String,
      required: true,
      default: '11:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Reset time must be in HH:MM format'
      }
    },
    dinner: {
      type: String,
      required: true,
      default: '16:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Reset time must be in HH:MM format'
      }
    },
    lateNight: {
      type: String,
      required: true,
      default: '01:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Reset time must be in HH:MM format'
      }
    }
  },
  
  // Low Attendance Alert Threshold
  lowAttendanceThreshold: {
    type: Number,
    required: true,
    default: 50,
    min: 1,
    max: 100
  },
  
  // Maintenance Reminder Days
  maintenanceReminderDays: {
    type: Number,
    required: true,
    default: 7,
    min: 1,
    max: 365
  },
  
  
  // Login Security
  loginAttemptLimit: {
    type: Number,
    required: true,
    default: 5,
    min: 3,
    max: 10
  },
  lockoutDurationMinutes: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 60
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
