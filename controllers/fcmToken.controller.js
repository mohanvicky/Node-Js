const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Register or update FCM token for a user
 */
exports.registerFCMToken = async (req, res) => {
  try {
    const { fcmToken, device } = req.body; // device: 'android' or 'ios'
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'FCM token is required' },
        data: null
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'User not found' },
        data: null
      });
    }

    // Check if token already exists
    const existingTokenIndex = user.fcmTokens?.findIndex(
      t => t.token === fcmToken
    );

    if (existingTokenIndex !== -1) {
      // Update existing token timestamp
      user.fcmTokens[existingTokenIndex].lastUpdated = new Date();
      user.fcmTokens[existingTokenIndex].device = device || user.fcmTokens[existingTokenIndex].device;
    } else {
      // Add new token
      if (!user.fcmTokens) {
        user.fcmTokens = [];
      }
      
      user.fcmTokens.push({
        token: fcmToken,
        device: device || 'unknown',
        lastUpdated: new Date()
      });

      // Also set single fcmToken for backward compatibility
      user.fcmToken = fcmToken;
    }

    await user.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { 
        message: 'FCM token registered successfully',
        tokenCount: user.fcmTokens.length
      }
    });

  } catch (error) {
    console.error('Error registering FCM token:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};

/**
 * Remove FCM token (e.g., on logout)
 */
exports.removeFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'FCM token is required' },
        data: null
      });
    }

    await User.updateOne(
      { _id: userId },
      { 
        $pull: { fcmTokens: { token: fcmToken } },
        $unset: { fcmToken: "" }
      }
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'FCM token removed successfully' }
    });

  } catch (error) {
    console.error('Error removing FCM token:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};

/**
 * Get all registered FCM tokens for current user
 */
exports.getUserFCMTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('fcmTokens');
    
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'User not found' },
        data: null
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { 
        tokens: user.fcmTokens || [],
        count: user.fcmTokens?.length || 0
      }
    });

  } catch (error) {
    console.error('Error getting FCM tokens:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};