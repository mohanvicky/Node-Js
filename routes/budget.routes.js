const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
} = require('../controllers/budget.controller');

router.route('/')
  .post(auth, createBudget)
  .get(auth, getBudgets);

router.route('/:id')
  .get(auth, getBudgetById)
  .put(auth, updateBudget)
  .delete(auth, deleteBudget);

module.exports = router;
