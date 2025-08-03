const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");

exports.checkAttendance = async (req, res) => {
  const { studentId } = req.body;
  try {
    // 1. Check if student exists
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res.json({ status: "invalid" });
    }

    // 2. Check if studentId exists in mealCurrent
    const mealEntry = await MealCurrent.findOne({ studentId });
    if (mealEntry) {
      return res.json({ status: "already_used", student });
    }

    // 3. If not, store the ID in mealCurrent
    await MealCurrent.create({ studentId });

    // 4. Allow entry and show student info
    return res.json({ status: "allowed", student });
  } catch (err) {
    return res.json({ status: "error", message: "System error." });
  }
};
