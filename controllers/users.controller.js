const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let userEmail = await User.findOne({ email });
    let existingUser = await User.findOne({ username });
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

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid credentials" },
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

exports.getUsers = async (req, res) => {
  try {
    // Extract name from query parameters, with optional chaining to prevent errors
    const { username } = req.query;

    // If name is provided, use it for filtering; otherwise, fetch all users
    const users = username 
      ? await User.find({ username: { $regex: username, $options: 'i' } }) 
      : await User.find();

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