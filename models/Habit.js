const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    daysOfMonth: [{
      type: Number,
      min: 1,
      max: 31
    }],
    timesPerDay: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  timeOfDay: [{
    type: Date
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0,
    default: 0
  },
  goal: {
    type: {
      type: String,
      enum: ['streak', 'completion_rate', 'total_count'],
      required: true
    },
    target: {
      type: Number,
      required: true,
      min: 1
    },
    current: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  reminders: [{
    time: {
      type: Date,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  logs: [{
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'On Hold', 'Completed'],
    default: 'Active'
  },
  pauseData: {
    pausedAt: Date,
    pausedUntil: Date,
    pauseReason: String,
    streakBeforePause: Number
  },
  streakData: {
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastCompletedDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Habit', HabitSchema);