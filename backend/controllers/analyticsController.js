const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get monthly analytics (income, expense, savings)
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthlyAnalytics = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Format the output
    const formattedStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    monthlyStats.forEach((stat) => {
      const monthIndex = stat._id.month - 1;
      if (stat._id.type === 'income') {
        formattedStats[monthIndex].income = stat.totalAmount;
      } else {
        formattedStats[monthIndex].expense = stat.totalAmount;
      }
    });

    res.status(200).json({ success: true, data: formattedStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category-wise spending
// @route   GET /api/analytics/category
// @access  Private
const getCategoryAnalytics = async (req, res) => {
  try {
    const { month, year, type = 'expense' } = req.query;
    
    // Default to current month and year
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Start and end dates for the specific month
    const startDate = new Date(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`);
    // End date is start of next month
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          type: type, // Usually 'expense'
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    res.status(200).json({ success: true, data: categoryStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMonthlyAnalytics,
  getCategoryAnalytics,
};
