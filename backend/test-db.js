require('dotenv').config();
const mongoose = require('mongoose');
const MealWindow = require('./src/models/MealWindows');

async function testDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/meal_attendance');
    console.log('✅ Connected to MongoDB');

    // Check existing meal windows
    console.log('\n--- Current Meal Windows in Database ---');
    const windows = await MealWindow.find({});
    if (windows.length === 0) {
      console.log('❌ No meal windows found in database');
      
      // Initialize defaults
      console.log('\n--- Initializing Default Meal Windows ---');
      await MealWindow.initializeDefaults();
      const newWindows = await MealWindow.find({});
      newWindows.forEach(w => {
        console.log(`✅ ${w.mealType}: ${w.startTime}-${w.endTime} (enabled: ${w.enabled})`);
      });
    } else {
      windows.forEach(w => {
        console.log(`📋 ${w.mealType}: ${w.startTime}-${w.endTime} (enabled: ${w.enabled})`);
      });
    }

    // Test getAllAsObject method
    console.log('\n--- Testing getAllAsObject Method ---');
    const objectFormat = await MealWindow.getAllAsObject();
    console.log('Object format:', JSON.stringify(objectFormat, null, 2));

    // Test API endpoint simulation
    console.log('\n--- Simulating API Response ---');
    const apiResponse = {
      success: true,
      mealWindows: objectFormat
    };
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
