import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get('/', [
  authMiddleware,
  query('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Overdue']),
  query('subject').optional().isString().trim(),
  query('priority').optional().isIn(['Low', 'Medium', 'High'])
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

    const { status, subject, priority } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        tasks,
        count: tasks.length
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks for the authenticated user
// @access  Private
router.get('/overdue', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.findOverdueByUser(req.user._id);

    res.json({
      success: true,
      data: {
        tasks,
        count: tasks.length
      }
    });

  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting overdue tasks'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a specific task by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  authMiddleware,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('subject')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject is required and must be less than 50 characters'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid due date is required'),
  
  body('estimatedTime')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Estimated time must be between 1 and 600 minutes')
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

    const taskData = {
      ...req.body,
      user: req.user._id
    };

    const task = new Task(taskData);
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', [
  authMiddleware,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject must be less than 50 characters'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed', 'Overdue'])
    .withMessage('Status must be Pending, In Progress, Completed, or Overdue'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid due date is required'),
  
  body('estimatedTime')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Estimated time must be between 1 and 600 minutes'),
  
  body('actualTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Actual time must be a non-negative number')
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

    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
});

// @route   POST /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.status = 'Completed';
    task.isCompleted = true;
    await task.save();

    res.json({
      success: true,
      message: 'Task marked as completed',
      data: { task }
    });

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing task'
    });
  }
});

export default router;