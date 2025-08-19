const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");
const Settings = require("../models/Settings");

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Dashboard stats endpoint called');
    console.log('User session:', req.session.user);
    
    // Get total students count
    const totalStudents = await Student.countDocuments();
    console.log('Total students:', totalStudents);

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
    console.log('Today attendance (unique students):', todayAttendance);

    // Get this week's attendance (unique students only)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weeklyUniqueAttendees = await MealCurrent.distinct('studentId', {
      $or: [
        { date: { $gte: weekStart, $lt: tomorrow } },
        { createdAt: { $gte: weekStart, $lt: tomorrow } }
      ]
    });
    const weeklyAttendance = weeklyUniqueAttendees.length;
    console.log('Weekly attendance (unique students):', weeklyAttendance);

    // Get recent attendance records (last 50) with student details
    const recentAttendance = await MealCurrent.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    console.log('Recent attendance records found:', recentAttendance.length);

    // Get student details for recent attendance
    const formattedAttendance = [];
    for (const record of recentAttendance) {
      const student = await Student.findOne({ id: record.studentId });
      formattedAttendance.push({
        studentId: record.studentId,
        studentName: student?.name || `Student ${record.studentId}`,
        date: record.date || record.createdAt,
        status: 'Present'
      });
    }

    // Check for low attendance alerts
    const settings = await Settings.findOne();
    const lowAttendanceThreshold = settings?.lowAttendanceThreshold || 50;
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
      console.log('🚨 Low attendance alert triggered:', lowAttendanceAlert);
    }

    console.log('Sending response with stats:', {
      totalStudents,
      todayAttendance,
      weeklyAttendance,
      attendancePercentage,
      lowAttendanceAlert: lowAttendanceAlert?.isActive || false,
      recentRecords: formattedAttendance.length
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        todayAttendance,
        weeklyAttendance,
        attendancePercentage
      },
      lowAttendanceAlert,
      recentAttendance: formattedAttendance
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
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
    
    console.log('Analytics calculation:', {
      totalStudents,
      attendedStudents,
      uniqueAttendees,
      attendanceRate
    });

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
    console.error('Analytics error:', error);
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

    // Search by ID (exact match) or name (partial match, case insensitive)
    const students = await Student.find({
      $or: [
        { id: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json({
      success: true,
      students,
      count: students.length
    });

  } catch (error) {
    console.error('Student search error:', error);
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
    console.error('Export error:', error);
    res.status(500).json({ error: "Failed to export current attendance data" });
  }
};
