const mongoose = require("mongoose");

const costSharingPaymentSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true,
    ref: 'CostSharingStudent'
  },
  month: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12
  },
  year: { 
    type: Number, 
    required: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  bankAccountNumber: {
    type: String,
    required: true
  },
  transferDate: { 
    type: Date, 
    default: Date.now 
  },
  transferReference: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  bankResponse: {
    type: String,
    default: ''
  },
  processedBy: {
    type: String,
    default: 'system'
  },
  bulkPaymentFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkPaymentFile',
    default: null
  },
  paymentType: {
    type: String,
    enum: ['individual', 'bulk_cbe', 'bulk_manual'],
    default: 'individual'
  }
}, {
  timestamps: true
});

// Ensure one payment record per student per month/year
costSharingPaymentSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

// Index for efficient querying
costSharingPaymentSchema.index({ paymentDate: -1 });
costSharingPaymentSchema.index({ status: 1 });

module.exports = mongoose.model("CostSharingPayment", costSharingPaymentSchema);
