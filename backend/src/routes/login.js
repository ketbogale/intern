const express = require("express");
const router = express.Router();
const { login } = require("../controllers/loginController");
const { trackFailedLogin } = require("../controllers/securityController");

// Add security tracking middleware before login
router.post("/login", trackFailedLogin, login);

module.exports = router;
