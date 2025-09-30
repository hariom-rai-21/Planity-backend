import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Timetable from '../models/Timetable.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetable for the authenticated user
// @access  Private
router.get('/', [
  authMiddleware,
  query('dayOfWeek').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { dayOfWeek } = req.query;

    let timetable;
    if (dayOfWeek) {
      timetable = await Timetable.findByUserAndDay(req.user._id, dayOfWeek);
    } else {
      timetable = await Timetable.findByUser(req.user._id);
    }

    res.json({
      success: true,
      data: {
        timetable,
        count: timetable.length
      }
    });

  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting timetable'
    });
  }
});

// @route   GET /api/timetable/:id
// @desc    Get a specific timetable entry by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await Timetable.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    res.json({
      success: true,
      data: { entry }
    });

  } catch (error) {
    console.error('Get timetable entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting timetable entry'
    });
  }
});

// @route   POST /api/timetable
// @desc    Create a new timetable entry
// @access  Private
router.post('/', [
  authMiddleware,
  body('subject')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject is required and must be less than 50 characters'),
  
  body('dayOfWeek')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Valid day of week is required'),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('teacher')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Teacher name must be less than 50 characters'),
  
  body('room')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room must be less than 20 characters'),
  
  body('type')
    .optional()
    .isIn(['Lecture', 'Lab', 'Tutorial', 'Study Session', 'Break'])
    .withMessage('Type must be Lecture, Lab, Tutorial, Study Session, or Break'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color')
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

    const entryData = {
      ...req.body,
      user: req.user._id
    };

    const entry = new Timetable(entryData);
    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: { entry }
    });

  } catch (error) {
    console.error('Create timetable entry error:', error);
    if (error.message.includes('End time must be after start time')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error creating timetable entry'
    });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update a timetable entry
// @access  Private
router.put('/:id', [
  authMiddleware,
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject must be less than 50 characters'),
  
  body('dayOfWeek')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Valid day of week is required'),
  
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('teacher')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Teacher name must be less than 50 characters'),
  
  body('room')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room must be less than 20 characters'),
  
  body('type')
    .optional()
    .isIn(['Lecture', 'Lab', 'Tutorial', 'Study Session', 'Break'])
    .withMessage('Type must be Lecture, Lab, Tutorial, Study Session, or Break'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color')
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

    const entry = await Timetable.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        entry[key] = req.body[key];
      }
    });

    await entry.save();

    res.json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: { entry }
    });

  } catch (error) {
    console.error('Update timetable entry error:', error);
    if (error.message.includes('End time must be after start time')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating timetable entry'
    });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Delete a timetable entry
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await Timetable.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete timetable entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting timetable entry'
    });
  }
});

// @route   GET /api/timetable/week/current
// @desc    Get current week's timetable
// @access  Private
router.get('/week/current', authMiddleware, async (req, res) => {
  try {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekTimetable = {};

    for (const day of daysOfWeek) {
      const dayEntries = await Timetable.findByUserAndDay(req.user._id, day);
      weekTimetable[day] = dayEntries;
    }

    res.json({
      success: true,
      data: {
        weekTimetable
      }
    });

  } catch (error) {
    console.error('Get week timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting week timetable'
    });
  }
});

export default router;