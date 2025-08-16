const mongoose = require("mongoose");

const mealCurrentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  mealType: { type: String, default: 'lunch' }, // breakfast, lunch, dinner
}, {
  timestamps: true
});

// Allow multiple entries per student per day for different meals
mealCurrentSchema.index({ studentId: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model("MealCurrent", mealCurrentSchema);
