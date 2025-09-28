const mongoose = require("mongoose");

const costSharingStudentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  department: String,
  photoUrl: String,
  monthlyAllowance: { 
    type: Number, 
    required: false,
    min: 0,
    default: 0
  },
  bankAccountNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // National Bank of Ethiopia account number validation (13 digits)
        return /^\d{13}$/.test(v);
      },
      message: 'Bank account number must be 13 digits for National Bank of Ethiopia'
    }
  },
  bankName: {
    type: String,
    default: 'National Bank of Ethiopia',
    required: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  convertedDate: {
    type: Date,
    default: Date.now
  },
  convertedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Create indexes for efficient searching
costSharingStudentSchema.index({ id: 1 });
costSharingStudentSchema.index({ name: 1 });
costSharingStudentSchema.index({ id: "text", name: "text" });

module.exports = mongoose.model("CostSharingStudent", costSharingStudentSchema);
