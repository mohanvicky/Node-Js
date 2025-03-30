const mongoose = require('mongoose');

const ProjectTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    description: "Reference to the kanban column this task belongs to"
  },
  estimates: {
    estimated: {
      type: Number, // in hours
      default: 0
    },
    actual: {
      type: Number, // in hours
      default: 0
    }
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectTask', ProjectTaskSchema);