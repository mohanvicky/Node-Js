// models/Budget.js
const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true
    },
    budgetedAmount: {
      type: Number,
      required: [true, 'Please add a budgeted amount'],
      min: [0, 'Budgeted amount cannot be negative']
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date'],
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date'],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    isFixed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Exceeded'],
      default: 'Active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for remaining budget
BudgetSchema.virtual('remainingAmount').get(function() {
  return this.budgetedAmount - this.spentAmount;
});

// Virtual for budget utilization percentage
BudgetSchema.virtual('utilizationPercentage').get(function() {
  return Math.round((this.spentAmount / this.budgetedAmount) * 100);
});

// Index for better query performance
BudgetSchema.index({ userId: 1, category: 1 });
BudgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Method to update spent amount
BudgetSchema.methods.updateSpentAmount = async function(amount) {
  this.spentAmount += amount;
  
  // Update status based on spending
  if (this.spentAmount >= this.budgetedAmount) {
    this.status = 'Exceeded';
  } else if (new Date() > this.endDate) {
    this.status = 'Completed';
  } else {
    this.status = 'Active';
  }
  
  return this.save();
};

module.exports = mongoose.model('Budget', BudgetSchema);