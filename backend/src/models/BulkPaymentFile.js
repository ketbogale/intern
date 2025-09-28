const mongoose = require("mongoose");

const bulkPaymentFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
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
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalRecords: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['prepared', 'authorized', 'processing', 'completed', 'failed'],
    default: 'prepared'
  },
  createdBy: {
    type: String,
    required: true
  },
  authorizedBy: {
    type: String
  },
  authorizedAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  paymentData: [{
    studentId: String,
    studentName: String,
    accountNumber: String,
    bankName: String,
    amount: Number,
    reference: String,
    description: String
  }],
  summary: {
    successful: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  cbeResponse: {
    batchId: String,
    transactionId: String,
    status: String,
    message: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
bulkPaymentFileSchema.index({ month: 1, year: 1 });
bulkPaymentFileSchema.index({ status: 1 });
bulkPaymentFileSchema.index({ createdAt: -1 });

module.exports = mongoose.model("BulkPaymentFile", bulkPaymentFileSchema);
