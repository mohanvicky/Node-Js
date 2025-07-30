const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true
    },
    investmentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    amountInvested: {
      type: Number,
      required: true,
      min: 0
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    roi: {
      type: Number,
      min: 0,
      default: 0
    },
    durationMonths: {
      type: Number,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Investment', InvestmentSchema);
