const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");

exports.checkAttendance = async (req, res) => {
  const { studentId, mealType = 'lunch' } = req.body;
  try {
    // 1. Check if student exists
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res.json({ status: "invalid" });
    }

    // 2. Check if student already has attendance for this meal today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await MealCurrent.findOne({ 
      studentId, 
      mealType,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingEntry) {
      return res.json({ status: "already_used", student });
    }

    // 3. Create new attendance record
    await MealCurrent.create({ 
      studentId, 
      mealType,
      date: new Date()
    });

    // 4. Allow entry and show student info
    return res.json({ status: "allowed", student });
  } catch (err) {
    console.error('Attendance check error:', err);
    return res.json({ status: "error", message: "System error." });
  }
};
