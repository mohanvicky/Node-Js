const Investment = require('../models/Investment');

exports.createInvestment = async (req, res) => {
  try {
    const { type, investmentName, amountInvested, currentValue, startDate, roi, durationMonths } = req.body;

    const investment = new Investment({
      userId: req.user.id,
      type,
      investmentName,
      amountInvested,
      currentValue,
      startDate,
      roi,
      durationMonths
    });

    const saved = await investment.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { investment: saved }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Error creating investment', details: error.message },
      data: null
    });
  }
};

exports.getAllInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { investments }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Error fetching investments', details: error.message },
      data: null
    });
  }
};

exports.getInvestmentById = async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.id });

    if (!investment) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Investment not found' },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { investment }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Error fetching investment', details: error.message },
      data: null
    });
  }
};

exports.updateInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.id });

    if (!investment) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Investment not found' },
        data: null
      });
    }

    const updatableFields = ['type', 'investmentName', 'amountInvested', 'currentValue', 'startDate', 'roi', 'durationMonths'];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        investment[field] = req.body[field];
      }
    });

    const updated = await investment.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { investment: updated }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Error updating investment', details: error.message },
      data: null
    });
  }
};

exports.deleteInvestment = async (req, res) => {
  try {
    const deleted = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Investment not found' },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Investment deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Error deleting investment', details: error.message },
      data: null
    });
  }
};

exports.calculateSIP = (req, res) => {
    try {
      const { monthlyAmount, durationMonths, roi } = req.body;
  
      if (!monthlyAmount || !durationMonths || !roi) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: 'monthlyAmount, durationMonths, and roi are required' },
          data: null
        });
      }
  
      const r = roi / 12 / 100; // Monthly rate
      const n = durationMonths;
      const P = monthlyAmount;
  
      const futureValue = P * ((Math.pow(1 + r, n) - 1) * (1 + r)) / r;
  
      res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          monthlyAmount: P,
          durationMonths: n,
          roi,
          futureValue: Math.round(futureValue)
        }
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        success: false,
        error: { message: 'Error calculating SIP', details: error.message },
        data: null
      });
    }
  };
  