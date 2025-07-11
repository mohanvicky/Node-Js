const Expense = require('../models/Expenses');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, date, category, paymentMethod, billNo, description } = req.body;

    const expense = new Expense({
      userId: req.user.id,
      amount,
      date,
      category,
      paymentMethod,
      billNo,
      description,
    });

    const savedExpense = await expense.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { expense },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error creating expense",
        details: error.message,
      },
      data: null,
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
    console.log(query);
    

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { expenses },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching expenses",
        details: error.message,
      },
      data: null,
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
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

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
