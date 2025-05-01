const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habit.controller');
const auth = require('../middleware/auth');

// Apply authentication middleware to all habit routes
router.use(auth);

// Core habit routes
router.post('/', habitController.createHabit);
router.get('/', habitController.getAllHabits);
router.get('/:id', habitController.getHabitById);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

// Completion tracking
router.post('/:id/complete', habitController.markHabitComplete);
router.delete('/:id/complete/:date', habitController.unmarkHabitComplete);

// Advanced features
router.post('/:id/pause', habitController.pauseHabit);
router.post('/:id/resume', habitController.resumeHabit);
router.post('/:id/count', habitController.updateHabitCount);

module.exports = router;