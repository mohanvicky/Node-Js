const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const auth = require('../middleware/auth');

router.post('/', auth, investmentController.createInvestment);
router.get('/', auth, investmentController.getAllInvestments);
router.get('/:id', auth, investmentController.getInvestmentById);
router.put('/:id', auth, investmentController.updateInvestment);
router.delete('/:id', auth, investmentController.deleteInvestment);
router.post('/sip-calculate', auth, investmentController.calculateSIP);

module.exports = router;
