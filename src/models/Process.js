const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema(
  { verb: String, object: String },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  { order: Number, description: String },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    condition: String,
    suggestion: String,
    priority: { type: String, enum: ['high', 'medium', 'low'] },
  },
  { _id: false }
);

const criterionSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 5 },
    description: String,
  },
  { _id: false }
);

const processSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'analyzed'],
      default: 'pending',
    },
    analysis: {
      steps: [stepSchema],
      actors: [String],
      actions: [actionSchema],
      repetitiveTasks: [String],
      humanInterventions: [String],
      timeIndicators: [String],
      summary: {
        totalSteps: { type: Number, default: 0 },
        totalActors: { type: Number, default: 0 },
        totalActions: { type: Number, default: 0 },
        repetitiveTaskCount: { type: Number, default: 0 },
        humanInterventionCount: { type: Number, default: 0 },
      },
    },
    scoring: {
      criteria: {
        numberOfSteps: criterionSchema,
        repetitiveTasks: criterionSchema,
        humanIntervention: criterionSchema,
        volume: criterionSchema,
        businessRules: criterionSchema,
        dataStructure: criterionSchema,
      },
      totalScore: { type: Number, default: 0 },
      maxPossibleScore: { type: Number, default: 30 },
      percentage: { type: Number, default: 0 },
      classification: {
        type: String,
        enum: ['Automatisable', 'Semi-automatisable', 'Non automatisable'],
      },
    },
    recommendations: [recommendationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Process', processSchema);
