const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {getFinancialOverview} = require('../controllers/financialOverview.controller');

router.route('/')
    .get(auth, getFinancialOverview);

module.exports = router;