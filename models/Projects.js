const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  kanbanColumns: [{
    name: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    taskIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTask'
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);