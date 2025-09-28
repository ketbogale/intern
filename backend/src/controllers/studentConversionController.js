const Student = require('../models/student');
const CostSharingStudent = require('../models/CostSharingStudent');

// Convert regular student to cost-sharing student
const convertToCostSharing = async (req, res) => {
  try {
    const { studentId, bankAccountNumber, monthlyAllowance } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    if (!bankAccountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank account number is required for National Bank of Ethiopia'
      });
    }

    // Validate bank account number format (13 digits for NBE)
    if (!/^\d{13}$/.test(bankAccountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Bank account number must be 13 digits for National Bank of Ethiopia'
      });
    }

    // Find the student in the regular student collection
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student is already in cost-sharing
    const existingCostSharingStudent = await CostSharingStudent.findOne({ id: studentId });
    if (existingCostSharingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student is already in cost-sharing program'
      });
    }

    // Check if bank account number is already used by another student
    const existingBankAccount = await CostSharingStudent.findOne({ bankAccountNumber });
    if (existingBankAccount) {
      return res.status(400).json({
        success: false,
        message: 'This bank account number is already registered with another student'
      });
    }

    // Create cost-sharing student record with bank details
    const costSharingStudent = new CostSharingStudent({
      id: student.id,
      name: student.name,
      department: student.department,
      photoUrl: student.photoUrl,
      monthlyAllowance: monthlyAllowance ? parseFloat(monthlyAllowance) : 0,
      bankAccountNumber: bankAccountNumber,
      bankName: 'National Bank of Ethiopia',
      convertedDate: new Date(),
      convertedBy: req.user?.username || 'admin'
    });

    await costSharingStudent.save();

    // Remove from regular student collection
    await Student.findOneAndDelete({ id: studentId });

    res.json({
      success: true,
      message: 'Student successfully converted to cost-sharing program with bank account',
      student: {
        id: costSharingStudent.id,
        name: costSharingStudent.name,
        department: costSharingStudent.department,
        monthlyAllowance: costSharingStudent.monthlyAllowance,
        bankAccountNumber: costSharingStudent.bankAccountNumber,
        bankName: costSharingStudent.bankName
      }
    });

  } catch (error) {
    console.error('Error converting student to cost-sharing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert student to cost-sharing'
    });
  }
};

// Convert cost-sharing student back to regular student
const convertToRegular = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Find the student in the cost-sharing collection
    const costSharingStudent = await CostSharingStudent.findOne({ id: studentId });
    if (!costSharingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Cost-sharing student not found'
      });
    }

    // Check if student already exists in regular student collection
    const existingStudent = await Student.findOne({ id: studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists in regular student database'
      });
    }

    // Create regular student record (without bank details and monthly allowance)
    const student = new Student({
      id: costSharingStudent.id,
      name: costSharingStudent.name,
      department: costSharingStudent.department,
      photoUrl: costSharingStudent.photoUrl
    });

    await student.save();

    // Remove from cost-sharing collection
    await CostSharingStudent.findOneAndDelete({ id: studentId });

    res.json({
      success: true,
      message: 'Student successfully converted back to cafeteria program. Bank account information removed.',
      student: {
        id: student.id,
        name: student.name,
        department: student.department,
        photoUrl: student.photoUrl
      }
    });

  } catch (error) {
    console.error('Error converting student to regular:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert student back to cafeteria program'
    });
  }
};

module.exports = {
  convertToCostSharing,
  convertToRegular
};
