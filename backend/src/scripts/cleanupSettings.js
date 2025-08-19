const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/meal-attendance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for cleanup');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean up obsolete fields from settings
const cleanupSettings = async () => {
  try {
    console.log('Starting settings cleanup...');
    
    // Remove obsolete fields from all settings documents
    const result = await Settings.updateMany(
      {}, // Match all documents
      {
        $unset: {
          language: "",           // Remove language field
          dailyResetTime: "",     // Remove old dailyResetTime field (replaced by mealResetTimes)
          apiEndpoint: "",        // Remove any API configuration fields
          apiKey: "",
          maintenanceReminderDays: "" // Remove maintenance reminder if not needed
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} settings documents`);
    
    // Verify the cleanup by fetching current settings
    const cleanedSettings = await Settings.findOne();
    if (cleanedSettings) {
      console.log('Current settings after cleanup:');
      console.log(JSON.stringify(cleanedSettings, null, 2));
    } else {
      console.log('No settings found in database');
    }
    
    console.log('Settings cleanup completed successfully');
    
  } catch (error) {
    console.error('Error during settings cleanup:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await cleanupSettings();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run the cleanup
main().catch(error => {
  console.error('Cleanup script failed:', error);
  process.exit(1);
});
