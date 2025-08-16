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

exports.exportAttendanceData = async (req, res) => {
  try {
    const attendanceData = await MealCurrent.find()
      .sort({ date: -1 })
      .lean();

    // Create CSV content
    let csvContent = 'Student ID,Student Name,Date,Time\n';
    
    for (const record of attendanceData) {
      const student = await Student.findOne({ id: record.studentId });
      const studentId = record.studentId;
      const studentName = student?.name || 'Unknown Student';
      const date = new Date(record.date).toLocaleDateString();
      const time = new Date(record.date).toLocaleTimeString();
      
      csvContent += `${studentId},"${studentName}",${date},${time}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: "Failed to export attendance data" });
  }
};
