const Student = require("../models/student");
const MealCurrent = require("../models/mealCurrent");
const MealWindow = require("../models/MealWindows");

// Function to determine current meal type based on time
async function getCurrentMealType() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Get all enabled meal windows
  const mealWindows = await MealWindow.find({ enabled: true });
  
  for (const window of mealWindows) {
    const [startHour, startMinute] = window.startTime.split(':').map(Number);
    const [endHour, endMinute] = window.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Allow scanning only between startTime and endTime (no buffers)
    const windowStart = startTime;
    const windowEnd = endTime;
    
    // Check if current time is within this meal window
    if (currentTime >= windowStart && currentTime <= windowEnd) {
      return window.mealType;
    }
  }
  
  return null; // No active meal window
}

exports.checkAttendance = async (req, res) => {
  const { studentId } = req.body;
  try {
    // 1. Check if student exists
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res.json({ status: "invalid" });
    }

    // 2. Determine current meal type based on time
    const currentMealType = await getCurrentMealType();
    if (!currentMealType) {
      return res.json({ 
        status: "blocked", 
        message: "No meal window is currently active",
        student 
      });
    }

    // 3. Check if meal window exists and is enabled
    const mealWindow = await MealWindow.findOne({ mealType: currentMealType });
    if (!mealWindow || !mealWindow.enabled) {
      return res.json({ 
        status: "blocked", 
        message: `${currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1)} meal is currently disabled`,
        student 
      });
    }

    // 3. Check if current time is within attendance window
    if (!mealWindow.isWithinAttendanceWindow()) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');

      return res.json({ 
        status: "blocked", 
        message: `${currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1)} attendance window is closed. Window: ${mealWindow.startTime} - ${mealWindow.endTime}`,
        currentTime,
        windowStart: mealWindow.startTime,
        windowEnd: mealWindow.endTime,
        student 
      });
    }

    // 4. Use findOneAndUpdate with upsert for atomic operation
    const result = await MealCurrent.findOneAndUpdate(
      { 
        studentId, 
        mealType: currentMealType,
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(24, 0, 0, 0))
        }
      },
      { 
        studentId, 
        mealType: currentMealType,
        date: new Date()
      },
      { 
        upsert: true, 
        new: true,
        rawResult: true
      }
    );

    // 5. Check if it was a new insert or existing document
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