const cron = require("node-cron");
const MealCurrent = require("../models/mealCurrent");

class SchedulerService {
  static startScheduler() {
    console.log("Starting meal database scheduler for East Africa Time (EAT)");

    // Reset at 2:00 AM EAT (02:00) - Night reset
    cron.schedule(
      "0 21 * * *",
      async () => {
        await this.resetMealDatabase("2:00 AM EAT (Night)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );
    cron.schedule(
      "1 18 * * *",
      async () => {
        await this.resetMealDatabase("6:00 AM EAT (Morning)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );
    // Reset at 9:00 AM EAT (09:00) - Morning reset
    cron.schedule(
      "29 23 * * *",
      async () => {
        await this.resetMealDatabase("9:00 AM EAT (Morning)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    // Reset at 3:00 PM EAT (15:00) - Afternoon reset
    cron.schedule(
      "0 9 * * *",
      async () => {
        await this.resetMealDatabase("3:00 PM EAT (Afternoon)");
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    console.log("Meal database scheduler started successfully");
    console.log(
      "Scheduled automatic resets at: 2:00 AM, 9:00 AM, and 3:00 PM (East Africa Time)",
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

