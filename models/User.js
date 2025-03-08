// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      maxlength: [50, 'Username cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
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
    }
  },
  {
    timestamps: true
  }
);

// // Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// // Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// // Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);