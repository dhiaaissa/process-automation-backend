/**
 * scoringService.js
 * Computes an automation score (out of 30) for a business process
 * based on 6 weighted criteria, each scored 0–5.
 *
 * Classification:
 *   > 20  → Automatisable
 *   10–20 → Semi-automatisable
 *   < 10  → Non automatisable
 */

const MAX_SCORE = 5;
const TOTAL_MAX = 30; // 6 criteria × 5

/**
 * Score criterion: Nombre d'étapes (number of steps)
 * Fewer steps → simpler → easier to automate.
 *   ≤ 3  → 5 | 4–6 → 4 | 7–9 → 3 | 10–14 → 2 | ≥ 15 → 1
 */
function scoreNumberOfSteps(totalSteps) {
  if (totalSteps <= 3) return 5;
  if (totalSteps <= 6) return 4;
  if (totalSteps <= 9) return 3;
  if (totalSteps <= 14) return 2;
  return 1;
}

/**
 * Score criterion: Tâches répétitives (repetitive tasks)
 * More repetitive → higher automation potential.
 *   0 → 1 | 1 → 2 | 2 → 3 | 3–4 → 4 | ≥ 5 → 5
 */
function scoreRepetitiveTasks(repetitiveTaskCount) {
  if (repetitiveTaskCount === 0) return 1;
  if (repetitiveTaskCount === 1) return 2;
  if (repetitiveTaskCount === 2) return 3;
  if (repetitiveTaskCount <= 4) return 4;
  return 5;
}

/**
 * Score criterion: Intervention humaine (human intervention) — inverse score.
 * Less human dependency → higher score.
 *   0 → 5 | 1 → 4 | 2–3 → 3 | 4–5 → 2 | ≥ 6 → 1
 */
function scoreHumanIntervention(humanInterventionCount) {
  if (humanInterventionCount === 0) return 5;
  if (humanInterventionCount === 1) return 4;
  if (humanInterventionCount <= 3) return 3;
  if (humanInterventionCount <= 5) return 2;
  return 1;
}

/**
 * Score criterion: Volume (process frequency / actors as proxy).
 * More actors / actors present → higher volume.
 *   0 actors → 2 | 1–2 → 3 | 3–4 → 4 | ≥ 5 → 5
 */
function scoreVolume(totalActors) {
  if (totalActors === 0) return 2;
  if (totalActors <= 2) return 3;
  if (totalActors <= 4) return 4;
  return 5;
}

/**
 * Score criterion: Règles métier (business rules / decision clarity).
 * More actions detected → clearer rules → higher score.
 *   0 → 1 | 1–2 → 2 | 3–5 → 3 | 6–8 → 4 | ≥ 9 → 5
 */
function scoreBusinessRules(totalActions) {
  if (totalActions === 0) return 1;
  if (totalActions <= 2) return 2;
  if (totalActions <= 5) return 3;
  if (totalActions <= 8) return 4;
  return 5;
}

/**
 * Score criterion: Données (data structuring level).
 * Time indicators detected suggests structured data.
 *   0 → 2 | 1–2 → 3 | 3–4 → 4 | ≥ 5 → 5
 */
function scoreDataStructure(timeIndicatorCount) {
  if (timeIndicatorCount === 0) return 2;
  if (timeIndicatorCount <= 2) return 3;
  if (timeIndicatorCount <= 4) return 4;
  return 5;
}

/**
 * Classify a total score.
 * @param {number} totalScore
 * @returns {'Automatisable'|'Semi-automatisable'|'Non automatisable'}
 */
function classify(totalScore) {
  if (totalScore > 20) return 'Automatisable';
  if (totalScore >= 10) return 'Semi-automatisable';
  return 'Non automatisable';
}

/**
 * Compute full scoring for a process based on its analysis result.
 * @param {object} analysis – output of analysisService.analyzeProcess()
 * @returns {object} scoring object matching the Mongoose scoring sub-schema
 */
function scoreProcess(analysis) {
  const {
    summary: {
      totalSteps,
      totalActors,
      totalActions,
      repetitiveTaskCount,
      humanInterventionCount,
    },
    timeIndicators,
  } = analysis;

  const timeIndicatorCount = timeIndicators ? timeIndicators.length : 0;

  const criteria = {
    numberOfSteps: {
      score: scoreNumberOfSteps(totalSteps),
      maxScore: MAX_SCORE,
      description: `Nombre d'étapes: ${totalSteps}`,
    },
    repetitiveTasks: {
      score: scoreRepetitiveTasks(repetitiveTaskCount),
      maxScore: MAX_SCORE,
      description: `Tâches répétitives: ${repetitiveTaskCount}`,
    },
    humanIntervention: {
      score: scoreHumanIntervention(humanInterventionCount),
      maxScore: MAX_SCORE,
      description: `Intervention humaine: ${humanInterventionCount}`,
    },
    volume: {
      score: scoreVolume(totalActors),
      maxScore: MAX_SCORE,
      description: `Volume (acteurs): ${totalActors}`,
    },
    businessRules: {
      score: scoreBusinessRules(totalActions),
      maxScore: MAX_SCORE,
      description: `Règles métier (actions): ${totalActions}`,
    },
    dataStructure: {
      score: scoreDataStructure(timeIndicatorCount),
      maxScore: MAX_SCORE,
      description: `Données (indicateurs temporels): ${timeIndicatorCount}`,
    },
  };

  const totalScore = Object.values(criteria).reduce((sum, c) => sum + c.score, 0);
  const percentage = Math.round((totalScore / TOTAL_MAX) * 100);

  return {
    criteria,
    totalScore,
    maxPossibleScore: TOTAL_MAX,
    percentage,
    classification: classify(totalScore),
  };
}

module.exports = { scoreProcess, classify };
