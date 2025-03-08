const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();
    res.status(201).json({ statusCode: 201, success: true, token, user });
  } catch (error) {
    res.status(500).json({ statusCode: 500,success: false, message: "Server error", error });
  }
};

// @desc Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ statusCode: 400,success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ statusCode: 400,success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = user.getSignedJwtToken();
    res.status(200).json({ statusCode: 200,success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
