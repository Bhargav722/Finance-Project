const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add a positive amount'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify if income or expense'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
