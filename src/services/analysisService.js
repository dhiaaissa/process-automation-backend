/**
 * analysisService.js
 * Parses a business process description (French/English) to extract:
 *   - steps, actors, actions, repetitive tasks, human interventions, time indicators
 */

// --- Patterns ---------------------------------------------------------------

const STEP_PATTERNS = [
  /^\s*\d+[\.\)]\s+(.+)/m,                          // "1. ...", "2) ..."
  /(?:d'abord|premièrement|first(?:ly)?)[,\s]+(.+?)(?:\.|$)/gi,
  /(?:puis|ensuite|after(?:wards)?|next|then)[,\s]+(.+?)(?:\.|$)/gi,
  /(?:enfin|finally|lastly)[,\s]+(.+?)(?:\.|$)/gi,
];

const ACTOR_PATTERNS = [
  /\ble\s+(manager|directeur|responsable|superviseur|chef)\b/gi,
  /\bl[a']?\s*(cliente?|client)\b/gi,
  /\bl[a']?\s*(employée?|employé)\b/gi,
  /\bl[a']?\s*(système|system)\b/gi,
  /\bl[a']?\s*(administrateur|admin)\b/gi,
  /\bl[a']?\s*(utilisateur|user)\b/gi,
  /\bl[a']?\s*(fournisseur|supplier)\b/gi,
  /\b(manager|client|employee|system|admin|user|supplier|team)\b/gi,
];

const ACTION_VERB_PATTERNS = [
  /\b(vérifie|valide|approuve|soumet|envoie|reçoit|traite|crée|modifie|supprime|analyse|calcule|génère|notifie|confirme)\b/gi,
  /\b(verif(?:y|ies)|validat(?:e|es)|approv(?:e|es)|submit(?:s)?|send(?:s)?|receiv(?:e|es)|process(?:es)?|creat(?:e|es)|modif(?:y|ies)|delet(?:e|es)|analyz(?:e|es)|calculat(?:e|es)|generat(?:e|es)|notif(?:y|ies)|confirm(?:s)?)\b/gi,
];

const REPETITIVE_PATTERNS = [
  /\b(chaque|tous les|chaque jour|quotidien|quotidiennement|hebdomadaire|mensuel|répéter|répétitif|régulièrement|toujours)\b/gi,
  /\b(every|each|daily|weekly|monthly|repeat|repetitive|regularly|always)\b/gi,
];

const HUMAN_INTERVENTION_PATTERNS = [
  /\b(manuellement|manuel|à la main|vérifie|approuve|décide|signe|valide|contrôle|examine|révise)\b/gi,
  /\b(manually|manual|check(?:s)?|approv(?:e|es)|decid(?:e|es)|sign(?:s)?|review(?:s)?|inspect(?:s)?)\b/gi,
];

const TIME_PATTERNS = [
  /\b(\d+\s*(?:minutes?|heures?|jours?|semaines?|mois|secondes?))\b/gi,
  /\b(\d+\s*(?:minutes?|hours?|days?|weeks?|months?|seconds?))\b/gi,
  /\b(rapidement|lentement|immédiatement|dans les \d+\s*\w+|quickly|slowly|immediately|within \d+\s*\w+)\b/gi,
];

// --- Helpers ----------------------------------------------------------------

/**
 * Extract all regex matches from text, returning unique non-empty strings.
 */
function extractMatches(text, patterns) {
  const results = new Set();
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      const value = (match[1] || match[0]).trim();
      if (value) results.add(value.toLowerCase());
    }
  }
  return [...results];
}

/**
 * Split text into sentences / lines and detect steps.
 */
function extractSteps(text) {
  const steps = [];

  // Numbered list items
  const numberedRe = /^\s*(\d+)[\.\)]\s+(.+)/gm;
  let match;
  while ((match = numberedRe.exec(text)) !== null) {
    steps.push({ order: parseInt(match[1], 10), description: match[2].trim() });
  }

  if (steps.length > 0) return steps;

  // Sequential keyword sentences
  const sentences = text.split(/[.;!\n]+/).map((s) => s.trim()).filter(Boolean);
  const keywords = /\b(d'abord|premièrement|puis|ensuite|après|enfin|first(?:ly)?|then|next|after(?:wards)?|finally|lastly)\b/i;
  let order = 1;
  for (const sentence of sentences) {
    if (keywords.test(sentence) || sentences.length <= 10) {
      steps.push({ order: order++, description: sentence });
    }
  }

  // Fallback: treat every sentence as a step
  if (steps.length === 0) {
    sentences.forEach((s, i) => steps.push({ order: i + 1, description: s }));
  }

  return steps;
}

/**
 * Extract action verbs with their following object (best-effort).
 */
function extractActions(text) {
  const actions = [];
  const seen = new Set();

  for (const pattern of ACTION_VERB_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      const verb = match[0].trim().toLowerCase();
      if (seen.has(verb)) continue;
      seen.add(verb);

      // Grab the word(s) after the verb as object
      const afterVerb = text.slice(match.index + match[0].length).trim();
      const objectMatch = afterVerb.match(/^[^\.,;!?\n]{0,40}/);
      const obj = objectMatch ? objectMatch[0].trim() : '';
      actions.push({ verb, object: obj });
    }
  }

  return actions;
}

// --- Public API -------------------------------------------------------------

/**
 * Analyse a process description text.
 * @param {string} text
 * @returns {object} analysis result
 */
function analyzeProcess(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Process description text is required');
  }

  const steps = extractSteps(text);
  const actors = extractMatches(text, ACTOR_PATTERNS);
  const actions = extractActions(text);
  const repetitiveTasks = extractMatches(text, REPETITIVE_PATTERNS);
  const humanInterventions = extractMatches(text, HUMAN_INTERVENTION_PATTERNS);
  const timeIndicators = extractMatches(text, TIME_PATTERNS);

  return {
    steps,
    actors,
    actions,
    repetitiveTasks,
    humanInterventions,
    timeIndicators,
    summary: {
      totalSteps: steps.length,
      totalActors: actors.length,
      totalActions: actions.length,
      repetitiveTaskCount: repetitiveTasks.length,
      humanInterventionCount: humanInterventions.length,
    },
  };
}

module.exports = { analyzeProcess };
