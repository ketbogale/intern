const cron = require("node-cron");
const MealCurrent = require("../models/mealCurrent");

class SchedulerService {
  static startScheduler() {
    console.log("Starting meal database scheduler for East Africa Time (EAT)");

    // Reset after Late Night meal ends (05:45 AM EAT) - Clear late night attendance
    cron.schedule(
      "45 5 * * *",
      async () => {
        await this.resetMealDatabase("05:45 AM EAT (After Late Night)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    // Reset after Breakfast ends (09:30 AM EAT) - Clear breakfast attendance  
    cron.schedule(
      "30 9 * * *",
      async () => {
        await this.resetMealDatabase("09:30 AM EAT (After Breakfast)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    // Reset after Lunch ends (14:30 PM EAT) - Clear lunch attendance
    cron.schedule(
      "30 14 * * *",
      async () => {
        await this.resetMealDatabase("14:30 PM EAT (After Lunch)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    // Reset after Dinner ends (20:30 PM EAT) - Clear dinner attendance
    cron.schedule(
      "30 20 * * *",
      async () => {
        await this.resetMealDatabase("20:30 PM EAT (After Dinner)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    console.log("Meal database scheduler started successfully");
    console.log(
      "Scheduled automatic resets at: 05:45, 09:30, 14:30, and 20:30 (East Africa Time)",
    );
    console.log("Timezone: Africa/Addis_Ababa (EAT UTC+3)");
  }

  static async resetMealDatabase(timeLabel) {
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

