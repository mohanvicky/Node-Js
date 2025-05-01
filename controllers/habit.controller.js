const Habit = require('../models/Habit');
const { startOfDay, endOfDay, isAfter, isBefore, format } = require('date-fns');

/**
 * Create a new habit
 * @route POST /api/habits
 * @access Private
 */
exports.createHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, timeOfDay, goal, duration } = req.body;
    
    // Validate required fields
    if (!title || !frequency || !frequency.type) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { 
          message: "Validation error", 
          details: "Title and frequency are required" 
        },
        data: null
      });
    }
    
    // Set default frequency if not provided
    if (!frequency.daysOfWeek && !frequency.daysOfMonth) {
      if (frequency.type === 'daily') {
        frequency.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // Every day
      } else if (frequency.type === 'weekly') {
        frequency.daysOfWeek = [1]; // Monday by default
      }
    }
    
    // Create new habit
    const newHabit = new Habit({
      userId: req.user.id,
      title,
      description,
      category: category || 'General',
      frequency,
      timeOfDay: timeOfDay || [new Date()],
      startDate: new Date(),
      duration: duration || 0,
      goal: goal || {
        type: 'streak',
        target: 21, // Default 21-day habit formation
        current: 0
      }
    });
    
    const habit = await newHabit.save();
    
    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error creating habit", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Get all habits for the current user
 * @route GET /api/habits
 * @access Private
 */
exports.getAllHabits = async (req, res) => {
  try {
    const { category, status, sortBy } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Determine sort order
    let sort = {};
    if (sortBy === 'streak') {
      sort = { 'streakData.currentStreak': -1 };
    } else if (sortBy === 'created') {
      sort = { createdAt: -1 };
    } else {
      sort = { title: 1 }; // Default sort by title
    }
    
    const habits = await Habit.find(query).sort(sort);
    
    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habits }
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error fetching habits", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Get habit by ID
 * @route GET /api/habits/:id
 * @access Private
 */
exports.getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to access this habit" 
        },
        data: null
      });
    }
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error fetching habit:', error);
    
    // Handle invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { 
          message: "Bad request", 
          details: "Invalid habit ID" 
        },
        data: null
      });
    }
    
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error fetching habit", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Update habit
 * @route PUT /api/habits/:id
 * @access Private
 */
exports.updateHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, timeOfDay, goal, duration, endDate } = req.body;
    
    // Find habit by ID
    let habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    // Build habit update object
    const habitFields = {};
    if (title) habitFields.title = title;
    if (description !== undefined) habitFields.description = description;
    if (category) habitFields.category = category;
    if (frequency) habitFields.frequency = frequency;
    if (timeOfDay) habitFields.timeOfDay = timeOfDay;
    if (goal) habitFields.goal = goal;
    if (duration !== undefined) habitFields.duration = duration;
    if (endDate) habitFields.endDate = endDate;
    
    // Update habit
    habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { $set: habitFields },
      { new: true }
    );
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error updating habit", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Delete habit
 * @route DELETE /api/habits/:id
 * @access Private
 */
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to delete this habit" 
        },
        data: null
      });
    }
    
    await habit.remove();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Habit removed successfully" }
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error deleting habit", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Mark habit as complete for current day
 * @route POST /api/habits/:id/complete
 * @access Private
 */
exports.markHabitComplete = async (req, res) => {
  try {
    const { date, notes, count } = req.body;
    const completionDate = date ? new Date(date) : new Date();
    const todayStart = startOfDay(completionDate);
    const todayEnd = endOfDay(completionDate);
    
    // Find habit by ID
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    // Check if habit is already completed for today
    const todayLog = habit.logs.find(log => 
      log.date >= todayStart && log.date <= todayEnd && log.completed
    );
    
    // If count-based habit
    if (habit.goal.type === 'total_count') {
      // Update count if provided
      const countValue = count || 1;
      
      if (todayLog) {
        // Increment existing count
        habit.goal.current += countValue;
        await habit.save();
        return res.json({
          statusCode: 200,
          success: true,
          error: null,
          data: { 
            message: "Habit count updated", 
            habit 
          }
        });
      } else {
        // Create new log and update count
        habit.logs.push({
          date: completionDate,
          completed: true,
          notes: notes || ''
        });
        habit.goal.current += countValue;
      }
    } else {
      // For regular habits, prevent duplicate completion
      if (todayLog) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { 
            message: "Bad request", 
            details: "Habit already completed for today" 
          },
          data: null
        });
      }
      
      // Add completion log
      habit.logs.push({
        date: completionDate,
        completed: true,
        notes: notes || ''
      });
    }
    
    // Update streak data
    const logDates = habit.logs
      .filter(log => log.completed)
      .map(log => log.date)
      .sort((a, b) => a - b);
    
    if (logDates.length > 0) {
      // Update last completed date
      habit.streakData.lastCompletedDate = logDates[logDates.length - 1];
      
      // Calculate streak based on frequency type
      let currentStreak = 1;
      const yesterday = new Date(completionDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Simple streak calculation (can be enhanced based on frequency)
      if (habit.frequency.type === 'daily') {
        // For daily habits, check if yesterday was completed
        const yesterdayCompleted = habit.logs.some(log => 
          log.date >= startOfDay(yesterday) && 
          log.date <= endOfDay(yesterday) && 
          log.completed
        );
        
        if (yesterdayCompleted) {
          currentStreak = habit.streakData.currentStreak + 1;
        } else {
          currentStreak = 1; // Reset streak
        }
      } else if (habit.frequency.type === 'weekly') {
        // For weekly habits, more complex streak calculation needed
        // This is a simplified version
        const lastWeekDate = new Date(completionDate);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        
        const lastWeekCompleted = habit.logs.some(log => 
          log.date >= startOfDay(lastWeekDate) && 
          log.date <= endOfDay(new Date(lastWeekDate.getTime() + 24 * 60 * 60 * 1000)) && 
          log.completed
        );
        
        if (lastWeekCompleted) {
          currentStreak = habit.streakData.currentStreak + 1;
        } else {
          currentStreak = 1; // Reset streak
        }
      }
      
      habit.streakData.currentStreak = currentStreak;
      
      // Update longest streak if needed
      if (currentStreak > habit.streakData.longestStreak) {
        habit.streakData.longestStreak = currentStreak;
      }
    }
    
    await habit.save();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error marking habit complete:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error marking habit complete", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Unmark habit as complete for a date
 * @route DELETE /api/habits/:id/complete/:date
 * @access Private
 */
exports.unmarkHabitComplete = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    const dateToRemove = new Date(req.params.date);
    const dayStart = startOfDay(dateToRemove);
    const dayEnd = endOfDay(dateToRemove);
    
    // Find log index to remove
    const logIndex = habit.logs.findIndex(
      log => log.date >= dayStart && log.date <= dayEnd
    );
    
    if (logIndex === -1) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "No completion log found for this date" 
        },
        data: null
      });
    }
    
    // Remove log
    habit.logs.splice(logIndex, 1);
    
    // Recalculate streak data
    // Note: This is simplified and would need more complex logic for a real app
    if (habit.streakData.lastCompletedDate >= dayStart && 
        habit.streakData.lastCompletedDate <= dayEnd) {
      // Reset last completed date
      const newLastCompleted = habit.logs
        .filter(log => log.completed)
        .map(log => log.date)
        .sort((a, b) => b - a)[0];
      
      habit.streakData.lastCompletedDate = newLastCompleted || null;
      
      // Reset current streak
      habit.streakData.currentStreak = 0;
      
      // Recalculate current streak (simplified)
      if (newLastCompleted) {
        habit.streakData.currentStreak = 1;
      }
    }
    
    await habit.save();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error unmarking habit complete:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error unmarking habit complete", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Update habit count (for count-based habits)
 * @route POST /api/habits/:id/count
 * @access Private
 */
exports.updateHabitCount = async (req, res) => {
  try {
    const { count, date } = req.body;
    
    if (!count || isNaN(count)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { 
          message: "Validation error", 
          details: "Valid count value is required" 
        },
        data: null
      });
    }
    
    const completionDate = date ? new Date(date) : new Date();
    
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    // Check if habit is count-based
    if (habit.goal.type !== 'total_count') {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { 
          message: "Bad request", 
          details: "This is not a count-based habit" 
        },
        data: null
      });
    }
    
    // Update count
    habit.goal.current = (habit.goal.current || 0) + parseInt(count);
    
    // Add log entry
    const todayStart = startOfDay(completionDate);
    const todayEnd = endOfDay(completionDate);
    
    // Check if log exists for today
    const todayLogIndex = habit.logs.findIndex(log => 
      log.date >= todayStart && log.date <= todayEnd
    );
    
    if (todayLogIndex >= 0) {
      // Update existing log
      habit.logs[todayLogIndex].completed = true;
      habit.logs[todayLogIndex].notes = `Updated count: ${count}`;
    } else {
      // Create new log
      habit.logs.push({
        date: completionDate,
        completed: true,
        notes: `Count: ${count}`
      });
    }
    
    await habit.save();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error updating habit count:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error updating habit count", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Pause habit (temporarily disable without losing streak)
 * @route POST /api/habits/:id/pause
 * @access Private
 */
exports.pauseHabit = async (req, res) => {
  try {
    const { until, reason } = req.body;
    
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    // Store current state before pausing
    const pauseData = {
      pausedAt: new Date(),
      pausedUntil: until ? new Date(until) : null,
      pauseReason: reason || 'Paused by user',
      streakBeforePause: habit.streakData.currentStreak
    };
    
    // Update habit with pause data
    habit.status = 'On Hold';
    habit.pauseData = pauseData;
    
    await habit.save();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error pausing habit:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error pausing habit", 
        details: error.message 
      },
      data: null
    });
  }
};

/**
 * Resume paused habit
 * @route POST /api/habits/:id/resume
 * @access Private
 */
exports.resumeHabit = async (req, res) => {
  try {
    const { keepStreak } = req.body;
    
    const habit = await Habit.findById(req.params.id);
    
    // Check if habit exists
    if (!habit) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { 
          message: "Not found", 
          details: "Habit not found" 
        },
        data: null
      });
    }
    
    // Check if user owns the habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: { 
          message: "Forbidden", 
          details: "Not authorized to update this habit" 
        },
        data: null
      });
    }
    
    // Check if habit is paused
    if (!habit.pauseData) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { 
          message: "Bad request", 
          details: "Habit is not paused" 
        },
        data: null
      });
    }
    
    // Restore streak if requested
    if (keepStreak && habit.pauseData.streakBeforePause) {
      habit.streakData.currentStreak = habit.pauseData.streakBeforePause;
    }
    
    // Resume habit
    habit.status = 'Active';
    habit.pauseData = null;
    
    await habit.save();
    
    res.json({
      statusCode: 200,
      success: true,
      error: null,
      data: { habit }
    });
  } catch (error) {
    console.error('Error resuming habit:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error resuming habit", 
        details: error.message 
      },
      data: null
    });
  }
};