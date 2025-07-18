const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  createExpenseCategory,
  getExpenseCategories,
  deleteExpenseCategory
} = require('../controllers/expenseCategory.controller');

router.route('/')
  .post(auth, createExpenseCategory)
  .get(auth, getExpenseCategories);

router.route('/:id')
  .delete(auth, deleteExpenseCategory);

module.exports = router;
