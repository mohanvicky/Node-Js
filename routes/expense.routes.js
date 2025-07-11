// routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expenses.controller');

const auth = require('../middleware/auth');

router.route('/')
  .post(auth, createExpense)   // POST /api/expenses
  .get(auth, getExpenses);     // GET /api/expenses

router.route('/:id')
  .get(auth, getExpenseById)   // GET /api/expenses/:id
  .put(auth, updateExpense)    // PUT /api/expenses/:id
  .delete(auth, deleteExpense); // DELETE /api/expenses/:id

module.exports = router;
