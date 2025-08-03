const express = require("express");
const router = express.Router();
const { checkAttendance } = require("../controllers/attendanceController");

router.post("/", checkAttendance);

module.exports = router;
