const Task = require("../models/Task");

// @desc Get all tasks (with filters for calendar view)
// @route GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;
    let query = {};

    // Apply filters if provided
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status) query.status = status;
    if (category) query.category = category;

    // Fetch tasks from the database
    const tasks = await Task.find(query);

    // Format tasks for calendar display
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.startDate,
      end: task.dueDate,
      allDay: !task.startDate,
      priority: task.priority,
      category: task.category,
      status: task.status,
    }));

    // Send response
    res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        totalTasks: tasks.length,
        tasks: formattedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, success: false, data: { message: "Error fetching tasks", error: error.message } });
  }
};

// @desc Create a new task
// @route POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    // Create a new task instance
    const task = new Task({ ...req.body, userId: req.user.id });
    await task.save();

    // Send response
    res.status(201).json({ statusCode: 201, success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ statusCode: 500, success: false, data: { message: "Error creating task", error: error.message } });
  }
};

// @desc Get a single task by ID
// @route GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ statusCode: 404, success: false, data: { message: "Task not found" } });
    }

    // Send response
    res.status(200).json({ statusCode: 200, success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ statusCode: 500, success: false, data: { message: "Error fetching task", error: error.message } });
  }
};

// @desc Update a task by ID
// @route PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    // Find and update task
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) {
      return res.status(404).json({ statusCode: 404, success: false, data: { message: "Task not found" } });
    }

    // Send response
    res.status(200).json({ statusCode: 200, success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ statusCode: 500, success: false, data: { message: "Error updating task", error: error.message } });
  }
};

// @desc Delete a task by ID
// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    // Find and delete task
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ statusCode: 404, success: false, data: { message: "Task not found" } });
    }

    // Send response
    res.status(200).json({ statusCode: 200, success: true, data: { message: "Task deleted successfully" } });
  } catch (error) {
    res.status(500).json({ statusCode: 500, success: false, data: { message: "Error deleting task", error: error.message } });
  }
};