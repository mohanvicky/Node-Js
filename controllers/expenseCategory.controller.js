const ExpenseCategory = require('../models/ExpenseCategory');

// Create expense category
exports.createExpenseCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    const category = new ExpenseCategory({
      userId: req.user.id,
      name,
      type
    });

    const saved = await category.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { expenseCategory: saved }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error creating expense category',
        details: error.message
      },
      data: null
    });
  }
};

// Get all expense categories for the user
exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ userId: req.user.id });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { expenseCategories: categories }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error fetching expense categories',
        details: error.message
      },
      data: null
    });
  }
};

// Delete an expense category
exports.deleteExpenseCategory = async (req, res) => {
  try {
    const deleted = await ExpenseCategory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: 'Expense category not found',
          details: `ID: ${req.params.id}`
        },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Expense category deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error deleting expense category',
        details: error.message
      },
      data: null
    });
  }
};
