const Expense = require('../models/Expenses');
const ExpenseCategory = require('../models/ExpenseCategory');
const Budget = require('../models/Budget');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, date, categoryName, paymentMethod, billNo, description } = req.body;

    let category = await ExpenseCategory.findOne({ userId: req.user.id, name: categoryName });
    if (!category) {
      category = await ExpenseCategory.create({ userId: req.user.id, name: categoryName });
    }

    let budget = await Budget.findOne({
      userId: req.user.id,
      categoryId: category._id,
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) }
    });

    const expense = new Expense({
      userId: req.user.id,
      amount,
      date,
      categoryId: category._id,
      paymentMethod,
      billNo,
      description,
      ...(budget && { budgetId: budget._id }) // set budgetId if found
    });

    const savedExpense = await expense.save();

    if (budget) {
      await budget.updateSpentAmount(amount);
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { expense: savedExpense }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error creating expense",
        details: error.message
      },
      data: null
    });
  }
};

// Get all expenses for logged-in user
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Fetch expenses
    const expenses = await Expense.find(query)
      .populate('categoryId', 'name') // populate category name
      .sort({ date: -1 });

    // Total amount
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Add percentage to each expense
    const expensesWithPercentage = expenses.map(exp => {
      const percent = totalAmount > 0 ? Math.round((exp.amount / totalAmount) * 100) : 0;
      return {
        ...exp.toObject({ virtuals: true }),
        percentageOfTotal: percent
      };
    });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        totalAmount,
        expenses: expensesWithPercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching expenses",
        details: error.message
      },
      data: null
    });
  }
};


// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Expense not found",
          details: `No expense with ID ${req.params.id}`,
        },
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { expense },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching expense",
        details: error.message,
      },
      data: null,
    });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const existingExpense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!existingExpense) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Expense not found",
          details: `No expense with ID ${req.params.id}`,
        },
        data: null,
      });
    }

    const oldAmount = existingExpense.amount;

    // Update fields
    const updatedData = { ...req.body };
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    // Only proceed with budget update if amount has changed
    if (updatedExpense && oldAmount !== updatedExpense.amount) {
      const { amount, date, categoryId } = updatedExpense;

      const budget = await Budget.findOne({
        userId: req.user.id,
        categoryId: categoryId,
        startDate: { $lte: new Date(date) },
        endDate: { $gte: new Date(date) }
      });

      if (budget) {
        // Roll back old amount, add new one
        budget.spentAmount -= oldAmount;
        await budget.updateSpentAmount(amount);
      }
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { expense: updatedExpense },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error updating expense",
        details: error.message,
      },
      data: null,
    });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Expense not found",
          details: `No expense with ID ${req.params.id}`,
        },
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Expense deleted" },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error deleting expense",
        details: error.message,
      },
      data: null,
    });
  }
};
