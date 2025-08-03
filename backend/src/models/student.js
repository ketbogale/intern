const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  department: String,
  photoUrl: String,
  mealUsed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Student", studentSchema);
