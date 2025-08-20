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

    // 2. Use findOneAndUpdate with upsert for atomic operation
    const result = await MealCurrent.findOneAndUpdate(
      { 
        studentId, 
        mealType,
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(24, 0, 0, 0))
        }
      },
      { 
        studentId, 
        mealType,
        date: new Date()
      },
      { 
        upsert: true, 
        new: true,
        rawResult: true
      }
    );

    // 3. Check if it was a new insert or existing document
    if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
      return res.json({ status: "already_used", student });
    } else {
      return res.json({ status: "allowed", student });
    }
  } catch (err) {
    console.error('Attendance check error:', err);
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      // Find the student again for the response
      const student = await Student.findOne({ id: studentId });
      return res.json({ status: "already_used", student });
    }
    return res.json({ status: "error", message: "System error." });
  }
};