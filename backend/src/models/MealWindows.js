const mongoose = require('mongoose');

const mealWindowSchema = new mongoose.Schema({
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'lateNight'],
    unique: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // Deprecated: buffers are no longer used; keep placeholders for backward compatibility if present in DB
  beforeWindow: {
    type: Number,
    required: false,
    min: 0,
    max: 120,
    default: undefined
  },
  afterWindow: {
    type: Number,
    required: false,
    min: 0,
    max: 120,
    default: undefined
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

// Static method to get all meal windows as an object
mealWindowSchema.statics.getAllAsObject = async function() {
  const windows = await this.find({});
  const result = {};
  
  windows.forEach(window => {
    result[window.mealType] = {
      startTime: window.startTime,
      endTime: window.endTime,
      enabled: window.enabled
    };
  });
  
  return result;
};

// Static method to initialize default meal windows
mealWindowSchema.statics.initializeDefaults = async function() {
  const count = await this.countDocuments();
  
  if (count === 0) {
    const defaultWindows = [
      {
        mealType: 'breakfast',
        startTime: '06:00',
        endTime: '09:00',
        enabled: true
      },
      {
        mealType: 'lunch',
        startTime: '12:00',
        endTime: '14:00',
        enabled: true
      },
      {
        mealType: 'dinner',
        startTime: '17:00',
        endTime: '20:00',
        enabled: true
      },
      {
        mealType: 'lateNight',
        startTime: '22:00',
        endTime: '23:30',
        enabled: false
      }
    ];
    
    await this.insertMany(defaultWindows);
    console.log('Default meal windows initialized');
  }
};

// Instance method to check if current time is within attendance window
mealWindowSchema.methods.isWithinAttendanceWindow = function() {
  if (!this.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
  
  // Allow scanning only between startTime and endTime (no buffers)
  return currentTime >= this.startTime && currentTime <= this.endTime;
};

module.exports = mongoose.model('MealWindow', mealWindowSchema);
