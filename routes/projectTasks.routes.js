const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const {createTask, getAllTasks, getTaskById, updateTask, deleteTask, getTasksByProject, getTasksByColumn, getTasksAssignedToUser, moveTaskToColumn, removeTeamMember } = require('../controllers/projectTasks.controller');

// CRUD operations
router.post('/', auth, createTask);
router.get('/', auth, getAllTasks);
router.get('/:taskId', auth, getTaskById);
router.put('/:taskId', auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

// Additional routes for filtering
router.get('/project/:projectId', auth, getTasksByProject);
router.get('/project/:projectId/column/:columnId', auth, getTasksByColumn);
router.get('/assigned/:userId', auth, getTasksAssignedToUser);
router.put('/:taskId/move/:columnId', auth, moveTaskToColumn);
router.delete('/:projectId/team/:userId', auth, removeTeamMember);

module.exports = router;