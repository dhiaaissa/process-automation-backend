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

// GET /api/dashboard/bi
exports.getBIData = async (req, res, next) => {
  try {
    const processes = await Process.find({ status: 'analyzed' });

    // 1. Score comparison per process (bar chart)
    const scoreComparison = processes.map((p) => ({
      name: p.name.length > 25 ? p.name.slice(0, 25) + '…' : p.name,
      score: p.scoring ? p.scoring.percentage : 0,
      classification: p.scoring ? p.scoring.classification : null,
    }));

    // 2. Criteria radar — average score per criterion across all processes
    const criteriaKeys = ['numberOfSteps', 'repetitiveTasks', 'humanIntervention', 'volume', 'businessRules', 'dataStructure'];
    const criteriaLabels = {
      numberOfSteps: "Étapes",
      repetitiveTasks: "Tâches répétitives",
      humanIntervention: "Intervention humaine",
      volume: "Volume",
      businessRules: "Règles métier",
      dataStructure: "Données",
    };
    const criteriaAvg = criteriaKeys.map((key) => {
      const scores = processes
        .filter((p) => p.scoring && p.scoring.criteria && p.scoring.criteria[key])
        .map((p) => p.scoring.criteria[key].score);
      return {
        criterion: criteriaLabels[key] || key,
        average: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
        max: 5,
      };
    });

    // 3. Step type distribution across all processes (pie chart data)
    let totalAuto = 0, totalSemi = 0, totalManual = 0;
    processes.forEach((p) => {
      if (p.analysis && p.analysis.summary) {
        totalAuto += p.analysis.summary.systemStepCount || 0;
        totalManual += p.analysis.summary.manualStepCount || 0;
        const total = p.analysis.summary.totalSteps || 0;
        totalSemi += total - (p.analysis.summary.systemStepCount || 0) - (p.analysis.summary.manualStepCount || 0);
      }
    });
    const stepTypeDistribution = { automatisable: totalAuto, semiAutomatisable: totalSemi, manuel: totalManual };

    // 4. Complexity distribution
    const complexityCounts = { faible: 0, moyenne: 0, élevée: 0 };
    processes.forEach((p) => {
      if (p.analysis && p.analysis.summary && p.analysis.summary.complexityLevel) {
        complexityCounts[p.analysis.summary.complexityLevel] = (complexityCounts[p.analysis.summary.complexityLevel] || 0) + 1;
      }
    });

    // 5. ROI overview per process
    const roiData = processes
      .filter((p) => p.costEstimation && p.costEstimation.executionsPerMonth > 0)
      .map((p) => ({
        name: p.name.length > 25 ? p.name.slice(0, 25) + '…' : p.name,
        annualSavings: p.costEstimation.annualSavings,
        automationCost: p.costEstimation.estimatedAutomationCost,
        roiPercentage: p.costEstimation.roiPercentage,
        paybackMonths: p.costEstimation.paybackMonths,
      }));

    // 6. Recommendation priority breakdown
    let recHigh = 0, recMedium = 0, recLow = 0;
    processes.forEach((p) => {
      if (p.recommendations) {
        p.recommendations.forEach((r) => {
          if (r.priority === 'high') recHigh++;
          else if (r.priority === 'medium') recMedium++;
          else recLow++;
        });
      }
    });
    const recommendationBreakdown = { high: recHigh, medium: recMedium, low: recLow };

    // 7. Automation readiness per process
    const readinessData = processes.map((p) => ({
      name: p.name.length > 25 ? p.name.slice(0, 25) + '…' : p.name,
      readiness: p.analysis && p.analysis.summary ? (p.analysis.summary.automationReadiness || 0) : 0,
    }));

    res.json({
      success: true,
      data: {
        scoreComparison,
        criteriaAvg,
        stepTypeDistribution,
        complexityCounts,
        roiData,
        recommendationBreakdown,
        readinessData,
      },
    });
  } catch (err) {
    next(err);
  }
};
