const express = require("express");
const Staff = require("../models/staff");
const router = express.Router();

// Add a new staff member
router.post("/add", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ username });
    if (existingStaff) {
      return res.status(409).json({
        error: "Staff with this username already exists",
      });
    }

    // Create new staff
    const staffData = {
      username,
      password,
      role: role || 'scanner', // Default to scanner role
    };

    const newStaff = new Staff(staffData);
    const savedStaff = await newStaff.save();

    res.status(201).json({
      message: "Staff added successfully",
      staff: {
        id: savedStaff._id,
        username: savedStaff.username,
        role: savedStaff.role,
      },
    });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get all staff
router.get("/list", async (req, res) => {
  try {
    const staff = await Staff.find({}).select("username role");
    res.json({
      message: "Staff retrieved successfully",
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Error retrieving staff:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get staff by username
router.get("/:username", async (req, res) => {
  try {
    const staff = await Staff.findOne({ username: req.params.username }).select("username role");
    if (!staff) {
      return res.status(404).json({
        error: "Staff not found",
      });
    }
    res.json({
      message: "Staff found",
      staff,
    });
  } catch (error) {
    console.error("Error retrieving staff:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
