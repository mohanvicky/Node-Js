const admin = require('../config/firebase.config');
const User = require('../models/User');

/**
 * Send notification to a single user
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 * @param {String} notification.title - Notification title
 * @param {String} notification.body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Result of notification send
 */
const sendNotificationToUser = async (userId, notification, data = {}) => {
  try {
    const user = await User.findById(userId).select('fcmToken fcmTokens name email');
    
    if (!user) {
      console.log(`User ${userId} not found`);
      return { success: false, error: 'User not found' };
    }

    // Collect all valid tokens
    const tokens = [];
    
    // Single token support (legacy)
    if (user.fcmToken) {
      tokens.push(user.fcmToken);
    }
    
    // Multiple tokens support
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      user.fcmTokens.forEach(tokenObj => {
        if (tokenObj.token) {
          tokens.push(tokenObj.token);
        }
      });
    }

    if (tokens.length === 0) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, error: 'No FCM token registered' };
    }

    // Prepare message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'task_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send to all tokens
    const results = await Promise.allSettled(
      tokens.map(token => 
        admin.messaging().send({ ...message, token })
      )
    );

    // Handle invalid tokens
    const invalidTokens = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
      await removeInvalidTokens(userId, invalidTokens);
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return {
      success: successCount > 0,
      successCount,
      totalTokens: tokens.length,
      invalidTokens: invalidTokens.length
    };

  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple users
 * @param {Array<String>} userIds - Array of user IDs
 * @param {Object} notification - Notification object
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} - Result summary
 */
const sendNotificationToMultipleUsers = async (userIds, notification, data = {}) => {
  try {
    const results = await Promise.allSettled(
      userIds.map(userId => sendNotificationToUser(userId, notification, data))
    );

    const summary = {
      total: userIds.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length
    };

    return summary;

  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove invalid FCM tokens from user document
 * @param {String} userId - User ID
 * @param {Array<String>} invalidTokens - Array of invalid tokens
 */
const removeInvalidTokens = async (userId, invalidTokens) => {
  try {
    await User.updateOne(
      { _id: userId },
      { 
        $pull: { 
          fcmTokens: { token: { $in: invalidTokens } } 
        },
        $unset: invalidTokens.includes(await User.findById(userId).select('fcmToken').fcmToken) 
          ? { fcmToken: "" } 
          : {}
      }
    );
    console.log(`Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
  } catch (error) {
    console.error('Error removing invalid tokens:', error);
  }
};

/**
 * Send task assignment notification
 * @param {String} assignedToUserId - User being assigned the task
 * @param {Object} taskDetails - Task details
 * @param {String} assignedByUsername - Username of person assigning
 */
const sendTaskAssignedNotification = async (assignedToUserId, taskDetails, assignedByUsername) => {
  const notification = {
    title: '📋 New Task Assigned',
    body: `${assignedByUsername} assigned you: "${taskDetails.title}"`
  };

  const data = {
    type: 'TASK_ASSIGNED',
    taskId: taskDetails.taskId.toString(),
    projectId: taskDetails.projectId.toString(),
    taskTitle: taskDetails.title,
    priority: taskDetails.priority || 'Medium',
    dueDate: taskDetails.dueDate || ''
  };

  return await sendNotificationToUser(assignedToUserId, notification, data);
};

/**
 * Send task updated notification
 * @param {String} assignedToUserId - User assigned to the task
 * @param {Object} taskDetails - Updated task details
 * @param {String} updatedByUsername - Username of person updating
 * @param {String} updateType - Type of update (e.g., 'priority', 'dueDate', 'status')
 */
const sendTaskUpdatedNotification = async (assignedToUserId, taskDetails, updatedByUsername, updateType = 'general') => {
  let bodyMessage = `${updatedByUsername} updated task: "${taskDetails.title}"`;
  
  // Customize message based on update type
  if (updateType === 'priority') {
    bodyMessage = `${updatedByUsername} changed priority to ${taskDetails.priority} for: "${taskDetails.title}"`;
  } else if (updateType === 'dueDate') {
    bodyMessage = `${updatedByUsername} updated due date for: "${taskDetails.title}"`;
  } else if (updateType === 'status') {
    bodyMessage = `${updatedByUsername} moved task "${taskDetails.title}" to ${taskDetails.columnName}`;
  }

  const notification = {
    title: '🔔 Task Updated',
    body: bodyMessage
  };

  const data = {
    type: 'TASK_UPDATED',
    taskId: taskDetails.taskId.toString(),
    projectId: taskDetails.projectId.toString(),
    taskTitle: taskDetails.title,
    updateType,
    priority: taskDetails.priority || 'Medium',
    columnName: taskDetails.columnName || ''
  };

  return await sendNotificationToUser(assignedToUserId, notification, data);
};

/**
 * Send task due soon notification
 * @param {String} userId - User ID
 * @param {Object} taskDetails - Task details
 * @param {Number} hoursRemaining - Hours until due
 */
const sendTaskDueSoonNotification = async (userId, taskDetails, hoursRemaining) => {
  const notification = {
    title: '⏰ Task Due Soon',
    body: `"${taskDetails.title}" is due in ${hoursRemaining} hours`
  };

  const data = {
    type: 'TASK_DUE_SOON',
    taskId: taskDetails.taskId.toString(),
    projectId: taskDetails.projectId.toString(),
    taskTitle: taskDetails.title,
    hoursRemaining: hoursRemaining.toString()
  };

  return await sendNotificationToUser(userId, notification, data);
};

/**
 * Send task completed notification to project owner
 * @param {String} ownerId - Project owner ID
 * @param {Object} taskDetails - Task details
 * @param {String} completedByUsername - Username who completed
 */
const sendTaskCompletedNotification = async (ownerId, taskDetails, completedByUsername) => {
  const notification = {
    title: '✅ Task Completed',
    body: `${completedByUsername} completed: "${taskDetails.title}"`
  };

  const data = {
    type: 'TASK_COMPLETED',
    taskId: taskDetails.taskId.toString(),
    projectId: taskDetails.projectId.toString(),
    taskTitle: taskDetails.title,
    completedBy: completedByUsername
  };

  return await sendNotificationToUser(ownerId, notification, data);
};

/**
 * Send task comment notification
 * @param {String} userId - User to notify
 * @param {Object} commentDetails - Comment details
 */
const sendTaskCommentNotification = async (userId, commentDetails) => {
  const notification = {
    title: '💬 New Comment',
    body: `${commentDetails.commenterName} commented on "${commentDetails.taskTitle}"`
  };

  const data = {
    type: 'TASK_COMMENT',
    taskId: commentDetails.taskId.toString(),
    projectId: commentDetails.projectId.toString(),
    commentId: commentDetails.commentId.toString(),
    taskTitle: commentDetails.taskTitle
  };

  return await sendNotificationToUser(userId, notification, data);
};

/**
 * Send project invitation notification
 * @param {String} userId - User being invited
 * @param {Object} projectDetails - Project details
 * @param {String} invitedByUsername - Username who invited
 */
const sendProjectInvitationNotification = async (userId, projectDetails, invitedByUsername) => {
  const notification = {
    title: '🎯 Project Invitation',
    body: `${invitedByUsername} invited you to join "${projectDetails.projectName}"`
  };

  const data = {
    type: 'PROJECT_INVITATION',
    projectId: projectDetails.projectId.toString(),
    projectName: projectDetails.projectName,
    invitedBy: invitedByUsername
  };

  return await sendNotificationToUser(userId, notification, data);
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendTaskAssignedNotification,
  sendTaskUpdatedNotification,
  sendTaskDueSoonNotification,
  sendTaskCompletedNotification,
  sendTaskCommentNotification,
  sendProjectInvitationNotification
};