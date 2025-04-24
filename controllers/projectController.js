const Project = require('../models/Projects');
const mongoose = require('mongoose');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      ownerId, 
      teamMembers, 
      status, 
      startDate, 
      endDate, 
      completionPercentage, 
      kanbanColumns 
    } = req.body;

    // In the createProject function, before saving the new project:
    if (teamMembers && Array.isArray(teamMembers)) {
      // Set owner's invitation status to 'accepted' automatically
      teamMembers.forEach(member => {
        if (member.userId.toString() === ownerId.toString()) {
          member.invitationStatus = 'accepted';
        }
      });
    }

    const newProject = new Project({
      name,
      description,
      ownerId,
      teamMembers,
      status,
      startDate,
      endDate,
      completionPercentage,
      kanbanColumns
    });

    const savedProject = await newProject.save();

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { project: savedProject }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error creating project", 
        details: error.message 
      },
      data: null
    });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const { status, ownerId } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (ownerId) filter.ownerId = ownerId;

    const projects = await Project.find(filter)
      .populate('ownerId', 'name email')
      .populate('teamMembers.userId', 'name email');

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { projects }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error fetching projects", 
        details: error.message 
      },
      data: null
    });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid project ID" },
        data: null
      });
    }

    const project = await Project.findById(id)
      .populate('ownerId', 'username email')
      .populate('teamMembers.userId', 'username email')
      .populate('kanbanColumns.taskIds', 'title estimates'); 

    if (!project) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Project not found" },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { project }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error fetching project", 
        details: error.message 
      },
      data: null
    });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid project ID" },
        data: null
      });
    }

    const updateData = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Project not found" },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { project: updatedProject }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error updating project", 
        details: error.message 
      },
      data: null
    });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid project ID" },
        data: null
      });
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Project not found" },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { 
        message: "Project deleted successfully",
        project: deletedProject 
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error deleting project", 
        details: error.message 
      },
      data: null
    });
  }
};

// Advanced Project Filtering
exports.filterProjects = async (req, res) => {
  try {
    // Destructure potential filter parameters
    const { 
      // Basic Filters
      name,
      status,
      ownerId,
      
      // Team Member Filters
      teamMemberRole,
      teamMemberId,
      
      // Date Filters
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      
      // Completion Filters
      minCompletionPercentage,
      maxCompletionPercentage,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build the filter object
    const filter = {};

    // Name filter (case-insensitive partial match)
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Owner filter
    if (ownerId) {
      filter.ownerId = mongoose.Types.ObjectId.createFromHexString(ownerId);
    }

    // Team Member Filters
    if (teamMemberRole || teamMemberId) {
      // Using dot notation for the array field
      if (teamMemberRole) {
        filter['teamMembers.role'] = teamMemberRole;
      }
      
      if (teamMemberId) {
        filter['teamMembers.userId'] = mongoose.Types.ObjectId.createFromHexString(teamMemberId);
      }
    }

    // Date Filters
    const dateFilter = {};
    if (startDateFrom) dateFilter.$gte = new Date(startDateFrom);
    if (startDateTo) dateFilter.$lte = new Date(startDateTo);
    if (Object.keys(dateFilter).length > 0) {
      filter.startDate = dateFilter;
    }

    // End Date Filters
    const endDateFilter = {};
    if (endDateFrom) endDateFilter.$gte = new Date(endDateFrom);
    if (endDateTo) endDateFilter.$lte = new Date(endDateTo);
    if (Object.keys(endDateFilter).length > 0) {
      filter.endDate = endDateFilter;
    }

    // Completion Percentage Filters
    const completionFilter = {};
    if (minCompletionPercentage) {
      completionFilter.$gte = parseFloat(minCompletionPercentage);
    }
    if (maxCompletionPercentage) {
      completionFilter.$lte = parseFloat(maxCompletionPercentage);
    }
    if (Object.keys(completionFilter).length > 0) {
      filter.completionPercentage = completionFilter;
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Perform the query
    const projects = await Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('ownerId', 'name email')
      .populate('teamMembers.userId', 'name email');

    // Count total matching documents for pagination
    const totalProjects = await Project.countDocuments(filter);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        projects,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalProjects / limitNum),
          totalProjects,
          pageSize: limitNum
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error filtering projects", 
        details: error.message 
      },
      data: null
    });
  }
};

// Update team member invitation status (accept or reject)
exports.updateInvitationStatus = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id; // Assuming auth middleware adds user to req
    console.log(userId);
    

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid project ID" },
        data: null
      });
    }

    // Validate status
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid invitation status. Must be 'accepted' or 'declined'" },
        data: null
      });
    }

    // Find project and update the specific team member's invitation status
    const project = await Project.findOneAndUpdate(
      { 
        _id: projectId, 
        'teamMembers.userId': userId 
      },
      { 
        $set: { 'teamMembers.$.invitationStatus': status } 
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "Project not found or you are not invited to this project" },
        data: null
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { 
        message: `Invitation ${status} successfully`,
        project
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { 
        message: "Error updating invitation status", 
        details: error.message 
      },
      data: null
    });
  }
};