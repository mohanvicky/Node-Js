const ExpenseCategory = require('../models/ExpenseCategory');
const Budget = require('../models/Budget');

exports.createBudget = async (req, res) => {
  try {
    const { categoryName, budgetedAmount, startDate, endDate, isFixed } = req.body;

    // Ensure category exists or create it
    let category = await ExpenseCategory.findOne({ userId: req.user.id, name: categoryName });
    if (!category) {
      category = await ExpenseCategory.create({ userId: req.user.id, name: categoryName });
    }

    const budget = new Budget({
      userId: req.user.id,
      categoryId: category._id,
      budgetedAmount,
      startDate,
      endDate,
      isFixed
    });

    const savedBudget = await budget.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { budget: savedBudget }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error creating budget',
        details: error.message
      },
      data: null
    });
  }
};


// Get all budgets for the user with optional date filter
exports.getBudgets = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const budgets = await Budget.find(query).sort({ startDate: -1 });
    console.log("Budgets:", budgets);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { budgets }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching budgets",
        details: error.message
      },
      data: null
    });
  }
};

// Get a single budget
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });

    if (!budget) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Budget not found",
          details: `No budget found with ID ${req.params.id}`
        },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { budget }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error fetching budget",
        details: error.message
      },
      data: null
    });
  }
};

// Update a budget
exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryName,
      budgetedAmount,
      startDate,
      endDate,
      isFixed
    } = req.body;

    const budget = await Budget.findOne({ _id: id, userId: req.user.id });
    if (!budget) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Budget not found' },
        data: null
      });
    }

    // Handle category change
    if (categoryName) {
      let category = await ExpenseCategory.findOne({ userId: req.user.id, name: categoryName });
      if (!category) {
        category = await ExpenseCategory.create({ userId: req.user.id, name: categoryName });
      }
      budget.categoryId = category._id;
    }

    // Update other fields
    if (budgetedAmount !== undefined) budget.budgetedAmount = budgetedAmount;
    if (startDate !== undefined) budget.startDate = startDate;
    if (endDate !== undefined) budget.endDate = endDate;
    if (isFixed !== undefined) budget.isFixed = isFixed;

    await budget.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { budget }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error updating budget',
        details: error.message
      },
      data: null
    });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const deletedBudget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deletedBudget) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "Budget not found",
          details: `No budget found with ID ${req.params.id}`
        },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Budget deleted successfully" }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Error deleting budget",
        details: error.message
      },
      data: null
    });
  }
};
