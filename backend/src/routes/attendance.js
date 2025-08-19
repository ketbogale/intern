const express = require("express");
const router = express.Router();
const { checkAttendance } = require("../controllers/attendanceController");

router.post("/attendance", checkAttendance);

module.exports = router;
