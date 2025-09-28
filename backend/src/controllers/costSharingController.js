const CostSharingStudent = require('../models/CostSharingStudent');
const CostSharingPayment = require('../models/CostSharingPayment');
const bankTransferService = require('../services/bankTransferService');
const Student = require('../models/student');

// Get all cost-sharing students
const getCostSharingStudents = async (req, res) => {
  try {
    const students = await CostSharingStudent.find({ 
      isActive: true 
    }).select('id name department monthlyAllowance');
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching cost-sharing students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost-sharing students'
    });
  }
};

// Record payment for a cost-sharing student with bank transfer
const recordPayment = async (req, res) => {
  try {
    const { studentId, month, year, amount, notes } = req.body;

    if (!studentId || !month || !year || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, month, year, and amount are required'
      });
    }

    // Find the student
    const student = await CostSharingStudent.findOne({ 
      id: studentId, 
      isActive: true 
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Cost-sharing student not found'
      });
    }

    // Check if payment already exists for this month/year
    const existingPayment = await CostSharingPayment.findOne({
      studentId,
      month,
      year
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already recorded for this month'
      });
    }

    // Process bank transfer
    const transferResult = await bankTransferService.processTransfer({
      accountNumber: student.bankAccountNumber,
      amount: amount,
      studentName: student.name,
      studentId: student.id,
      description: `Monthly allowance - ${month}/${year}`
    });

    // Create new payment record
    const payment = new CostSharingPayment({
      studentId,
      month,
      year,
      amount: amount,
      bankAccountNumber: student.bankAccountNumber,
      transferReference: transferResult.transferReference,
      status: transferResult.success ? 'completed' : 'failed',
      bankResponse: transferResult.bankResponse,
      processedBy: req.user?.username || 'admin'
    });

    await payment.save();

    if (transferResult.success) {
      res.json({
        success: true,
        message: 'Payment transferred successfully to bank account',
        payment: {
          ...payment.toObject(),
          transferDetails: {
            transferReference: transferResult.transferReference,
            transactionId: transferResult.transactionId,
            bankName: student.bankName
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Bank transfer failed: ' + transferResult.error,
        payment
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
};

// Get payment history for a student
const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;

    const query = { studentId };
    if (year) {
      query.year = parseInt(year);
    }

    const payments = await CostSharingPayment.find(query)
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

// Get monthly payment summary
const getMonthlyPaymentSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get all cost-sharing students
    const totalStudents = await CostSharingStudent.countDocuments({
      isActive: true 
    });

    // Get payments for the specified month/year
    const payments = await CostSharingPayment.find({
      month: currentMonth,
      year: currentYear,
      status: 'paid'
    });

    const paidStudents = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const unpaidStudents = totalStudents - paidStudents;

    res.json({
      success: true,
      summary: {
        month: currentMonth,
        year: currentYear,
        totalStudents,
        paidStudents,
        unpaidStudents,
        totalAmount,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment summary'
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;

    const payment = await CostSharingPayment.findByIdAndUpdate(
      paymentId,
      { 
        status,
        notes: notes || payment.notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};

module.exports = {
  getCostSharingStudents,
  recordPayment,
  getStudentPayments,
  getMonthlyPaymentSummary,
  updatePaymentStatus
};
