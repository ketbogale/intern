const CostSharingStudent = require('../models/CostSharingStudent');
const CostSharingPayment = require('../models/CostSharingPayment');
const BulkPaymentFile = require('../models/BulkPaymentFile');
const cbeFileService = require('../services/cbeFileService');
const cbeApiService = require('../services/cbeApiService');
const notificationService = require('../services/notificationService');

// Step 1: Prepare CBE bulk payment file
const prepareBulkPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get all active cost-sharing students
    const students = await CostSharingStudent.find({ 
      isActive: true 
    }).select('id name bankAccountNumber bankName monthlyAllowance');

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active cost-sharing students found'
      });
    }

    // Check for existing payments this month
    const existingPayments = await CostSharingPayment.find({
      month,
      year,
      studentId: { $in: students.map(s => s.id) }
    });

    const paidStudentIds = new Set(existingPayments.map(p => p.studentId));
    const unpaidStudents = students.filter(s => !paidStudentIds.has(s.id));

    if (unpaidStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All students have already been paid for this month'
      });
    }

    // Generate CBE payment file
    const paymentData = unpaidStudents.map(student => ({
      studentId: student.id,
      studentName: student.name,
      accountNumber: student.bankAccountNumber,
      bankName: student.bankName || 'CBE',
      amount: amount,
      reference: `SAL-${month.toString().padStart(2, '0')}${year}-${student.id}`,
      description: `Monthly allowance ${month}/${year} - ${student.name}`
    }));

    const totalAmount = amount * unpaidStudents.length;

    // Create CBE file
    const fileResult = await cbeFileService.generatePaymentFile(paymentData, {
      month,
      year,
      totalAmount,
      totalRecords: unpaidStudents.length
    });

    // Save bulk payment file record
    const bulkPaymentFile = new BulkPaymentFile({
      filename: fileResult.filename,
      filePath: fileResult.filePath,
      downloadUrl: fileResult.downloadUrl,
      month,
      year,
      totalAmount,
      totalRecords: unpaidStudents.length,
      status: 'prepared',
      createdBy: req.user?.username || 'admin',
      paymentData: paymentData
    });

    await bulkPaymentFile.save();

    // Send OTP for authorization
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store auth code temporarily (in production, use Redis or similar)
    global.bulkPaymentAuthCodes = global.bulkPaymentAuthCodes || {};
    global.bulkPaymentAuthCodes[bulkPaymentFile._id] = {
      code: authCode,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    // Send SMS notification (mock implementation)
    await notificationService.sendAuthorizationCode(
      req.user?.phone || '+251911000000',
      authCode,
      'CBE Bulk Payment Authorization'
    );

    res.json({
      success: true,
      message: 'Payment file prepared successfully',
      paymentFile: {
        id: bulkPaymentFile._id,
        filename: fileResult.filename,
        downloadUrl: fileResult.downloadUrl
      },
      totalAmount,
      summary: {
        totalStudents: unpaidStudents.length,
        alreadyPaid: paidStudentIds.size,
        amountPerStudent: amount
      }
    });

  } catch (error) {
    console.error('Error preparing bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to prepare bulk payment'
    });
  }
};

// Step 2: Authorize bulk payment
const authorizeBulkPayment = async (req, res) => {
  try {
    const { authorizationCode, paymentFileId, totalAmount } = req.body;

    if (!authorizationCode || !paymentFileId) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code and payment file ID are required'
      });
    }

    // Verify authorization code
    const storedAuth = global.bulkPaymentAuthCodes?.[paymentFileId];
    if (!storedAuth || storedAuth.code !== authorizationCode || Date.now() > storedAuth.expires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired authorization code'
      });
    }

    // Find and update bulk payment file
    const bulkPaymentFile = await BulkPaymentFile.findById(paymentFileId);
    if (!bulkPaymentFile) {
      return res.status(404).json({
        success: false,
        message: 'Payment file not found'
      });
    }

    // Update status to authorized
    bulkPaymentFile.status = 'authorized';
    bulkPaymentFile.authorizedAt = new Date();
    bulkPaymentFile.authorizedBy = req.user?.username || 'admin';
    await bulkPaymentFile.save();

    // Clear the auth code
    delete global.bulkPaymentAuthCodes[paymentFileId];

    res.json({
      success: true,
      message: 'Payment authorized successfully'
    });

  } catch (error) {
    console.error('Error authorizing bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authorize payment'
    });
  }
};

// Step 3: Process bulk payment through CBE
const processBulkPayment = async (req, res) => {
  try {
    const { paymentFileId } = req.body;

    const bulkPaymentFile = await BulkPaymentFile.findById(paymentFileId);
    if (!bulkPaymentFile || bulkPaymentFile.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: 'Payment file not found or not authorized'
      });
    }

    // Update status to processing
    bulkPaymentFile.status = 'processing';
    bulkPaymentFile.processedAt = new Date();
    await bulkPaymentFile.save();

    // Process through CBE API (mock implementation)
    const cbeResult = await cbeApiService.processBulkPayment({
      fileId: bulkPaymentFile._id,
      filePath: bulkPaymentFile.filePath,
      totalAmount: bulkPaymentFile.totalAmount,
      totalRecords: bulkPaymentFile.totalRecords
    });

    let successful = 0;
    let failed = 0;
    const failedPayments = [];
    const successfulPayments = [];

    // Process each payment record
    for (const paymentRecord of bulkPaymentFile.paymentData) {
      try {
        // Check if payment already exists
        const existingPayment = await CostSharingPayment.findOne({
          studentId: paymentRecord.studentId,
          month: bulkPaymentFile.month,
          year: bulkPaymentFile.year
        });

        if (existingPayment) {
          failed++;
          failedPayments.push({
            studentId: paymentRecord.studentId,
            name: paymentRecord.studentName,
            error: 'Payment already exists for this month'
          });
          continue;
        }

        // Create payment record
        const payment = new CostSharingPayment({
          studentId: paymentRecord.studentId,
          month: bulkPaymentFile.month,
          year: bulkPaymentFile.year,
          amount: paymentRecord.amount,
          bankAccountNumber: paymentRecord.accountNumber,
          transferReference: paymentRecord.reference,
          status: 'completed',
          bankResponse: cbeResult.success ? 'CBE_BULK_SUCCESS' : 'CBE_BULK_FAILED',
          processedBy: req.user?.username || 'admin',
          bulkPaymentFileId: bulkPaymentFile._id
        });

        await payment.save();
        successful++;
        successfulPayments.push({
          studentId: paymentRecord.studentId,
          name: paymentRecord.studentName,
          amount: paymentRecord.amount
        });

      } catch (error) {
        failed++;
        failedPayments.push({
          studentId: paymentRecord.studentId,
          name: paymentRecord.studentName,
          error: error.message
        });
      }
    }

    // Update bulk payment file status
    bulkPaymentFile.status = 'completed';
    bulkPaymentFile.completedAt = new Date();
    bulkPaymentFile.summary = {
      successful,
      failed,
      totalAmount: successful * (bulkPaymentFile.totalAmount / bulkPaymentFile.totalRecords)
    };
    await bulkPaymentFile.save();

    // Send completion notifications
    await notificationService.sendBulkPaymentComplete({
      successful,
      failed,
      totalAmount: bulkPaymentFile.summary.totalAmount,
      month: bulkPaymentFile.month,
      year: bulkPaymentFile.year
    });

    res.json({
      success: true,
      message: 'Bulk payment processed successfully',
      summary: {
        successful,
        failed,
        totalAmount: bulkPaymentFile.summary.totalAmount,
        totalRecords: bulkPaymentFile.totalRecords
      },
      details: {
        successful: successfulPayments,
        failed: failedPayments
      }
    });

  } catch (error) {
    console.error('Error processing bulk payment:', error);
    
    // Update status to failed
    if (req.body.paymentFileId) {
      await BulkPaymentFile.findByIdAndUpdate(req.body.paymentFileId, {
        status: 'failed',
        errorMessage: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payment'
    });
  }
};

// Get bulk payment status
const getBulkPaymentStatus = async (req, res) => {
  try {
    const { fileId } = req.params;

    const bulkPaymentFile = await BulkPaymentFile.findById(fileId);
    if (!bulkPaymentFile) {
      return res.status(404).json({
        success: false,
        message: 'Bulk payment file not found'
      });
    }

    res.json({
      success: true,
      status: bulkPaymentFile.status,
      summary: bulkPaymentFile.summary,
      createdAt: bulkPaymentFile.createdAt,
      completedAt: bulkPaymentFile.completedAt
    });

  } catch (error) {
    console.error('Error getting bulk payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
};

module.exports = {
  prepareBulkPayment,
  authorizeBulkPayment,
  processBulkPayment,
  getBulkPaymentStatus
};
