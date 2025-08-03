const mongoose = require("mongoose");

const mealCurrentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("MealCurrent", mealCurrentSchema);
