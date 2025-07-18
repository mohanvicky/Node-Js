const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  { timestamps: true }
);

// Unique category name per user
ExpenseCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
