import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  studyTime: {
    type: Number, // in minutes
    default: 0,
    min: [0, 'Study time cannot be negative']
  },
  tasksCompleted: {
    type: Number,
    default: 0,
    min: [0, 'Tasks completed cannot be negative']
  },
  productivity: {
    type: Number,
    min: [1, 'Productivity rating must be between 1-5'],
    max: [5, 'Productivity rating must be between 1-5']
  },
  goals: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    target: Number,
    achieved: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['hours', 'tasks', 'pages', 'chapters', 'exercises'],
      default: 'tasks'
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  mood: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor', 'Terrible'],
    default: 'Average'
  }
}, {
  timestamps: true
});

// Compound index for user and date
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, subject: 1, date: -1 });

// Pre-save middleware to update goal completion status
progressSchema.pre('save', function(next) {
  this.goals.forEach(goal => {
    if (goal.achieved >= goal.target) {
      goal.isCompleted = true;
    } else {
      goal.isCompleted = false;
    }
  });
  next();
});

// Virtual for completion percentage
progressSchema.virtual('overallProgress').get(function() {
  if (this.goals.length === 0) return 0;
  
  const totalProgress = this.goals.reduce((sum, goal) => {
    const goalProgress = Math.min((goal.achieved / goal.target) * 100, 100);
    return sum + goalProgress;
  }, 0);
  
  return Math.round(totalProgress / this.goals.length);
});

// Static methods
progressSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ date: -1 });
};

progressSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

progressSchema.statics.getWeeklyProgress = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          subject: '$subject',
          week: { $week: '$date' }
        },
        totalStudyTime: { $sum: '$studyTime' },
        totalTasksCompleted: { $sum: '$tasksCompleted' },
        avgProductivity: { $avg: '$productivity' },
        records: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.week': 1, '_id.subject': 1 }
    }
  ]);
};

progressSchema.statics.getSubjectStats = function(userId, subject, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        subject: subject,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalStudyTime: { $sum: '$studyTime' },
        totalTasksCompleted: { $sum: '$tasksCompleted' },
        avgProductivity: { $avg: '$productivity' },
        totalSessions: { $sum: 1 }
      }
    }
  ]);
};

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;