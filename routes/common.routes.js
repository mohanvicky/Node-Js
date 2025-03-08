const express = require("express");
const mongoose = require("mongoose"); // Use mongoose to check connection status
const router = express.Router();

// @desc Health check
router.get("/health", async (req, res) => {
  try {
    // Check MongoDB connection status
    const mongoStatus = mongoose.connection.readyState === 1 ? "UP" : "DOWN";

    res.status(200).json({
      message: "Health check passed",
      status: "UP",
      timestamp: new Date(),
      version: "1.0.0",
      database: mongoStatus
    });
  } catch (error) {
    res.status(500).json({
      message: "Error checking health",
      status: "DOWN",
      timestamp: new Date(),
      version: "1.0.0",
      error: error.message
    });
  }
});

module.exports = router; // Export router
