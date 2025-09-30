import express from 'express';
import { body, validationResult } from 'express-validator';
import StudySession from '../models/StudySession.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/study-sessions
// @desc    Get study sessions for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sessions;

    if (startDate && endDate) {
      sessions = await StudySession.findByUserAndDateRange(
        req.user._id, 
        new Date(startDate), 
        new Date(endDate)
      ).populate('task', 'title dueDate');
    } else {
      sessions = await StudySession.findByUser(req.user._id).populate('task', 'title dueDate');
    }

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });

  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting study sessions'
    });
  }
});

// @route   POST /api/study-sessions
// @desc    Start a new study session
// @access  Private
router.post('/', [
  authMiddleware,
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('startTime').isISO8601().toDate().withMessage('Valid start time is required')
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

    const session = new StudySession({
      ...req.body,
      user: req.user._id
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Study session started successfully',
      data: { session }
    });

  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting study session'
    });
  }
});

// @route   PUT /api/study-sessions/:id/end
// @desc    End a study session
// @access  Private
router.put('/:id/end', [
  authMiddleware,
  body('endTime').isISO8601().toDate().withMessage('Valid end time is required'),
  body('productivity').optional().isInt({ min: 1, max: 5 }).withMessage('Productivity must be between 1-5')
], async (req, res) => {
  try {
    const session = await StudySession.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    session.endTime = req.body.endTime;
    session.status = 'Completed';
    if (req.body.productivity) session.productivity = req.body.productivity;
    if (req.body.notes) session.notes = req.body.notes;

    await session.save();

    res.json({
      success: true,
      message: 'Study session ended successfully',
      data: { session }
    });

  } catch (error) {
    console.error('End study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending study session'
    });
  }
});

// @route   GET /api/study-sessions/stats/weekly
// @desc    Get weekly study session statistics
// @access  Private
router.get('/stats/weekly', authMiddleware, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const stats = await StudySession.getWeeklyStats(req.user._id, startDate, endDate);

    res.json({
      success: true,
      data: {
        stats,
        period: {
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting weekly stats'
    });
  }
});

export default router;