const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if active user exists with same email or username
    let userEmail = await User.findOne({ email, isActive: true });
    let existingUser = await User.findOne({ username, isActive: true });
    
    if (userEmail) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "User with this email already exists" },
        data: null
      });
    }
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "User with this username already exists" },
        data: null
      });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();
    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", error: error.message },
      data: null
    });
  }
};

// @desc Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if active user exists
    const user = await User.findOne({ email, isActive: true }).select("+password");
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid credentials or account deactivated" },
        data: null
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid credentials" },
        data: null
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();
    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", error: error.message },
      data: null
    });
  }
};

// @desc Get users (only active users by default)
exports.getUsers = async (req, res) => {
  try {
    // Extract parameters from query
    const { username, includeDeactivated } = req.query;
    
    // Build query object
    let query = {};
    
    // Add username filter if provided
    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }
    
    // Include only active users unless specifically requested
    if (includeDeactivated !== 'true') {
      query.isActive = true;
    }

    const users = await User.find(query);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// @desc Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "User not found" },
        data: null
      });
    }

    // Check if user is already deactivated
    if (!user.isActive) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "User is already deactivated" },
        data: null
      });
    }

    // Deactivate the user
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { 
        message: "User deactivated successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          deactivatedAt: user.deactivatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};