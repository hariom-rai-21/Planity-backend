import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
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
  dayOfWeek: {
    type: String,
    required: [true, 'Day of week is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  teacher: {
    type: String,
    trim: true,
    maxlength: [50, 'Teacher name cannot exceed 50 characters']
  },
  room: {
    type: String,
    trim: true,
    maxlength: [20, 'Room cannot exceed 20 characters']
  },
  type: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Study Session', 'Break'],
    default: 'Lecture'
  },
  color: {
    type: String,
    default: '#007bff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
timetableSchema.index({ user: 1, dayOfWeek: 1 });
timetableSchema.index({ user: 1, subject: 1 });

// Validation to ensure end time is after start time
timetableSchema.pre('save', function(next) {
  const startHour = parseInt(this.startTime.split(':')[0]);
  const startMinute = parseInt(this.startTime.split(':')[1]);
  const endHour = parseInt(this.endTime.split(':')[0]);
  const endMinute = parseInt(this.endTime.split(':')[1]);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  if (endTotalMinutes <= startTotalMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// Static methods
timetableSchema.statics.findByUserAndDay = function(userId, dayOfWeek) {
  return this.find({ 
    user: userId, 
    dayOfWeek: dayOfWeek,
    isActive: true 
  }).sort({ startTime: 1 });
};

timetableSchema.statics.findByUser = function(userId) {
  return this.find({ 
    user: userId,
    isActive: true 
  }).sort({ dayOfWeek: 1, startTime: 1 });
};

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;