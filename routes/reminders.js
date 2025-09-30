import express from 'express';
import { body, validationResult } from 'express-validator';
import Reminder from '../models/Reminder.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reminders
// @desc    Get reminders for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reminders = await Reminder.findActiveByUser(req.user._id).populate('task', 'title dueDate');

    res.json({
      success: true,
      data: {
        reminders,
        count: reminders.length
      }
    });

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting reminders'
    });
  }
});

// @route   GET /api/reminders/upcoming
// @desc    Get upcoming reminders (next 24 hours)
// @access  Private
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const hours = req.query.hours || 24;
    const reminders = await Reminder.findUpcomingByUser(req.user._id, hours).populate('task', 'title dueDate');

    res.json({
      success: true,
      data: {
        reminders,
        count: reminders.length,
        timeframe: `${hours} hours`
      }
    });

  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting upcoming reminders'
    });
  }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private
router.post('/', [
  authMiddleware,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 300 }).withMessage('Description must be less than 300 characters'),
  body('reminderDate').isISO8601().toDate().withMessage('Valid reminder date is required'),
  body('type').optional().isIn(['Assignment', 'Exam', 'Meeting', 'Study Session', 'Break', 'Other']),
  body('priority').optional().isIn(['Low', 'Medium', 'High'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const reminder = new Reminder({
      ...req.body,
      user: req.user._id
    });

    await reminder.save();

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: { reminder }
    });

  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating reminder'
    });
  }
});

// @route   PUT /api/reminders/:id
// @desc    Update a reminder
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        reminder[key] = req.body[key];
      }
    });

    await reminder.save();

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: { reminder }
    });

  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating reminder'
    });
  }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete a reminder
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });

  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting reminder'
    });
  }
});

export default router;