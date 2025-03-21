const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/users.controller");
const { forgotPassword, validateOTP, resetPassword } = require('../controllers/auth.controller');

// Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/validate-otp', validateOTP);
router.post('/reset-password', resetPassword);
module.exports = router;
