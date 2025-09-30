import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  productivity: {
    type: Number,
    min: [1, 'Productivity rating must be between 1-5'],
    max: [5, 'Productivity rating must be between 1-5']
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  totalBreakTime: {
    type: Number,
    default: 0 // in minutes
  }
}, {
  timestamps: true
});

// Indexes
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ user: 1, subject: 1 });

// Pre-save middleware to calculate duration
studySessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // convert to minutes
    
    // Calculate total break time
    this.totalBreakTime = this.breaks.reduce((total, breakTime) => {
      if (breakTime.duration) {
        return total + breakTime.duration;
      }
      return total;
    }, 0);
  }
  next();
});

// Virtual for effective study time (total duration minus breaks)
studySessionSchema.virtual('effectiveStudyTime').get(function() {
  return this.duration - this.totalBreakTime;
});

// Static methods
studySessionSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ startTime: -1 });
};

studySessionSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    startTime: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ startTime: -1 });
};

studySessionSchema.statics.getWeeklyStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate, $lte: endDate },
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: '$subject',
        totalSessions: { $sum: 1 },
        totalTime: { $sum: '$duration' },
        avgProductivity: { $avg: '$productivity' }
      }
    }
  ]);
};

const StudySession = mongoose.model('StudySession', studySessionSchema);

export default StudySession;