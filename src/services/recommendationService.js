/**
 * recommendationService.js
 * Generates intelligent, context-aware improvement suggestions
 * based on per-step analysis, scoring, and content patterns.
 */

// Tool suggestion patterns — match step content to specific automation tools
const TOOL_PATTERNS = [
  { pattern: /factur|document|rapport|pièce|relevé|dépense|justificatif|profil|formulaire/i, tools: ['OCR', 'GED (Gestion Électronique des Documents)'], name: 'Traitement documentaire automatisé', phase: 'moyen-terme' },
  { pattern: /envoi|courriel|email|alerte|confirmation|notifi/i, tools: ['Automatisation Email', 'Webhooks / API'], name: 'Automatisation des notifications et envois', phase: 'court-terme' },
  { pattern: /calcul|montant|total|ajustement|paie|réconcili|rapproch|génèr.*rapport/i, tools: ['RPA', 'Scripts automatisés'], name: 'Automatisation des calculs et rapports', phase: 'court-terme' },
  { pattern: /vérifi|contrôl|inspect|examin|conform/i, tools: ['Moteur de règles métier', 'Validation automatisée'], name: 'Vérification et contrôle automatisés', phase: 'moyen-terme' },
  { pattern: /archiv|stock|sauvegard|class/i, tools: ['GED', 'Stockage Cloud automatisé'], name: 'Archivage automatique', phase: 'court-terme' },
  { pattern: /signe|sign/i, tools: ['Signature électronique (DocuSign, Adobe Sign)'], name: 'Signature numérique', phase: 'moyen-terme' },
  { pattern: /assign|attribu|mise? à jour|met à jour/i, tools: ['Workflow automatisé', 'API d\'intégration'], name: 'Mise à jour et attribution automatiques', phase: 'moyen-terme' },
  { pattern: /catégor|classifi|tri|prioris|priorité/i, tools: ['IA de classification', 'Machine Learning'], name: 'Classification automatique par IA', phase: 'long-terme' },
];

/**
 * Generate step-specific tool recommendations by grouping manual steps
 * that match the same tool pattern.
 */
function generateStepToolRecommendations(steps) {
  const manualSteps = steps.filter((s) => s.type === 'manuel');
  if (manualSteps.length === 0) return [];

  const groups = new Map();
  for (const step of manualSteps) {
    for (const tp of TOOL_PATTERNS) {
      if (tp.pattern.test(step.description)) {
        if (!groups.has(tp.name)) {
          groups.set(tp.name, { ...tp, steps: [] });
        }
        groups.get(tp.name).steps.push(step);
        break;
      }
    }
  }

  const recs = [];
  for (const [, group] of groups) {
    const stepNums = group.steps.map((s) => s.order).join(', ');
    recs.push({
      condition: `Étape(s) ${stepNums} : tâche(s) manuelle(s) détectée(s)`,
      suggestion: `${group.name} – Automatiser avec ${group.tools.join(' / ')} pour éliminer l'intervention manuelle`,
      priority: group.steps.length > 1 ? 'high' : 'medium',
      impact: Math.min(group.steps.length + 2, 5),
      effort: 3,
      phase: group.phase,
      tools: group.tools,
    });
  }
  return recs;
}

/**
 * Generate recommendations for a business process.
 * @param {object} analysis  – output of analysisService.analyzeProcess()
 * @param {object} scoring   – output of scoringService.scoreProcess()
 * @returns {Array<{condition, suggestion, priority, impact, effort, phase, tools}>}
 */
function generateRecommendations(analysis, scoring) {
  const recommendations = [];
  const { steps, summary, timeIndicators } = analysis;
  const { criteria, classification, percentage } = scoring;

  // ── 1. Overall process assessment ──────────────────────────────────────────
  if (classification === 'Automatisable') {
    recommendations.push({
      condition: `Score d'automatisation élevé (${percentage}%)`,
      suggestion: `Excellent candidat pour l'automatisation complète. ${summary.systemStepCount} étape(s) sur ${summary.totalSteps} sont déjà gérées par le système. Priorisez la mise en production rapide.`,
      priority: 'high',
      impact: 5,
      effort: 2,
      phase: 'court-terme',
      tools: ['Plateforme RPA', 'Orchestrateur de workflow'],
    });
  } else if (classification === 'Non automatisable') {
    recommendations.push({
      condition: `Score d'automatisation faible (${percentage}%)`,
      suggestion: `Ce processus nécessite une transformation organisationnelle avant automatisation. Réduisez les ${summary.manualStepCount} étape(s) manuelle(s) et les ${summary.decisionPointCount} point(s) de décision humaine en priorité.`,
      priority: 'medium',
      impact: 3,
      effort: 5,
      phase: 'long-terme',
      tools: ['Conseil en transformation', 'Réingénierie des processus (BPR)'],
    });
  } else {
    recommendations.push({
      condition: `Score d'automatisation modéré (${percentage}%)`,
      suggestion: `Processus partiellement automatisable. ${summary.systemStepCount} étape(s) automatique(s), ${summary.manualStepCount} manuelle(s). Une approche progressive est recommandée.`,
      priority: 'medium',
      impact: 4,
      effort: 3,
      phase: 'moyen-terme',
      tools: ['Plateforme BPM', 'RPA'],
    });
  }

  // ── 2. Step count > 10 → simplify ─────────────────────────────────────────
  if (summary.totalSteps > 10) {
    recommendations.push({
      condition: `Le processus comporte ${summary.totalSteps} étapes (> 10)`,
      suggestion: 'Simplifier le processus – Réduire le nombre d\'étapes en fusionnant les tâches similaires et en éliminant les redondances',
      priority: 'high',
      impact: 4,
      effort: 3,
      phase: 'moyen-terme',
      tools: ['Cartographie des processus', 'Lean Management'],
    });
  }

  // ── 3. Actors > 4 → reduce handoffs ───────────────────────────────────────
  if (summary.totalActors > 4) {
    recommendations.push({
      condition: `Le processus implique ${summary.totalActors} acteurs (> 4)`,
      suggestion: 'Réduire les intervenants – Minimiser les transferts entre acteurs pour accélérer le flux et réduire les erreurs',
      priority: 'medium',
      impact: 3,
      effort: 3,
      phase: 'moyen-terme',
      tools: ['Plateforme collaborative', 'Workflow centralisé'],
    });
  }

  // ── 4. Repetitive tasks → RPA ─────────────────────────────────────────────
  if (summary.repetitiveTaskCount > 0) {
    recommendations.push({
      condition: `${summary.repetitiveTaskCount} tâche(s) répétitive(s) détectée(s)`,
      suggestion: 'Automatiser via RPA – Les tâches répétitives sont les candidates idéales pour l\'automatisation robotisée avec un ROI rapide',
      priority: 'high',
      impact: 5,
      effort: 2,
      phase: 'court-terme',
      tools: ['UiPath', 'Power Automate', 'Automation Anywhere'],
    });
  }

  // ── 5. Time indicators > 2 → optimize duration ────────────────────────────
  if (timeIndicators && timeIndicators.length > 2) {
    recommendations.push({
      condition: `${timeIndicators.length} indicateurs temporels détectés`,
      suggestion: 'Optimiser les délais – Éliminer les goulets d\'étranglement et paralléliser les tâches indépendantes',
      priority: 'medium',
      impact: 3,
      effort: 2,
      phase: 'court-terme',
      tools: ['Analyse des temps de cycle', 'Optimisation Lean'],
    });
  }

  // ── 6. Low data structure score → improve data ────────────────────────────
  if (criteria.dataStructure && criteria.dataStructure.score <= 2) {
    recommendations.push({
      condition: `Score de structure des données faible (${criteria.dataStructure.score}/5)`,
      suggestion: 'Structurer les données – Standardiser les formats d\'entrée/sortie et mettre en place une base de données centralisée',
      priority: 'low',
      impact: 3,
      effort: 4,
      phase: 'long-terme',
      tools: ['Base de données centralisée', 'API de standardisation'],
    });
  }

  // ── 7. High human intervention → digitalize ───────────────────────────────
  if (criteria.humanIntervention && criteria.humanIntervention.score <= 2) {
    recommendations.push({
      condition: `Intervention humaine élevée (${summary.humanInterventionCount} occurrences)`,
      suggestion: 'Réduire l\'intervention manuelle – Digitaliser les étapes manuelles et mettre en place des validations automatiques',
      priority: 'high',
      impact: 5,
      effort: 4,
      phase: 'moyen-terme',
      tools: ['Formulaires numériques', 'Validation automatisée', 'IA'],
    });
  }

  // ── 8. Decision points → rule engine ──────────────────────────────────────
  if (summary.decisionPointCount > 0) {
    const decisionSteps = steps.filter((s) => s.type === 'semi-automatisable');
    const stepNums = decisionSteps.map((s) => s.order).join(', ');
    recommendations.push({
      condition: `${summary.decisionPointCount} point(s) de décision détecté(s) (étape(s) ${stepNums})`,
      suggestion: 'Automatiser les décisions – Mettre en place un moteur de règles métier pour les approbations basées sur des critères prédéfinis (montant, seuil, historique)',
      priority: summary.decisionPointCount > 2 ? 'high' : 'medium',
      impact: 4,
      effort: 4,
      phase: 'moyen-terme',
      tools: ['Moteur de règles (Drools, DMN)', 'Workflow d\'approbation'],
    });
  }

  // ── 9. Step-specific tool suggestions ────────────────────────────────────
  const stepToolRecs = generateStepToolRecommendations(steps);
  recommendations.push(...stepToolRecs);

  // ── 10. Quick wins identification ─────────────────────────────────────────
  const quickWinSteps = steps.filter(
    (s) => s.type === 'manuel' && /envoi|notifi|archiv|calcul|génèr/i.test(s.description)
  );
  if (quickWinSteps.length > 0) {
    recommendations.push({
      condition: `${quickWinSteps.length} gain(s) rapide(s) identifié(s)`,
      suggestion: `Commencez par automatiser les étape(s) ${quickWinSteps.map((s) => s.order).join(', ')} – Ces tâches simples offrent un retour sur investissement rapide avec un effort minimal`,
      priority: 'high',
      impact: 4,
      effort: 1,
      phase: 'court-terme',
      tools: ['RPA', 'Scripts d\'automatisation'],
    });
  }

  // ── 11. Automation strategy (for complex processes) ───────────────────────
  if (summary.totalSteps > 5 && summary.manualStepCount > 0) {
    const semiAutoCount = steps.filter((s) => s.type === 'semi-automatisable').length;
    recommendations.push({
      condition: `Taux d'automatisation actuel : ${summary.automationReadiness}%`,
      suggestion: `Stratégie recommandée : Phase 1 – Automatiser les ${summary.manualStepCount} étape(s) manuelle(s). Phase 2 – Optimiser les ${semiAutoCount} étape(s) semi-automatisables. Objectif : atteindre 80%+ d'automatisation.`,
      priority: 'medium',
      impact: 5,
      effort: 4,
      phase: 'long-terme',
      tools: ['Feuille de route d\'automatisation', 'Plateforme BPM'],
    });
  }

  return recommendations;
}

module.exports = { generateRecommendations };
