const express = require("express");
const validateTask = require("../validations/task.validation");
const { getTasks, createTask, getTaskById, updateTask, deleteTask } = require("../controllers/task.controller");
const auth = require("../middleware/auth"); // Middleware for authentication
const router = express.Router();

router.get("/", auth, getTasks); // Get all tasks
router.post("/", auth,validateTask, createTask); // Create a task
router.get("/:id", auth, getTaskById); // Get a task by ID
router.put("/:id", auth, validateTask, updateTask); // Update a task
router.delete("/:id", auth, deleteTask); // Delete a task

module.exports = router;
