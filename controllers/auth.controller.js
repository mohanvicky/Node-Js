const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Gmail email transport configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD // Gmail app password
  }
});

// @desc Request password reset (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        statusCode: 404,
        success: false, 
        error: { message: "User with this email does not exist" }
      });
    }

    // Generate OTP (6-digit number)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Set expiration time (10 minutes from now)
    const otpExpire = Date.now() + 10 * 60 * 1000;
    
    // Hash the OTP before saving
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    // Save to user record - this will overwrite any previous OTP
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpire = otpExpire;
    await user.save({ validateBeforeSave: false });

    // Email options
    const mailOptions = {
      from: `"No Reply - YourAppName" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You requested a password reset for your account.</p>
          <p><strong>Note:</strong> If you previously requested a reset code, that code is now invalid.</p>
          <p>Please use the following OTP to verify your identity:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email or contact support if you believe someone is trying to access your account.</p>
          <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">This is an automated message, please do not reply.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);

      // Log OTP generation to track multiple requests (optional, remove in production)
      console.log(`New OTP generated for ${email} at ${new Date().toISOString()}`);

      res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: { message: "OTP sent to email" }
      });
    } catch (error) {
      // If sending email fails, clear reset fields
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: { message: "Email could not be sent", error: error.message }
      });
    }
  } catch (error) {
    res.status(500).json({ 
      statusCode: 500,
      success: false, 
      error: { message: "Server error", error: error.message }
    });
  }
};

// @desc Validate OTP
exports.validateOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Hash the provided OTP for comparison
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with matching OTP and valid expiration
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid or expired OTP" }
      });
    }

    // Optional: Add a flag to indicate OTP has been validated
    // This can prevent reuse of the same OTP for multiple password resets
    user.otpValidated = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "OTP validated successfully",
        userId: user._id
      }
    });
  } catch (error) {
    res.status(500).json({ 
      statusCode: 500,
      success: false, 
      error: { message: "Server error", error: error.message }
    });
  }
};

// @desc Reset password after OTP validation
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Hash the provided OTP for comparison
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with matching OTP and valid expiration
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid or expired OTP" }
      });
    }

    // Update password
    user.password = newPassword;
    
    // Clear reset fields to invalidate the OTP after use
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    user.otpValidated = undefined;
    
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Password reset successful",
        token
      }
    });
  } catch (error) {
    res.status(500).json({ 
      statusCode: 500,
      success: false, 
      error: { message: "Server error", error: error.message }
    });
  }
};