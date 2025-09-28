const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  department: String,
  photoUrl: String,
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Create indexes for efficient searching
studentSchema.index({ id: 1 });
studentSchema.index({ name: 1 });
studentSchema.index({ id: "text", name: "text" });

module.exports = mongoose.model("Student", studentSchema);
