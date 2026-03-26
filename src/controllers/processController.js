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

// POST /api/processes
exports.createProcess = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const process = await Process.create({ name, description });

    // Auto-analyze on creation
    const analyzed = await runAnalysis(process);
    res.status(201).json({ success: true, data: analyzed });
  } catch (err) {
    next(err);
  }
};

// GET /api/processes
exports.getProcesses = async (req, res, next) => {
  try {
    const processes = await Process.find().sort({ createdAt: -1 });
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
      const err = new Error('Process not found');
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
    const { name, description } = req.body;
    let process = await Process.findById(req.params.id);
    if (!process) {
      const err = new Error('Process not found');
      err.statusCode = 404;
      return next(err);
    }

    if (name !== undefined) process.name = name;
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
      const err = new Error('Process not found');
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
      const err = new Error('Process not found');
      err.statusCode = 404;
      return next(err);
    }
    const analyzed = await runAnalysis(process);
    res.json({ success: true, data: analyzed });
  } catch (err) {
    next(err);
  }
};
