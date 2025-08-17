const express = require("express");
const Student = require("../models/student");
const router = express.Router();

// Add a single student
router.post("/add", async (req, res) => {
  try {
    const { id, name, department, photoUrl } = req.body;

    // Validate required fields
    if (!id || !name) {
      return res.status(400).json({
        error: "Student ID and name are required",
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ id });
    if (existingStudent) {
      return res.status(409).json({
        error: "Student with this ID already exists",
        student: existingStudent,
      });
    }

    // Create new student
    const studentData = {
      id,
      name,
      department: department || "",
      photoUrl: photoUrl || "",
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
        mealUsed: savedStudent.mealUsed,
      },
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Add multiple students
router.post("/add-multiple", async (req, res) => {
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
    console.error("Error adding multiple students:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get all students
router.get("/list", async (req, res) => {
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
    console.error("Error retrieving students:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get student by ID
router.get("/:id", async (req, res) => {
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
    console.error("Error retrieving student:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Update student by MongoDB _id
router.put("/update/:id", async (req, res) => {
  try {
    const { id, name, department, photoUrl } = req.body;

    // Validate required fields
    if (!id || !name) {
      return res.status(400).json({
        error: "Student ID and name are required",
      });
    }

    // Check if another student already has this ID (excluding current student)
    const existingStudent = await Student.findOne({ 
      id: id, 
      _id: { $ne: req.params.id } 
    });
    if (existingStudent) {
      return res.status(409).json({
        error: "Another student with this ID already exists",
      });
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        id,
        name,
        department: department || "",
        photoUrl: photoUrl || "",
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json({
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
    console.error("Error updating student:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Delete student by student ID
router.delete("/delete/:studentId", async (req, res) => {
  try {
    const deletedStudent = await Student.findOneAndDelete({ 
      id: req.params.studentId 
    });

    if (!deletedStudent) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json({
      message: "Student deleted successfully",
      student: {
        id: deletedStudent.id,
        name: deletedStudent.name,
      },
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
