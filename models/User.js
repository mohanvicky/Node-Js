// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      trim: true,
      maxlength: [50, 'Username cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    profilePicture: {
      type: String,
      default: 'default-profile.jpg'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deactivatedAt: {
      type: Date,
      default: null
    },
    preferences: {
      reminderSettings: {
        defaultReminderTimes: {
          type: [Number],
          default: [10, 60, 1440] // 10min, 1hr, 1day in minutes
        },
        notificationChannels: {
          type: [String],
          default: ['push']
        },
        snoozeSettings: {
          type: Number,
          default: 10 // 10 minutes
        }
      },
      defaultTaskPriority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      },
      defaultTimeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h'
      },
      defaultView: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      }
    },
    // OTP fields for password reset
    resetPasswordOTP: {
      type: String,
      select: false
    },
    resetPasswordExpire: {
      type: Date,
      select: false
    },
    otpValidated: {
      type: Boolean,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Create compound index to allow same username/email for deactivated users
UserSchema.index(
  { username: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

UserSchema.index(
  { email: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);