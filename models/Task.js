// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Not Started'
    },
    dueDate: {
      type: Date,
      required: [true, 'Please add a due date']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    isTime: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        required: function() { return this.isRecurring; }
      },
      interval: {
        type: Number,
        default: 1,
        min: 1
      },
      daysOfWeek: {
        type: [Number],
        validate: {
          validator: function(v) {
            return v.every(day => day >= 0 && day <= 6);
          },
          message: 'Days of week must be between 0 and 6'
        }
      },
      endDate: Date,
      occurrences: Number
    },
    reminders: [
      {
        time: Date,
        sent: {
          type: Boolean,
          default: false
        },
        snoozeCount: {
          type: Number,
          default: 0
        }
      }
    ],
    category: String,
    tags: [String],
    completedAt: Date,
    timeTracking: {
      estimatedTime: Number, // In minutes
      actualTime: {
        type: Number,
        default: 0
      },
      logs: [
        {
          startTime: Date,
          endTime: Date,
          duration: Number // In minutes
        }
      ]
    },
    priorityMatrix: {
      important: {
        type: Boolean,
        default: false
      },
      urgent: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Task', TaskSchema);