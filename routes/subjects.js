import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get user subjects from profile
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const subjects = req.user.subjects || [];

    res.json({
      success: true,
      data: {
        subjects,
        count: subjects.length
      }
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subjects'
    });
  }
});

// @route   POST /api/subjects
// @desc    Add a new subject to user profile
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, assignments, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required'
      });
    }

    // Check if subject already exists
    const existingSubject = req.user.subjects.find(
      subject => subject.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject already exists'
      });
    }

    const newSubject = {
      name: name.trim(),
      assignments: assignments || [],
      status: status || 'Pending'
    };

    req.user.subjects.push(newSubject);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      data: { subject: newSubject }
    });

  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding subject'
    });
  }
});

// @route   PUT /api/subjects/:name
// @desc    Update a subject
// @access  Private
router.put('/:name', authMiddleware, async (req, res) => {
  try {
    const subjectName = req.params.name;
    const { assignments, status } = req.body;

    const subject = req.user.subjects.find(
      s => s.name.toLowerCase() === subjectName.toLowerCase()
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (assignments !== undefined) subject.assignments = assignments;
    if (status !== undefined) subject.status = status;

    await req.user.save();

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject }
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subject'
    });
  }
});

export default router;