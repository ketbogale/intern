const express = require("express");
const Student = require("../models/student");
const { handleValidationError, handleUnauthorized } = require('../utils/errorHandler');
const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return handleUnauthorized(res);
  }
};

// Add a single student
router.post("/add", requireAuth, async (req, res) => {
  try {
    const { id, name, department, photoUrl } = req.body;

    // Validate required fields
    if (!id || !name) {
      return handleValidationError(res, "Student ID and name are required");
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ id });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        error: "Student with this ID already exists"
      });
    }

    // Create new student
    const studentData = {
      id,
      name,
      department: department || "",
      photoUrl: photoUrl || "",
      isActive: true
    };

    const newStudent = new Student(studentData);
    const savedStudent = await newStudent.save();

    res.status(201).json({
      message: "Student added successfully",
      student: {
        id: savedStudent.id,
        name: savedStudent.name,
        department: savedStudent.department,
        photoUrl: savedStudent.photoUrl,
        isActive: savedStudent.isActive
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Add multiple students
router.post("/add-multiple", requireAuth, async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        error: "Students array is required and must not be empty",
      });
    }

    const results = {
      added: [],
      skipped: [],
      errors: [],
    };

    for (const studentData of students) {
      try {
        const { id, name, department, photoUrl } = studentData;

        if (!id || !name) {
          results.errors.push({
            data: studentData,
            error: "Student ID and name are required",
          });
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ id });
        if (existingStudent) {
          results.skipped.push({
            id,
            name,
            reason: "Student already exists",
          });
          continue;
        }

        // Create new student
        const newStudent = new Student({
          id,
          name,
          department: department || "",
          photoUrl: photoUrl || "",
          isActive: true,
        });

        const savedStudent = await newStudent.save();
        results.added.push({
          id: savedStudent.id,
          name: savedStudent.name,
          department: savedStudent.department,
        });
      } catch (error) {
        results.errors.push({
          data: studentData,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Bulk student addition completed",
      summary: {
        total: students.length,
        added: results.added.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Get all students
router.get("/list", requireAuth, async (req, res) => {
  try {
    const students = await Student.find({}).select(
      "id name department photoUrl mealUsed",
    );
    res.json({
      message: "Students retrieved successfully",
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Get all students (alternative endpoint for dashboard)
router.get("/all", requireAuth, async (req, res) => {
  try {
    const students = await Student.find({}).select(
      "id name department photoUrl createdAt",
    ).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "All students retrieved successfully",
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Search students by name, ID, or department
router.get("/search", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const query = q.trim();
    
    // Create search conditions with optimized queries
    const searchConditions = [];
    
    // Exact match for ID (case-sensitive) - most efficient for ID searches
    searchConditions.push({ id: query });
    
    // Partial match for ID (case-sensitive) using startsWith for efficiency
    if (query.length > 0) {
      searchConditions.push({ 
        id: { 
          $regex: `^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 
          $options: '' 
        } 
      });
    }
    
    // Case-insensitive search for name using index-friendly regex
    const nameRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    searchConditions.push({ name: nameRegex });
    
    // Case-insensitive search for department
    const deptRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    searchConditions.push({ department: deptRegex });

    const students = await Student.find({
      $or: searchConditions
    })
    .select("id name department photoUrl createdAt")
    .sort({ 
      // Prioritize exact ID matches first, then by creation date
      id: 1,
      createdAt: -1 
    })
    .limit(50); // Limit results for performance

    // Remove duplicates and sort results by relevance
    const uniqueStudents = [];
    const seenIds = new Set();
    
    // First add exact ID matches
    students.forEach(student => {
      if (student.id === query && !seenIds.has(student.id)) {
        uniqueStudents.push(student);
        seenIds.add(student.id);
      }
    });
    
    // Then add other matches
    students.forEach(student => {
      if (student.id !== query && !seenIds.has(student.id)) {
        uniqueStudents.push(student);
        seenIds.add(student.id);
      }
    });

    res.json({
      success: true,
      message: uniqueStudents.length > 0 ? "Students found" : "No students found",
      count: uniqueStudents.length,
      students: uniqueStudents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Get student by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }
    res.json({
      message: "Student found",
      student,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Update student by MongoDB _id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    // Update request received

    const { name, studentId, department, photoUrl } = req.body;

    // Validate required fields
    if (!studentId || !name) {
      return res.status(400).json({
        success: false,
        message: "Student ID and name are required",
      });
    }

    // Check if another student already has this ID (excluding current student)
    const existingStudent = await Student.findOne({ 
      id: studentId, 
      _id: { $ne: req.params.id } 
    });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Another student with this ID already exists",
      });
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        id: studentId,
        name,
        department: department || "",
        photoUrl: photoUrl || "",
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Student updated successfully

    res.json({
      success: true,
      message: "Student updated successfully",
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        department: updatedStudent.department,
        photoUrl: updatedStudent.photoUrl,
        mealUsed: updatedStudent.mealUsed,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

// Delete student by student ID
router.delete("/:studentId", requireAuth, async (req, res) => {
  try {
    const deletedStudent = await Student.findOneAndDelete({ 
      id: req.params.studentId 
    });

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
      student: {
        id: deletedStudent.id,
        name: deletedStudent.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

module.exports = router;
