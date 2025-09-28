const ExcelJS = require('exceljs');
const CostSharingPayment = require('../models/CostSharingPayment');
const CostSharingStudent = require('../models/CostSharingStudent');

// Export payment records to Excel
const exportPaymentRecords = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;

    // Build query filter
    let filter = {};
    
    if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    } else if (startDate && endDate) {
      filter.transferDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get payment records
    const payments = await CostSharingPayment.find(filter)
      .sort({ transferDate: -1 })
      .lean();

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payment records found for the specified criteria'
      });
    }

    // Get student details for each payment
    const studentIds = [...new Set(payments.map(p => p.studentId))];
    const students = await CostSharingStudent.find({ 
      id: { $in: studentIds } 
    }).lean();

    // Create student lookup map
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Records');

    // Set up columns
    worksheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Amount (ETB)', key: 'amount', width: 15 },
      { header: 'Date of Payment', key: 'paymentDate', width: 20 },
      { header: 'Transfer Reference', key: 'transferReference', width: 25 },
      { header: 'Bank Account', key: 'bankAccount', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Month/Year', key: 'monthYear', width: 12 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows
    payments.forEach((payment, index) => {
      const student = studentMap[payment.studentId];
      const row = worksheet.addRow({
        name: student ? student.name : 'Unknown Student',
        studentId: payment.studentId,
        amount: payment.amount,
        paymentDate: payment.transferDate.toLocaleDateString('en-GB'),
        transferReference: payment.transferReference || 'N/A',
        bankAccount: payment.bankAccountNumber || 'N/A',
        status: payment.status.toUpperCase(),
        monthYear: `${payment.month}/${payment.year}`
      });

      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }

      // Style status column based on status
      const statusCell = row.getCell('status');
      if (payment.status === 'completed') {
        statusCell.font = { color: { argb: '28A745' }, bold: true };
      } else if (payment.status === 'failed') {
        statusCell.font = { color: { argb: 'DC3545' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFC107' }, bold: true };
      }

      // Format amount column
      const amountCell = row.getCell('amount');
      amountCell.numFmt = '#,##0.00';
      amountCell.alignment = { horizontal: 'right' };
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary row
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const summaryRowNumber = payments.length + 3;
    
    worksheet.getCell(`A${summaryRowNumber}`).value = 'TOTAL PAYMENTS:';
    worksheet.getCell(`A${summaryRowNumber}`).font = { bold: true };
    worksheet.getCell(`B${summaryRowNumber}`).value = payments.length;
    worksheet.getCell(`B${summaryRowNumber}`).font = { bold: true };
    worksheet.getCell(`C${summaryRowNumber}`).value = totalAmount;
    worksheet.getCell(`C${summaryRowNumber}`).font = { bold: true };
    worksheet.getCell(`C${summaryRowNumber}`).numFmt = '#,##0.00';

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = month && year 
      ? `Payment_Records_${month}_${year}_${timestamp}.xlsx`
      : `Payment_Records_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting payment records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payment records'
    });
  }
};

// Export monthly summary to Excel
const exportMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Get all payments for the year
    const payments = await CostSharingPayment.find({ year: targetYear })
      .sort({ month: 1, transferDate: -1 })
      .lean();

    // Get all students
    const students = await CostSharingStudent.find({ isActive: true }).lean();
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Monthly Summary ${targetYear}`);

    // Group payments by month
    const monthlyData = {};
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = payments.filter(p => p.month === month);
    }

    // Set up columns
    worksheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Students Paid', key: 'studentsPaid', width: 15 },
      { header: 'Total Amount (ETB)', key: 'totalAmount', width: 20 },
      { header: 'Successful Transfers', key: 'successful', width: 20 },
      { header: 'Failed Transfers', key: 'failed', width: 18 }
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Add monthly data
    let yearlyTotal = 0;
    let yearlyStudents = 0;
    let yearlySuccessful = 0;
    let yearlyFailed = 0;

    monthNames.forEach((monthName, index) => {
      const monthNumber = index + 1;
      const monthPayments = monthlyData[monthNumber] || [];
      
      const totalAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const successful = monthPayments.filter(p => p.status === 'completed').length;
      const failed = monthPayments.filter(p => p.status === 'failed').length;

      yearlyTotal += totalAmount;
      yearlyStudents += monthPayments.length;
      yearlySuccessful += successful;
      yearlyFailed += failed;

      const row = worksheet.addRow({
        month: monthName,
        studentsPaid: monthPayments.length,
        totalAmount: totalAmount,
        successful: successful,
        failed: failed
      });

      // Format amount
      row.getCell('totalAmount').numFmt = '#,##0.00';
      row.getCell('totalAmount').alignment = { horizontal: 'right' };
    });

    // Add yearly summary
    const summaryRow = worksheet.addRow({
      month: 'YEARLY TOTAL',
      studentsPaid: yearlyStudents,
      totalAmount: yearlyTotal,
      successful: yearlySuccessful,
      failed: yearlyFailed
    });

    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E9ECEF' }
    };
    summaryRow.getCell('totalAmount').numFmt = '#,##0.00';

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate filename
    const filename = `Monthly_Summary_${targetYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export monthly summary'
    });
  }
};

module.exports = {
  exportPaymentRecords,
  exportMonthlySummary
};
