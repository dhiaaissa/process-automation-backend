/**
 * recommendationService.js
 * Generates improvement suggestions based on analysis and scoring results.
 */

/**
 * Generate recommendations for a business process.
 * @param {object} analysis  – output of analysisService.analyzeProcess()
 * @param {object} scoring   – output of scoringService.scoreProcess()
 * @returns {Array<{condition: string, suggestion: string, priority: 'high'|'medium'|'low'}>}
 */
function generateRecommendations(analysis, scoring) {
  const recommendations = [];
  const { summary, timeIndicators } = analysis;
  const { criteria } = scoring;

  // Steps > 10
  if (summary.totalSteps > 10) {
    recommendations.push({
      condition: `Process has ${summary.totalSteps} steps (> 10)`,
      suggestion:
        'Simplifier le processus – Reduce the number of steps to streamline the workflow',
      priority: 'high',
    });
  }

  // Actors > 4
  if (summary.totalActors > 4) {
    recommendations.push({
      condition: `Process involves ${summary.totalActors} actors (> 4)`,
      suggestion:
        'Réduire les intervenants – Minimize the number of actors involved',
      priority: 'medium',
    });
  }

  // Repetitive tasks detected
  if (summary.repetitiveTaskCount > 0) {
    recommendations.push({
      condition: `${summary.repetitiveTaskCount} repetitive task(s) detected`,
      suggestion:
        'Automatiser via RPA – Use Robotic Process Automation for repetitive tasks',
      priority: 'high',
    });
  }

  // High time / duration indicators
  if (timeIndicators && timeIndicators.length > 2) {
    recommendations.push({
      condition: `${timeIndicators.length} time/duration indicators detected`,
      suggestion:
        'Optimiser le processus – Optimize process duration and eliminate bottlenecks',
      priority: 'medium',
    });
  }

  // Low data structure score (≤ 2)
  if (criteria.dataStructure && criteria.dataStructure.score <= 2) {
    recommendations.push({
      condition: `Data structure score is low (${criteria.dataStructure.score}/5)`,
      suggestion:
        'Structurer les données – Improve data organization for better automation potential',
      priority: 'low',
    });
  }

  // High human intervention (score ≤ 2 means many interventions)
  if (criteria.humanIntervention && criteria.humanIntervention.score <= 2) {
    recommendations.push({
      condition: `High human intervention detected (${summary.humanInterventionCount} occurrences)`,
      suggestion:
        'Réduire l\'intervention manuelle – Reduce manual steps through digitalization',
      priority: 'high',
    });
  }

  return recommendations;
}

module.exports = { generateRecommendations };
