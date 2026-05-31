import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  goal: { 
    type: String, 
    required: true 
  },
  durationMonths: { 
    type: Number, 
    required: true 
  },
  dailyHours: { 
    type: Number, 
    required: true 
  },

  plan: [{
    week: Number,
    topics: [String],
    tasks: [{
      title: String,
      description: String,
      hours: Number,
      completed: { 
        type: Boolean, 
        default: false 
      },
      note: String,
      completedAt: Date
    }]
  }],

  totalTasks: Number,
  completedTasks: { 
    type: Number, 
    default: 0 
  },
  progress: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

export default StudyPlan;