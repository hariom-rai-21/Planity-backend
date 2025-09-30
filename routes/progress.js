import express from 'express';
import { body, validationResult } from 'express-validator';
import Progress from '../models/Progress.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/progress
// @desc    Get progress records for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
    let progress;

    if (startDate && endDate) {
      progress = await Progress.findByUserAndDateRange(
        req.user._id, 
        new Date(startDate), 
        new Date(endDate)
      );
    } else {
      progress = await Progress.findByUser(req.user._id);
    }

    if (subject) {
      progress = progress.filter(record => 
        record.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        progress,
        count: progress.length
      }
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting progress'
    });
  }
});

// @route   POST /api/progress
// @desc    Create a new progress record
// @access  Private
router.post('/', [
  authMiddleware,
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('studyTime').optional().isInt({ min: 0 }).withMessage('Study time must be non-negative'),
  body('tasksCompleted').optional().isInt({ min: 0 }).withMessage('Tasks completed must be non-negative'),
  body('productivity').optional().isInt({ min: 1, max: 5 }).withMessage('Productivity must be between 1-5')
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

    const progress = new Progress({
      ...req.body,
      user: req.user._id
    });

    await progress.save();

    res.status(201).json({
      success: true,
      message: 'Progress record created successfully',
      data: { progress }
    });

  } catch (error) {
    console.error('Create progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating progress'
    });
  }
});

// @route   GET /api/progress/stats/weekly
// @desc    Get weekly progress statistics
// @access  Private
router.get('/stats/weekly', authMiddleware, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const stats = await Progress.getWeeklyProgress(req.user._id, startDate, endDate);

    res.json({
      success: true,
      data: {
        stats,
        period: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting weekly progress'
    });
  }
});

export default router;