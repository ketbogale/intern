const cron = require("node-cron");
const MealCurrent = require("../models/mealCurrent");
const mysql = require("mysql2/promise");
const Student = require("../models/student");

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

    // Daily SIS sync at 1:00 AM EAT - Update student data from university database
    cron.schedule(
      "0 20 * * *",
      async () => {
        await this.syncStudentDataFromSIS();
      },
      {
        timezone: "Africa/Addis_Ababa",
      },
    );

    console.log("Meal database scheduler started successfully");
    console.log(
      "Scheduled automatic resets at: 2:00 AM, 9:00 AM, and 3:00 PM (East Africa Time)",
    );
    console.log("Scheduled daily SIS sync at: 1:00 AM (East Africa Time)");
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

  // SIS sync function to update student data from university MySQL database
  static async syncStudentDataFromSIS() {
    let universityDB;
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
        `[${eatTime} EAT] Starting scheduled SIS sync from university database`,
      );

      // Connect to university's MySQL SIS database
      universityDB = await mysql.createConnection({
        host: process.env.SIS_DB_HOST || "sis-db.salaleuniversity.edu",
        port: process.env.SIS_DB_PORT || 3306,
        user: process.env.SIS_DB_USER || "meal_system_user",
        password: process.env.SIS_DB_PASSWORD || "secure_password",
        database: process.env.SIS_DB_NAME || "student_information_system",
      });

      // Query active students from SIS
      const [students] = await universityDB.execute(`
                SELECT 
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    s.middle_name,
                    d.department_name,
                    s.photo_path
                FROM students s
                LEFT JOIN departments d ON s.department_id = d.department_id
                WHERE s.status = 'ACTIVE' 
                AND s.enrollment_status IN ('ENROLLED', 'REGISTERED')
                ORDER BY s.student_id
            `);

      let newStudents = 0;
      let updatedStudents = 0;

      // Process students
      for (const sisStudent of students) {
        const fullName = [
          sisStudent.first_name,
          sisStudent.middle_name,
          sisStudent.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        const studentData = {
          id: sisStudent.student_id,
          name: fullName,
          department: sisStudent.department_name || "Unknown",
          photoUrl: sisStudent.photo_path || "/public/images/default.jpg",
        };

        const existingStudent = await Student.findOne({
          id: sisStudent.student_id,
        });

        if (existingStudent) {
          await Student.findOneAndUpdate(
            { id: sisStudent.student_id },
            studentData,
          );
          updatedStudents++;
        } else {
          await Student.create(studentData);
          newStudents++;
        }
      }

      // Remove inactive students
      const sisStudentIds = students.map((s) => s.student_id);
      const deleteResult = await Student.deleteMany({
        id: { $nin: sisStudentIds },
      });

      console.log(`[${eatTime} EAT] SIS sync completed successfully`);
      console.log(
        `New students: ${newStudents}, Updated: ${updatedStudents}, Removed: ${deleteResult.deletedCount}`,
      );
    } catch (error) {
      const eatTime = new Date().toLocaleString("en-US", {
        timeZone: "Africa/Addis_Ababa",
      });
      console.error(`[${eatTime} EAT] Error during SIS sync:`, error.message);
    } finally {
      if (universityDB) {
        await universityDB.end();
      }
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
