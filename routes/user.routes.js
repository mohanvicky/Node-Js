const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUsers, deactivateUser } = require("../controllers/users.controller");
const auth = require("../middleware/auth"); // Middleware for authentication
const { forgotPassword, validateOTP, resetPassword, validateSignInOTP, sendSignInOTP } = require('../controllers/auth.controller');

// Routes
router.get("/allUsers", auth, getUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post('/signIn-otp', sendSignInOTP);
router.post('/validateSignIn-otp', validateSignInOTP);
router.post('/forgot-password', forgotPassword);
router.post('/validate-otp', validateOTP);
router.post('/reset-password', resetPassword);
router.put('/:id/deactivate', deactivateUser);
module.exports = router;
