const Process = require('../models/Process');
const { analyzeProcess } = require('../services/analysisService');
const { scoreProcess } = require('../services/scoringService');
const { generateRecommendations } = require('../services/recommendationService');

// Helper: run full analysis pipeline on a process document
async function runAnalysis(process) {
  const analysis = analyzeProcess(process.description);
  const scoring = scoreProcess(analysis);
  const recommendations = generateRecommendations(analysis, scoring);

  process.analysis = analysis;
  process.scoring = scoring;
  process.recommendations = recommendations;
  process.status = 'analyzed';

  return process.save();
}

// Helper: calculate cost/ROI estimation
function calculateROI(manualCostPerExecution, executionsPerMonth, averageTimeMinutes, scoring) {
  const monthlyManualCost = manualCostPerExecution * executionsPerMonth;
  // Automation reduces cost proportionally to the automation score percentage
  const automationEfficiency = scoring ? (scoring.percentage / 100) * 0.8 : 0.5;
  const monthlySavings = Math.round(monthlyManualCost * automationEfficiency * 100) / 100;
  const annualSavings = Math.round(monthlySavings * 12 * 100) / 100;

  // Estimate automation implementation cost based on complexity
  const totalSteps = scoring ? (30 - scoring.criteria.numberOfSteps.score) : 5;
  const estimatedAutomationCost = Math.round((totalSteps * 500 + executionsPerMonth * 10) * 100) / 100;

  const roiPercentage = estimatedAutomationCost > 0
    ? Math.round(((annualSavings - estimatedAutomationCost) / estimatedAutomationCost) * 100)
    : 0;

  const paybackMonths = monthlySavings > 0
    ? Math.round((estimatedAutomationCost / monthlySavings) * 10) / 10
    : 0;

  return {
    manualCostPerExecution,
    executionsPerMonth,
    averageTimeMinutes,
    estimatedAutomationCost,
    monthlySavings,
    annualSavings,
    roiPercentage,
    paybackMonths,
  };
}

// POST /api/processes
exports.createProcess = async (req, res, next) => {
  try {
    const { name, description, manualCostPerExecution, executionsPerMonth, averageTimeMinutes } = req.body;
    const process = await Process.create({ name, description });

    // Auto-analyze on creation
    const analyzed = await runAnalysis(process);

    // Calculate cost/ROI if provided
    if (manualCostPerExecution && executionsPerMonth) {
      analyzed.costEstimation = calculateROI(manualCostPerExecution, executionsPerMonth, averageTimeMinutes || 0, analyzed.scoring);
      await analyzed.save();
    }

    res.status(201).json({ success: true, data: analyzed });
  } catch (err) {
    next(err);
  }
};

// GET /api/processes
exports.getProcesses = async (req, res, next) => {
  try {
    const { search, status, classification, sortBy, order } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (classification) filter['scoring.classification'] = classification;

    const sortField = sortBy === 'score' ? 'scoring.totalScore' : sortBy === 'name' ? 'name' : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const processes = await Process.find(filter).sort({ [sortField]: sortOrder });
    res.json({ success: true, count: processes.length, data: processes });
  } catch (err) {
    next(err);
  }
};

// GET /api/processes/:id
exports.getProcess = async (req, res, next) => {
  try {
    const process = await Process.findById(req.params.id);
    if (!process) {
      const err = new Error('Processus non trouvé');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: process });
  } catch (err) {
    next(err);
  }
};

// PUT /api/processes/:id
exports.updateProcess = async (req, res, next) => {
  try {
    const { name, description, manualCostPerExecution, executionsPerMonth, averageTimeMinutes } = req.body;
    let process = await Process.findById(req.params.id);
    if (!process) {
      const err = new Error('Processus non trouvé');
      err.statusCode = 404;
      return next(err);
    }

    if (name !== undefined) process.name = name;

    // Update cost estimation if provided
    if (manualCostPerExecution !== undefined && executionsPerMonth !== undefined) {
      process.costEstimation = calculateROI(manualCostPerExecution, executionsPerMonth, averageTimeMinutes || 0, process.scoring);
    }

    if (description !== undefined) {
      process.description = description;
      // Re-analyze when description changes
      return res.json({ success: true, data: await runAnalysis(process) });
    }

    await process.save();
    res.json({ success: true, data: process });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/processes/:id
exports.deleteProcess = async (req, res, next) => {
  try {
    const process = await Process.findByIdAndDelete(req.params.id);
    if (!process) {
      const err = new Error('Processus non trouvé');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// POST /api/processes/:id/analyze
exports.analyzeProcessById = async (req, res, next) => {
  try {
    const process = await Process.findById(req.params.id);
    if (!process) {
      const err = new Error('Processus non trouvé');
      err.statusCode = 404;
      return next(err);
    }
    const analyzed = await runAnalysis(process);
    res.json({ success: true, data: analyzed });
  } catch (err) {
    next(err);
  }
};
