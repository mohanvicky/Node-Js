const ProjectTask = require('../models/ProjectTasks');
const Project = require('../models/Projects');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// 🛠 Helper function: Check if user has access to project
const checkProjectAccess = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  
  if (!project) return false;
  if (project.ownerId.toString() === userId.toString()) return true;
  
  return project.teamMembers.some(member => 
    member.userId.toString() === userId.toString()
  );
};

// ✅ **Create Task**
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, projectId, columnId, 
            estimates, dueDate, priority } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Project not found" },
        data: null
      });
    }

    const column = project.kanbanColumns.find(col => 
      col._id.toString() === columnId
    );
    if (!column) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Column not found in project" },
        data: null
      });
    }

    const newTask = new ProjectTask({
      title,
      description,
      createdBy: req.user.id,
      assignedTo: assignedTo || null,
      projectId,
      columnId,
      estimates: estimates || { estimated: 0, actual: 0 },
      dueDate: dueDate || null,
      priority: priority || 'Medium'
    });

    const savedTask = await newTask.save();

    await Project.updateOne(
      { _id: projectId, "kanbanColumns._id": columnId },
      { $push: { "kanbanColumns.$.taskIds": savedTask._id } }
    );

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { task: savedTask }
    });

  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// ✅ **Get All Tasks (with pagination)**
exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const tasks = await ProjectTask.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const count = await ProjectTask.countDocuments();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        tasks,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error("Error getting tasks:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// ✅ **Get Task by ID**
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid task ID" },
        data: null
      });
    }

    const task = await ProjectTask.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name');

    if (!task) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Task not found" },
        data: null
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { task }
    });

  } catch (error) {
    console.error("Error getting task:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// ✅ **Update Task**
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid task ID" },
        data: null
      });
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Task not found" },
        data: null
      });
    }

    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { task: updatedTask }
    });

  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// ✅ **Delete Task**
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid task ID" },
        data: null
      });
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Task not found" },
        data: null
      });
    }

    await Project.updateOne(
      { _id: task.projectId, "kanbanColumns._id": task.columnId },
      { $pull: { "kanbanColumns.$.taskIds": task._id } }
    );

    await ProjectTask.findByIdAndDelete(taskId);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Task deleted successfully" }
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Server error", details: error.message },
      data: null
    });
  }
};

// ✅ Get tasks by project (with filtering)
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50, priority, dueDate, assignedTo } = req.query;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid project ID' },
        data: null
      });
    }

    const filter = { projectId };

    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (dueDate) {
      const today = new Date();
      if (dueDate === 'overdue') {
        filter.dueDate = { $lt: today };
      } else if (dueDate === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.dueDate = { 
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(tomorrow.setHours(0, 0, 0, 0))
        };
      } else if (dueDate === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        filter.dueDate = { $gte: today, $lt: nextWeek };
      } else if (Date.parse(dueDate)) {
        const specificDate = new Date(dueDate);
        const nextDay = new Date(specificDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.dueDate = { $gte: specificDate, $lt: nextDay };
      }
    }

    const tasks = await ProjectTask.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ priority: 1, dueDate: 1 });

    const count = await ProjectTask.countDocuments(filter);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        tasks,
        totalTasks: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error('Error getting project tasks:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};

// ✅ Get tasks by column
exports.getTasksByColumn = async (req, res) => {
  try {
    const { projectId, columnId } = req.params;

    if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(columnId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid project or column ID' },
        data: null
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Project not found' },
        data: null
      });
    }

    const column = project.kanbanColumns.find(col => col._id.toString() === columnId);
    if (!column) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Column not found in project' },
        data: null
      });
    }

    const tasks = await ProjectTask.find({ projectId, columnId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        columnName: column.name,
        tasks
      }
    });

  } catch (error) {
    console.error('Error getting column tasks:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};

// ✅ Get tasks assigned to a user
exports.getTasksAssignedToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid user ID' },
        data: null
      });
    }

    const userProjects = await Project.find({
      $or: [{ ownerId: userId }, { 'teamMembers.userId': userId }]
    }).select('_id');

    const projectIds = userProjects.map(project => project._id);

    const tasks = await ProjectTask.find({ assignedTo: userId, projectId: { $in: projectIds } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('projectId', 'name')
      .sort({ dueDate: 1, priority: 1 });

    const count = await ProjectTask.countDocuments({ assignedTo: userId, projectId: { $in: projectIds } });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        tasks,
        totalTasks: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error('Error getting assigned tasks:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};

// ✅ Move task to a different column
exports.moveTaskToColumn = async (req, res) => {
  try {
    const { taskId, columnId } = req.params;

    if (!mongoose.isValidObjectId(taskId) || !mongoose.isValidObjectId(columnId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid task or column ID' },
        data: null
      });
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Task not found' },
        data: null
      });
    }

    const project = await Project.findById(task.projectId);
    const newColumn = project.kanbanColumns.find(col => col._id.toString() === columnId);

    if (!newColumn) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Column not found in project' },
        data: null
      });
    }

    if (task.columnId.toString() === columnId) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: { message: 'Task already in this column', task }
      });
    }

    await Project.updateOne(
      { _id: task.projectId, "kanbanColumns._id": task.columnId },
      { $pull: { "kanbanColumns.$.taskIds": task._id } }
    );

    await Project.updateOne(
      { _id: task.projectId, "kanbanColumns._id": columnId },
      { $push: { "kanbanColumns.$.taskIds": task._id } }
    );

    task.columnId = columnId;
    await task.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Task moved successfully', task, newColumnName: newColumn.name }
    });

  } catch (error) {
    console.error('Error moving task:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error', details: error.message },
      data: null
    });
  }
};
