// ─── OmniPubDent Internal Recognition Program ─────────────────────────────────
// Awards require Performance Review Committee approval (3–4 weeks processing time)

export interface AwardDef {
  id: string;
  name: string;       // Display name
  description: string;
  repBonus: number;
  minScore: number;
  requiresUnderBudget?: boolean;
}

export const AWARD_DEFS: AwardDef[] = [
  {
    id: 'stakeholder_alignment',
    name: '🏆 Stakeholder Alignment Award',
    description: 'All seven approval layers signed off without major revisions. A statistical anomaly.',
    repBonus: 6,
    minScore: 92,
  },
  {
    id: 'internal_excellence',
    name: '🏅 Q-Series Excellence Certificate',
    description: 'Recognized by the Performance Review Committee. Certificate printed on cardstock.',
    repBonus: 4,
    minScore: 82,
  },
  {
    id: 'on_budget',
    name: '📊 Budget Compliance Commendation',
    description: 'Delivered within approved parameters AND on schedule. HR will note this.',
    repBonus: 2,
    minScore: 70,
    requiresUnderBudget: true,
  },
];

/**
 * Returns all awards earned for a given score + budget outcome.
 * Most prestigious awards first.
 */
export function checkForAwards(score: number, wasUnderBudget: boolean): AwardDef[] {
  return AWARD_DEFS.filter(award => {
    if (score < award.minScore) return false;
    if (award.requiresUnderBudget && !wasUnderBudget) return false;
    return true;
  });
}
