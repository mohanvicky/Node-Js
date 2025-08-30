const Expense = require('../models/Expenses');
const Budget = require('../models/Budget');
const EMI = require('../models/EMI');
const Investment = require('../models/Investment');
const ExpenseCategory = require('../models/ExpenseCategory');
const moment = require('moment');

exports.getFinancialOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { range = 'daily', date = new Date() } = req.query;

    const anchorDate = moment(date);
    let startDate, endDate, prevStartDate, prevEndDate;

    // 🗓️ Set ranges
    switch (range) {
      case 'weekly':
        startDate = anchorDate.clone().startOf('week');
        endDate = anchorDate.clone().endOf('week');
        prevStartDate = startDate.clone().subtract(1, 'week');
        prevEndDate = endDate.clone().subtract(1, 'week');
        break;
      case 'monthly':
        startDate = anchorDate.clone().startOf('month');
        endDate = anchorDate.clone().endOf('month');
        prevStartDate = startDate.clone().subtract(1, 'month');
        prevEndDate = endDate.clone().subtract(1, 'month');
        break;
      case 'yearly':
        startDate = anchorDate.clone().startOf('year');
        endDate = anchorDate.clone().endOf('year');
        prevStartDate = startDate.clone().subtract(1, 'year');
        prevEndDate = endDate.clone().subtract(1, 'year');
        break;
      case 'daily':
      default:
        startDate = anchorDate.clone().startOf('day');
        endDate = anchorDate.clone().endOf('day');
        prevStartDate = startDate.clone().subtract(1, 'day');
        prevEndDate = endDate.clone().subtract(1, 'day');
        break;
    }

    // ✅ Current expenses (with category populated)
    const expenses = await Expense.find({
      userId,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      categoryId: { $ne: null }
    }).populate('categoryId');

    // 🔁 Previous period expenses
    const previousExpenses = await Expense.find({
      userId,
      date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() }
    });

    const budgets = await Budget.find({
      userId,
      startDate: { $lte: endDate.toDate() },
      endDate: { $gte: startDate.toDate() }
    });

    // 🔁 New: Get monthly EMI total
    const emis = await EMI.find({ userId, isPreclosed: false });
    const totalMonthlyEMI = emis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);

    const categoryData = {};
    let totalSpent = 0;
    let totalBudget = 0;

    // 💰 Aggregate expenses
    for (const expense of expenses) {
      if (!expense.categoryId) continue;

      const categoryId = expense.categoryId._id.toString();
      const categoryName = expense.categoryId.name;
      totalSpent += expense.amount;

      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          categoryId,
          categoryName,
          spentAmount: 0,
          budgetedAmount: 0
        };
      }
      categoryData[categoryId].spentAmount += expense.amount;
    }

    // 🧾 Aggregate budgets
    for (const budget of budgets) {
      const id = budget.categoryId.toString();
      if (!categoryData[id]) {
        // Skip categories not present in expenses
        continue;
      }
      categoryData[id].budgetedAmount += budget.budgetedAmount;
      totalBudget += budget.budgetedAmount;
    }

    // 📊 Final breakdown
    const breakdown = Object.values(categoryData)
      .map(cat => {
        const percentageOfBudgetUsed = cat.budgetedAmount > 0
          ? Math.round((cat.spentAmount / cat.budgetedAmount) * 100)
          : null;

        const percentageOfTotalSpent = totalSpent > 0
          ? Math.round((cat.spentAmount / totalSpent) * 100)
          : 0;

        return {
          ...cat,
          percentageOfBudgetUsed,
          percentageOfTotalSpent
        };
      })
      .sort((a, b) => b.spentAmount - a.spentAmount); // sort by spent

    // 📈 Spending trend
    const previousTotalSpent = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
    const spendingTrend = previousTotalSpent > 0
      ? totalSpent > previousTotalSpent ? 'increase' : totalSpent < previousTotalSpent ? 'decrease' : 'no change'
      : 'no data';

    // FETCH INVESTMENTS
    const investments = await Investment.find({ userId });
    let totalInvested = 0;
    let totalInvestmentValue = 0;
    investments.forEach(inv => {
      totalInvested += inv.amountInvested;
      totalInvestmentValue += inv.currentValue;
    });
    const investmentGain = totalInvestmentValue - totalInvested;
    const monthlyInvestments = await Investment.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { year: { $year: "$startDate" }, month: { $month: "$startDate" } },
          totalInvested: { $sum: "$amountInvested" },
          totalCurrentValue: { $sum: "$currentValue" },
          investments: { $push: "$$ROOT" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        timeRange: { startDate, endDate },
        totalBudget,
        totalSpent,
        currentSavings: totalBudget - totalSpent,
        totalMonthlyEMI,
        spendingTrend,
        categories: breakdown,
        investments: {
          totalInvested,
          totalCurrentValue: totalInvestmentValue,
          totalGain: investmentGain,
          monthlyTotals: monthlyInvestments
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching financial overview",
        details: error.message
      },
      data: null
    });
  }
};
