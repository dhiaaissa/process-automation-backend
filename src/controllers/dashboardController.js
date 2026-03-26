const Process = require('../models/Process');

// GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const total = await Process.countDocuments();
    const analyzed = await Process.countDocuments({ status: 'analyzed' });

    const analyzedProcesses = await Process.find(
      { status: 'analyzed' },
      'scoring'
    );

    const scores = analyzedProcesses.map((p) => p.scoring.totalScore || 0);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const automatable = analyzedProcesses.filter(
      (p) => p.scoring.classification === 'Automatisable'
    ).length;

    const semiAutomatable = analyzedProcesses.filter(
      (p) => p.scoring.classification === 'Semi-automatisable'
    ).length;

    const notAutomatable = analyzedProcesses.filter(
      (p) => p.scoring.classification === 'Non automatisable'
    ).length;

    const automatablePercentage =
      analyzed > 0 ? Math.round((automatable / analyzed) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalProcesses: total,
        analyzedProcesses: analyzed,
        pendingProcesses: total - analyzed,
        averageScore: avgScore,
        automatablePercentage,
        classificationBreakdown: {
          automatable,
          semiAutomatable,
          notAutomatable,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/overview
exports.getOverview = async (req, res, next) => {
  try {
    const processes = await Process.find(
      {},
      'name status scoring recommendations createdAt updatedAt'
    ).sort({ createdAt: -1 });

    const overview = processes.map((p) => ({
      id: p._id,
      name: p.name,
      status: p.status,
      totalScore: p.scoring ? p.scoring.totalScore : null,
      percentage: p.scoring ? p.scoring.percentage : null,
      classification: p.scoring ? p.scoring.classification : null,
      recommendationCount: p.recommendations ? p.recommendations.length : 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json({ success: true, count: overview.length, data: overview });
  } catch (err) {
    next(err);
  }
};
