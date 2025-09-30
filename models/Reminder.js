import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  reminderDate: {
    type: Date,
    required: [true, 'Reminder date is required']
  },
  type: {
    type: String,
    enum: ['Assignment', 'Exam', 'Meeting', 'Study Session', 'Break', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subject: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
reminderSchema.index({ user: 1, reminderDate: 1 });
reminderSchema.index({ user: 1, isCompleted: 1 });

// Pre-save middleware
reminderSchema.pre('save', function(next) {
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  } else if (!this.isCompleted) {
    this.completedAt = undefined;
  }
  next();
});

// Virtual for checking if reminder is overdue
reminderSchema.virtual('isOverdue').get(function() {
  return this.reminderDate < new Date() && !this.isCompleted;
});

// Static methods
reminderSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    user: userId, 
    isActive: true,
    isCompleted: false 
  }).sort({ reminderDate: 1 });
};

reminderSchema.statics.findUpcomingByUser = function(userId, hours = 24) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    user: userId,
    isActive: true,
    isCompleted: false,
    reminderDate: {
      $gte: now,
      $lte: futureDate
    }
  }).sort({ reminderDate: 1 });
};

reminderSchema.statics.findOverdueByUser = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    isCompleted: false,
    reminderDate: { $lt: new Date() }
  }).sort({ reminderDate: 1 });
};

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;