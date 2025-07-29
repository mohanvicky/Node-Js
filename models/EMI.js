const mongoose = require('mongoose');

const EMISchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    loanName: {
      type: String,
      required: true,
      trim: true
    },
    principal: {
      type: Number,
      required: true,
      min: 0
    },
    roi: {
      type: Number,
      required: true // Annual interest rate
    },
    tenureMonths: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    emiAmount: {
      type: Number
    },
    isPreclosed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// 🧠 Auto-calculate EMI before saving
EMISchema.pre('save', function (next) {
  const r = this.roi / 12 / 100;
  const n = this.tenureMonths;
  const P = this.principal;

  if (P && r && n) {
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    this.emiAmount = Math.round(emi);
  }

  next();
});

module.exports = mongoose.model('EMI', EMISchema);
