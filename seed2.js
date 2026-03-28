require('dotenv').config();
const mongoose = require('mongoose');
const Process = require('./src/models/Process');
const { analyzeProcess } = require('./src/services/analysisService');
const { scoreProcess } = require('./src/services/scoringService');
const { generateRecommendations } = require('./src/services/recommendationService');

const sampleProcesses = [
  // ── AUTOMATISABLE ─────────────────────────────────────────────────────────
  // Objectif : peu d'étapes, beaucoup de tâches répétitives, 0 intervention humaine,
  // beaucoup d'acteurs, beaucoup d'actions, indicateurs temporels → score > 20/30
  {
    name: 'Traitement automatique des commandes en ligne',
    description: `1. Le système reçoit les commandes du client chaque jour, quotidiennement et régulièrement en 5 minutes. Le fournisseur reçoit une copie.
2. Le système traite les commandes, calcule le montant total et génère la facture de manière répétitif, toujours dans les 10 minutes.
3. Le système envoie la confirmation, notifie l'employé et le manager, crée un rapport hebdomadaire et mensuel pour l'administrateur et l'utilisateur dans les 2 heures.`,
    cost: { manualCostPerExecution: 5, executionsPerMonth: 2000, averageTimeMinutes: 3 },
  },
  {
    name: 'Synchronisation automatique des sauvegardes',
    description: `1. Le système collecte les données du client et de l'employé, et les traite chaque jour de manière répétitif, régulièrement en 3 minutes.
2. Le système génère une copie de sauvegarde, l'envoie et calcule l'espace de stockage utilisé tous les jours, toujours dans les 15 minutes, de façon hebdomadaire et mensuel.
3. Le système notifie le manager, l'administrateur, l'utilisateur et le superviseur, crée un journal et confirme la sauvegarde quotidiennement en 1 heure. Le fournisseur reçoit une notification.`,
    cost: { manualCostPerExecution: 10, executionsPerMonth: 1000, averageTimeMinutes: 5 },
  },

  // ── SEMI-AUTOMATISABLE ────────────────────────────────────────────────────
  // Objectif : mélange d'automatisation et d'intervention humaine → score 10-20/30
  {
    name: 'Traitement des factures',
    description: `1. L'employé reçoit la facture par courriel chaque jour.
2. L'employé vérifie manuellement les détails de la facture par rapport au bon de commande.
3. Le manager approuve ou rejette la facture dans les 2 jours.
4. Le système génère une écriture de paiement après approbation.
5. L'administrateur envoie la confirmation de paiement au fournisseur.
6. L'employé archive la facture manuellement chaque semaine.
7. Le système notifie le manager si le paiement est en retard.`,
    cost: { manualCostPerExecution: 15, executionsPerMonth: 300, averageTimeMinutes: 20 },
  },
  {
    name: 'Intégration des employés',
    description: `1. L'administrateur reçoit la demande de recrutement du manager.
2. L'administrateur crée manuellement le profil de l'employé dans le système.
3. Le système génère les identifiants de connexion et les envoie à l'employé.
4. Le manager assigne un mentor et examine la liste de contrôle d'intégration.
5. L'employé signe tous les documents requis manuellement.
6. L'administrateur vérifie tous les documents dans les 3 jours.
7. Le système notifie l'équipe du nouvel employé.
8. Le manager approuve le plan de période d'essai.`,
    cost: { manualCostPerExecution: 45, executionsPerMonth: 12, averageTimeMinutes: 60 },
  },
  {
    name: 'Approbation des bons de commande',
    description: `1. L'utilisateur crée une demande d'achat dans le système.
2. Le système valide la disponibilité du budget automatiquement.
3. Le manager examine et approuve le bon de commande dans la journée.
4. Le fournisseur reçoit la confirmation de commande par courriel.
5. L'administrateur suit le statut de livraison quotidiennement.
6. L'employé contrôle manuellement les marchandises reçues.
7. Le système calcule et génère le montant final du paiement.
8. Le manager valide le paiement avant traitement.`,
    cost: { manualCostPerExecution: 20, executionsPerMonth: 150, averageTimeMinutes: 25 },
  },
  {
    name: 'Résolution des tickets de support client',
    description: `1. Le client soumet un ticket de support via le système.
2. Le système catégorise automatiquement le ticket par priorité.
3. L'employé examine manuellement le ticket et l'assigne à l'équipe appropriée.
4. L'équipe analyse le problème et fournit une solution dans les 4 heures.
5. L'employé envoie la réponse au client.
6. Le client confirme si le problème est résolu.
7. Le manager examine les tickets non résolus chaque semaine.
8. Le système génère un rapport mensuel sur les délais de résolution des tickets.`,
    cost: { manualCostPerExecution: 10, executionsPerMonth: 500, averageTimeMinutes: 15 },
  },
  {
    name: 'Gestion des demandes de congé',
    description: `1. L'employé soumet une demande de congé via le système.
2. Le système vérifie le solde de congés restant automatiquement.
3. Le manager examine et approuve ou rejette la demande dans les 2 jours.
4. Le système notifie l'employé de la décision.
5. L'administrateur met à jour manuellement les registres de présence.
6. Le système calcule les ajustements de paie chaque mois.
7. Le manager examine les tendances de congés chaque trimestre.`,
    cost: { manualCostPerExecution: 8, executionsPerMonth: 80, averageTimeMinutes: 10 },
  },
  {
    name: 'Rapports financiers mensuels',
    description: `1. Le système collecte les données de transactions de tous les départements chaque mois.
2. L'employé rapproche manuellement les relevés bancaires avec les registres internes.
3. L'administrateur vérifie tous les rapports de dépenses dans les 5 jours.
4. Le manager examine les écarts budgétaires et approuve les ajustements.
5. Le système génère le rapport financier consolidé.
6. Le manager signe le rapport final.
7. L'administrateur envoie le rapport au conseil d'administration.
8. Le système archive tous les documents justificatifs.`,
    cost: { manualCostPerExecution: 200, executionsPerMonth: 4, averageTimeMinutes: 480 },
  },

  // ── NON AUTOMATISABLE ─────────────────────────────────────────────────────
  // Objectif : beaucoup d'étapes, forte intervention humaine, 0 tâches répétitives,
  // 0 indicateurs temporels, peu d'acteurs/actions → score < 10/30
  {
    name: 'Élaboration de la stratégie commerciale annuelle',
    description: `1. Le comité examine les résultats de la période précédente.
2. Le comité de direction décide des objectifs prioritaires.
3. Le PDG révise les propositions formulées par les départements.
4. Le bureau vérifie manuellement la cohérence des données financières.
5. Le comité directeur approuve les axes stratégiques retenus.
6. La direction contrôle la faisabilité des initiatives proposées.
7. Le PDG signe les documents de cadrage stratégique.
8. Le comité examine les risques associés aux orientations retenues.
9. Le bureau décide de l'allocation des ressources à la main.
10. Le PDG révise le plan de mise en œuvre détaillé.
11. Le comité de pilotage contrôle les indicateurs de performance proposés.
12. Le secrétariat examine la documentation de support nécessaire.
13. La direction vérifie les prévisions budgétaires manuellement.
14. Le PDG signe les autorisations de lancement des projets.
15. Le comité approuve le document final de la stratégie.`,
    cost: { manualCostPerExecution: 500, executionsPerMonth: 1, averageTimeMinutes: 2400 },
  },
  {
    name: 'Audit qualité et conformité réglementaire',
    description: `1. Le comité d'audit examine la documentation de conformité existante.
2. Le bureau qualité vérifie manuellement les procédures internes.
3. Le comité décide des domaines prioritaires à auditer.
4. Le bureau révise les protocoles de conformité en vigueur.
5. Le comité d'audit contrôle les écarts identifiés dans les rapports précédents.
6. Le PDG approuve le plan d'audit proposé par le bureau.
7. Le comité examine les preuves documentaires collectées.
8. Le bureau qualité vérifie les témoignages recueillis à la main.
9. Le comité décide des actions correctives nécessaires.
10. Le PDG signe le rapport d'audit préliminaire.
11. Le bureau révise les recommandations formulées manuellement.
12. Le comité contrôle la mise en œuvre des actions correctives.
13. Le PDG approuve le rapport de conformité final.
14. Le comité d'audit examine les résultats des inspections complémentaires.
15. Le bureau qualité signe les attestations de conformité réglementaire.
16. Le comité décide du calendrier des prochains audits.`,
    cost: { manualCostPerExecution: 300, executionsPerMonth: 2, averageTimeMinutes: 960 },
  },
];

// Helper: calculate cost/ROI estimation
function calculateROI(cost, scoring) {
  const monthlyManualCost = cost.manualCostPerExecution * cost.executionsPerMonth;
  const automationEfficiency = scoring ? (scoring.percentage / 100) * 0.8 : 0.5;
  const monthlySavings = Math.round(monthlyManualCost * automationEfficiency * 100) / 100;
  const annualSavings = Math.round(monthlySavings * 12 * 100) / 100;
  const totalSteps = scoring ? (30 - scoring.criteria.numberOfSteps.score) : 5;
  const estimatedAutomationCost = Math.round((totalSteps * 500 + cost.executionsPerMonth * 10) * 100) / 100;
  const roiPercentage = estimatedAutomationCost > 0
    ? Math.round(((annualSavings - estimatedAutomationCost) / estimatedAutomationCost) * 100)
    : 0;
  const paybackMonths = monthlySavings > 0
    ? Math.round((estimatedAutomationCost / monthlySavings) * 10) / 10
    : 0;

  return {
    manualCostPerExecution: cost.manualCostPerExecution,
    executionsPerMonth: cost.executionsPerMonth,
    averageTimeMinutes: cost.averageTimeMinutes,
    estimatedAutomationCost,
    monthlySavings,
    annualSavings,
    roiPercentage,
    paybackMonths,
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    await Process.deleteMany({});
    console.log('Cleared existing processes');

    for (const proc of sampleProcesses) {
      const doc = await Process.create({ name: proc.name, description: proc.description });

      const analysis = analyzeProcess(doc.description);
      const scoring = scoreProcess(analysis);
      const recommendations = generateRecommendations(analysis, scoring);

      doc.analysis = analysis;
      doc.scoring = scoring;
      doc.recommendations = recommendations;
      doc.status = 'analyzed';

      if (proc.cost) {
        doc.costEstimation = calculateROI(proc.cost, scoring);
      }

      await doc.save();
      const roi = doc.costEstimation ? ` | ROI: ${doc.costEstimation.roiPercentage}%, Savings: $${doc.costEstimation.annualSavings}/yr` : '';
      console.log(`Seeded: ${doc.name} (score: ${scoring.percentage}% - ${scoring.classification}${roi})`);
    }

    console.log(`\nDone! Seeded ${sampleProcesses.length} processes.`);
    await mongoose.connection.close();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
