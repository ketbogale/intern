const cron = require("node-cron");
const MealCurrent = require("../models/mealCurrent");
const MealWindow = require("../models/MealWindows");

class SchedulerService {
  static async startScheduler() {
    console.log("Starting dynamic meal database scheduler for East Africa Time (EAT)");

    // Initialize meal windows and set up dynamic scheduling
    await this.initializeDynamicScheduler();
    
    // Set up a periodic check to update schedules if meal windows change
    cron.schedule("0 * * * *", async () => {
      await this.updateSchedulerIfNeeded();
    }, {
      timezone: "Africa/Addis_Ababa",
    });

    console.log("Dynamic meal database scheduler started successfully");
    console.log("Timezone: Africa/Addis_Ababa (EAT UTC+3)");
  }

  static async initializeDynamicScheduler() {
    try {
      // Get current meal windows from database (don't reinitialize defaults)
      const mealWindows = await MealWindow.find({ enabled: true });
      
      // Clear any existing scheduled jobs
      if (this.scheduledJobs) {
        this.scheduledJobs.forEach(job => job.stop());
      }
      this.scheduledJobs = [];

      // Create dynamic schedules based on database meal windows
      for (const window of mealWindows) {
        const resetTime = this.calculateResetTime(window);
        if (resetTime) {
          const job = cron.schedule(
            resetTime.cronExpression,
            async () => {
              const mealDisplayName = window.mealType === 'lateNight' ? 'Late Night' : 
                                    window.mealType.charAt(0).toUpperCase() + window.mealType.slice(1);
              await this.resetMealDatabase(
                `${resetTime.displayTime} EAT (30 min before ${mealDisplayName} at ${resetTime.mealStartTime})`,
                window.mealType
              );
            },
            {
              timezone: "Africa/Addis_Ababa",
              scheduled: false
            }
          );
          
          job.start();
          this.scheduledJobs.push(job);
          
          const mealDisplayName = window.mealType === 'lateNight' ? 'Late Night' : 
                                window.mealType.charAt(0).toUpperCase() + window.mealType.slice(1);
          console.log(`✓ Scheduled reset for ${mealDisplayName}: ${resetTime.displayTime} EAT (30 min before ${resetTime.mealStartTime} start)`);
        }
      }
      
      // Store current configuration hash for change detection
      this.currentConfigHash = this.generateConfigHash(mealWindows);
      
    } catch (error) {
      console.error("Error initializing dynamic scheduler:", error);
      // Fallback to default schedule
      this.startFallbackScheduler();
    }
  }

  static calculateResetTime(mealWindow) {
    try {
      // Parse start time from database and subtract 30 minutes for reset
      const [hours, minutes] = mealWindow.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Subtract 30 minutes before start time for reset
      const resetDate = new Date(startDate.getTime() - (30 * 60000));
      
      const resetHours = resetDate.getHours();
      const resetMinutes = resetDate.getMinutes();
      
      console.log(`${mealWindow.mealType}: Start time ${mealWindow.startTime} → Reset time ${resetHours.toString().padStart(2, '0')}:${resetMinutes.toString().padStart(2, '0')}`);
      
      return {
        cronExpression: `${resetMinutes} ${resetHours} * * *`,
        displayTime: `${resetHours.toString().padStart(2, '0')}:${resetMinutes.toString().padStart(2, '0')}`,
        mealStartTime: mealWindow.startTime
      };
    } catch (error) {
      console.error(`Error calculating reset time for ${mealWindow.mealType}:`, error);
      return null;
    }
  }

  static generateConfigHash(mealWindows) {
    const config = mealWindows.map(w => `${w.mealType}:${w.startTime}:${w.enabled}`).join('|');
    return require('crypto').createHash('md5').update(config).digest('hex');
  }

  static async updateSchedulerIfNeeded() {
    try {
      const currentWindows = await MealWindow.find({ enabled: true });
      const newConfigHash = this.generateConfigHash(currentWindows);
      
      if (newConfigHash !== this.currentConfigHash) {
        console.log("Meal window configuration changed, updating scheduler...");
        await this.initializeDynamicScheduler();
      }
    } catch (error) {
      console.error("Error checking for scheduler updates:", error);
    }
  }

  static startFallbackScheduler() {
    console.log("Starting fallback scheduler with default times");
    
    // Fallback to original hardcoded schedule
    const fallbackSchedules = [
      { cron: "45 5 * * *", label: "05:45 AM EAT (After Late Night)" },
      { cron: "30 9 * * *", label: "09:30 AM EAT (After Breakfast)" },
      { cron: "30 14 * * *", label: "14:30 PM EAT (After Lunch)" },
      { cron: "30 20 * * *", label: "20:30 PM EAT (After Dinner)" }
    ];

    fallbackSchedules.forEach(schedule => {
      cron.schedule(schedule.cron, async () => {
        await this.resetMealDatabase(schedule.label);
      }, {
        timezone: "Africa/Addis_Ababa",
      });
    });
  }

  static async resetMealDatabase(timeLabel, mealType = null) {
    try {
      const eatTime = new Date().toLocaleString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      console.log(
        `[${eatTime} EAT] Starting scheduled meal database reset at ${timeLabel}`,
      );

      // Hard delete: Remove all meal attendance records
      const result = await MealCurrent.deleteMany({});

      console.log(`[${eatTime} EAT] Database reset completed at ${timeLabel}`);
      console.log(`Deleted ${result.deletedCount} meal attendance records`);
      console.log("Students can now use their meals again");

      // Optional: Log to a file or send notification
      // You can add additional logging or notification logic here
    } catch (error) {
      const eatTime = new Date().toLocaleString("en-US", {
        timeZone: "Africa/Addis_Ababa",
      });
      console.error(
        `[${eatTime} EAT] Error during database reset at ${timeLabel}:`,
        error,
      );

      // Optional: Send error notification or alert
      // You can add error handling/notification logic here
    }
  }

  // Test function to verify soft reset works (for immediate testing)
  static async testReset() {
    try {
      console.log(
        `[${new Date().toISOString()}] TEST: Starting immediate soft reset test`,
      );

      // Soft reset: Update all active records to 'reset' status
      const result = await MealCurrent.updateMany(
        { status: "active" },
        {
          status: "reset",
          resetTime: new Date(),
        },
      );

      console.log(
        `[${new Date().toISOString()}] TEST: Soft reset test completed`,
      );
      console.log(
        `TEST: Reset ${result.modifiedCount} meal attendance records (preserved for audit)`,
      );

      return { success: true, resetCount: result.modifiedCount };
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] TEST: Error during soft reset test:`,
        error,
      );
      return { success: false, error: error.message };
    }
  }
}

module.exports = SchedulerService;

