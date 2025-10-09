const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  registerFCMToken,
  removeFCMToken,
  getUserFCMTokens
} = require('../controllers/fcmToken.controller');

// Register FCM token
router.post('/register', auth, registerFCMToken);

// Remove FCM token
router.post('/remove', auth, removeFCMToken);

// Get user's FCM tokens
router.get('/tokens', auth, getUserFCMTokens);

module.exports = router;