const EMI = require('../models/EMI');

exports.createEMI = async (req, res) => {
  try {
    const { loanName, principal, roi, tenureMonths, dueDate, isPreclosed } = req.body;

    const emi = new EMI({
      userId: req.user.id,
      loanName,
      principal,
      roi,
      tenureMonths,
      dueDate,
      isPreclosed: isPreclosed || false
    });

    const saved = await emi.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { emi: saved }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error creating EMI',
        details: error.message
      },
      data: null
    });
  }
};

exports.getAllEMIs = async (req, res) => {
  try {
    const { isPreclosed, dueBefore, dueAfter } = req.query;

    const query = { userId: req.user.id };

    if (isPreclosed !== undefined) {
      query.isPreclosed = isPreclosed === 'true';
    }

    if (dueBefore || dueAfter) {
      query.dueDate = {};
      if (dueBefore) query.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) query.dueDate.$gte = new Date(dueAfter);
    }

    const emis = await EMI.find(query).sort({ dueDate: 1 });

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { emis }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error fetching EMIs',
        details: error.message
      },
      data: null
    });
  }
};

exports.getEMIById = async (req, res) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, userId: req.user.id });

    if (!emi) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: 'EMI not found',
          details: `No EMI found with ID ${req.params.id}`
        },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { emi }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error fetching EMI',
        details: error.message
      },
      data: null
    });
  }
};

exports.updateEMI = async (req, res) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, userId: req.user.id });

    if (!emi) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: 'EMI not found',
          details: `No EMI found with ID ${req.params.id}`
        },
        data: null
      });
    }

    // Update fields
    const updatableFields = ['loanName', 'principal', 'roi', 'tenureMonths', 'dueDate', 'isPreclosed'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) emi[field] = req.body[field];
    });

    const updated = await emi.save(); // emiAmount recalculated here

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { emi: updated }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error updating EMI',
        details: error.message
      },
      data: null
    });
  }
};

exports.deleteEMI = async (req, res) => {
  try {
    const emi = await EMI.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!emi) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: 'EMI not found',
          details: `No EMI found with ID ${req.params.id}`
        },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'EMI deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: 'Error deleting EMI',
        details: error.message
      },
      data: null
    });
  }
};
