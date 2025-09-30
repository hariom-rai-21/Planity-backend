import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  estimatedTime: {
    type: Number, // in minutes
    min: [1, 'Estimated time must be at least 1 minute'],
    max: [600, 'Estimated time cannot exceed 600 minutes (10 hours)']
  },
  actualTime: {
    type: Number, // in minutes
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, subject: 1 });

// Pre-save middleware to update completion status
taskSchema.pre('save', function(next) {
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.isCompleted = true;
  } else if (this.status !== 'Completed') {
    this.completedAt = undefined;
    this.isCompleted = false;
  }
  next();
});

// Virtual for overdue tasks
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'Completed';
});

// Static methods
taskSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ dueDate: 1 });
};

taskSchema.statics.findPendingByUser = function(userId) {
  return this.find({ 
    user: userId, 
    status: { $in: ['Pending', 'In Progress'] } 
  }).sort({ dueDate: 1 });
};

taskSchema.statics.findOverdueByUser = function(userId) {
  return this.find({
    user: userId,
    dueDate: { $lt: new Date() },
    status: { $ne: 'Completed' }
  }).sort({ dueDate: 1 });
};

const Task = mongoose.model('Task', taskSchema);

export default Task;