const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Dashboard stats endpoint called');
    console.log('User session:', req.session.user);
    
    // Get total students count
    const totalStudents = await Student.countDocuments();
    console.log('Total students:', totalStudents);

    // Get today's attendance (check both date field and createdAt for compatibility)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await MealCurrent.countDocuments({
      $or: [
        { date: { $gte: today, $lt: tomorrow } },
        { createdAt: { $gte: today, $lt: tomorrow } }
      ]
    });
    console.log('Today attendance:', todayAttendance);

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weeklyAttendance = await MealCurrent.countDocuments({
      $or: [
        { date: { $gte: weekStart, $lt: tomorrow } },
        { createdAt: { $gte: weekStart, $lt: tomorrow } }
      ]
    });
    console.log('Weekly attendance:', weeklyAttendance);

    // Get recent attendance records (last 10) with student details
    const recentAttendance = await MealCurrent.find()
      .sort({ createdAt: -1 })
      .limit(10)
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

    console.log('Sending response with stats:', {
      totalStudents,
      todayAttendance,
      weeklyAttendance,
      recentRecords: formattedAttendance.length
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        todayAttendance,
        weeklyAttendance
      },
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
    // Get all current attendance records (since database resets after each meal)
    const attendanceData = await MealCurrent.find().lean();
    const totalStudents = await Student.countDocuments();
    
    // Calculate current session statistics
    const attendanceRate = 75; // Fixed percentage for pie chart display
    

    res.json({
      success: true,
      analytics: {
        attendanceRate
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: "Failed to fetch current analytics" });
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
