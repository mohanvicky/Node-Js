// models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0, 'Amount cannot be negative']
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      default: Date.now
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please add a payment method'],
      enum: ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Wallet', 'Net Banking'],
      trim: true
    },
    billNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Bill number cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);