const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");
const MealWindow = require("../models/MealWindows");
const os = require('os');

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total students count
    const totalStudents = await Student.countDocuments();

    // Get today's attendance (unique students only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayUniqueAttendees = await MealCurrent.distinct('studentId', {
      $or: [
        { date: { $gte: today, $lt: tomorrow } },
        { createdAt: { $gte: today, $lt: tomorrow } }
      ]
    });
    const todayAttendance = todayUniqueAttendees.length;


    // Get recent attendance records (last 50) with student details
    const recentAttendance = await MealCurrent.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get meal windows for determining meal type
    const mealWindows = await MealWindow.getAllAsObject();

    // Helper function to determine meal type based on time
    const determineMealType = (timestamp) => {
      const date = new Date(timestamp);
      const timeString = date.getHours().toString().padStart(2, '0') + ':' + 
                        date.getMinutes().toString().padStart(2, '0');
      
      // Check each meal window to see which one the time falls into
      for (const [mealType, window] of Object.entries(mealWindows)) {
        if (window.enabled && timeString >= window.startTime && timeString <= window.endTime) {
          return mealType;
        }
      }
      
      // If no exact match, find the closest meal window
      const timeMinutes = date.getHours() * 60 + date.getMinutes();
      let closestMeal = 'lunch';
      let closestDistance = Infinity;
      
      for (const [mealType, window] of Object.entries(mealWindows)) {
        if (!window.enabled) continue;
        
        const [startHour, startMin] = window.startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const distance = Math.abs(timeMinutes - startMinutes);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMeal = mealType;
        }
      }
      
      return closestMeal;
    };

    // Get student details for recent attendance
    const formattedAttendance = [];
    for (const record of recentAttendance) {
      const student = await Student.findOne({ id: record.studentId });
      const mealType = record.mealType || determineMealType(record.date || record.createdAt);
      
      formattedAttendance.push({
        studentId: record.studentId,
        studentName: student?.name || `Student ${record.studentId}`,
        date: record.date || record.createdAt,
        mealType: mealType,
        status: 'Present'
      });
    }

    // Check for low attendance alerts
    const lowAttendanceThreshold = 50;
    const attendancePercentage = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;
    
    let lowAttendanceAlert = null;
    if (attendancePercentage < lowAttendanceThreshold) {
      lowAttendanceAlert = {
        isActive: true,
        message: `Low attendance alert: Only ${attendancePercentage}% attendance today (${todayAttendance}/${totalStudents} students)`,
        threshold: lowAttendanceThreshold,
        currentPercentage: attendancePercentage,
        missingStudents: totalStudents - todayAttendance
      };
      // Low attendance alert triggered
    }

    // Sending response with dashboard stats

    res.json({
      success: true,
      stats: {
        totalStudents,
        todayAttendance,
        attendancePercentage
      },
      lowAttendanceAlert,
      recentAttendance: formattedAttendance
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Get current session analytics
exports.getCurrentAnalytics = async (req, res) => {
  try {
    // Get unique students who attended (avoid counting duplicate meal types)
    const uniqueAttendees = await MealCurrent.distinct('studentId');
    const totalStudents = await Student.countDocuments();
    
    // Calculate actual attendance rate
    const attendedStudents = uniqueAttendees.length;
    let attendanceRate = 0;
    
    if (totalStudents > 0) {
      attendanceRate = Math.round((attendedStudents / totalStudents) * 100);
    }
    
    // Analytics calculation completed

    res.json({
      success: true,
      analytics: {
        attendanceRate,
        totalStudents,
        attendedStudents,
        remainingCapacity: totalStudents - attendedStudents
      }
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch current analytics" });
  }
};

// Search students by ID or name
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Optimized search using text index and exact matching
    let students = [];
    
    // First try exact ID match (fastest)
    if (query.length <= 20) { // Assuming student IDs are short
      const exactMatch = await Student.findOne({ id: query });
      if (exactMatch) {
        students = [exactMatch];
      }
    }
    
    // If no exact match, use text search (indexed)
    if (students.length === 0) {
      students = await Student.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    }
    
    // Fallback to optimized regex only if text search fails
    if (students.length === 0) {
      students = await Student.find({
        $or: [
          { id: { $regex: `^${query}`, $options: 'i' } }, // Anchor to start for better performance
          { name: { $regex: `^${query}`, $options: 'i' } }
        ]
      }).limit(10);
    }

    res.json({
      success: true,
      students,
      count: students.length
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to search students" });
  }
};

// Export current attendance data as CSV
exports.exportCurrentAttendance = async (req, res) => {
  try {
    const attendanceData = await MealCurrent.find()
      .sort({ createdAt: -1 })
      .lean();

    // Create CSV content
    let csvContent = 'Student ID,Student Name,Time,Meal Type\n';
    
    for (const record of attendanceData) {
      const student = await Student.findOne({ id: record.studentId });
      const studentId = record.studentId;
      const studentName = student?.name || 'Unknown Student';
      const recordDate = record.date || record.createdAt;
      const time = recordDate.toLocaleTimeString();
      const mealType = record.mealType || 'lunch';
      
      csvContent += `${studentId},"${studentName}",${time},${mealType}\n`;
    }

    const filename = `current_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);

  } catch (error) {
    res.status(500).json({ error: "Failed to export current attendance data" });
  }
};

// Manual meal database reset
exports.resetMealDatabase = async (req, res) => {
  try {
    // Get current time in EAT
    const eatTime = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Delete all meal attendance records
    const result = await MealCurrent.deleteMany({});

    // Manual database reset completed

    res.json({
      success: true,
      message: `Meal database reset successfully. Deleted ${result.deletedCount} records.`,
      resetTime: eatTime,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Failed to reset meal database",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

