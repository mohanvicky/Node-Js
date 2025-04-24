const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth"); // Middleware for authentication
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  filterProjects,
  updateInvitationStatus
} = require('../controllers/projectController');

// Create a new project
router.post('/',auth, createProject);

// Get all projects (with optional filtering)
router.get('/',auth, getAllProjects);

// Advanced project filtering
router.get('/filter',auth, filterProjects);

// Get a single project by ID
router.get('/:id',auth, getProjectById);

// Update a project
router.put('/:id',auth, updateProject);

// Delete a project
router.delete('/:id',auth, deleteProject);

// Accept or reject project invitation
router.put('/:id/accept-invitation',auth, updateInvitationStatus);

module.exports = router;