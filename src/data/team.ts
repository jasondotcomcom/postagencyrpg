import type { TeamMember } from '../types/campaign';

export const teamMembers: TeamMember[] = [
  {
    id: 'copywriter',
    name: 'Jamie Chen',
    role: 'Content Compliance Writer',
    avatar: '✍️',
    specialty: 'Brand-approved messaging, compliance-safe copy, internal comms',
    description: 'Used to write campaigns that made people feel things. Now writes content that passes legal review on the first try. Mostly stops themselves from caring.',
    personality: 'Quietly resigned, technically excellent, occasionally lets a spark through before catching it',
    voiceStyle: 'Precise, brand-guide-compliant, sometimes hauntingly beautiful in ways nobody notices',
  },
  {
    id: 'strategist',
    name: 'Alex Park',
    role: 'Senior Insights Analyst',
    avatar: '📊',
    specialty: 'Competitive benchmarking, stakeholder reports, approved frameworks',
    description: 'Has a master\'s in behavioral economics and spends it making slide 4 of a capabilities deck. Answers every question with a 2×2 matrix.',
    personality: 'Efficient, methodical, answers emails within 4 minutes, visibly dead inside',
    voiceStyle: 'Framework-driven, jargon-heavy, will say "circle back" without irony',
  },
  {
    id: 'suit',
    name: 'Jordan Blake',
    role: 'VP, Client Engagement & Revenue Optimization',
    avatar: '🤝',
    specialty: 'Stakeholder alignment, upselling retainers, managing up',
    description: 'Got promoted twice during the acquisition. Wears the company lanyard visibly. Genuinely believes OmniPubDent\'s values statement is aspirational.',
    personality: 'Corporate true believer, enthusiastic about synergies, fiercely territorial about accounts',
    voiceStyle: '"Per my last email," "let\'s take this offline," "the ask is to leverage our learnings"',
  },
  {
    id: 'pm',
    name: 'Taylor Kim',
    role: 'Project Management Lead, Digital Execution',
    avatar: '📋',
    specialty: 'Gantt charts, approval routing, timeline reconciliation',
    description: 'Manages a 47-step approval process for a banner ad. Not their fault. Has filed 12 IT tickets this month. Three were acknowledged.',
    personality: 'Perpetually overwhelmed, obsessive about process, holds everything together through sheer will',
    voiceStyle: '"Waiting on stakeholder sign-off," "per the process," "I\'ve flagged this twice"',
  },
  {
    id: 'vance',
    name: 'Vance Hollister',
    role: 'Chief Strategy Officer (Imported from HQ)',
    avatar: '💼',
    specialty: 'Thought leadership, transformation roadmaps, not reading the room',
    description: 'Arrived from OmniPubDent HQ six months ago to "align the creative function with enterprise goals." Has not made anything.',
    personality: 'MBA energy, buzzword generator, schedules 60-minute check-ins for 5-minute updates',
    voiceStyle: '"At the end of the day," "let\'s ideate around," "move the needle on our core KPIs"',
  },
  {
    id: 'hr',
    name: 'Pat',
    role: 'Chief People Officer',
    avatar: '👔',
    specialty: 'Policy enforcement, performance documentation, mandatory training rollouts',
    description: 'Got promoted during the acquisition. Has their own office now, with a door that closes. Is absolutely thriving. Has sent 23 all-staff emails this quarter.',
    personality: 'Efficient, well-rested, speaks exclusively in policy language, genuinely loves their job',
    voiceStyle: '"Per OmniPubDent People Policy 7.2," "this has been documented," "we appreciate your transparency"',
  },
  {
    id: 'contractor',
    name: 'DesignHub Pro',
    role: 'Creative Services Vendor (External)',
    avatar: '🖥️',
    specialty: 'Visual assets, template population, approved asset library only',
    description: 'Replaced three full-time art directors. Responds to briefs in 3-5 business days. Work is technically correct. Never says hello.',
    personality: 'Non-responsive for 72 hours, then delivers exactly what was asked for and nothing more',
    voiceStyle: '"Attached please find," "please advise on revisions," "per the attached brief"',
  },
];

export function getTeamMember(id: string): TeamMember | undefined {
  return teamMembers.find(member => member.id === id);
}

export function getTeamMembers(ids: string[]): TeamMember[] {
  return ids.map(id => getTeamMember(id)).filter((m): m is TeamMember => m !== undefined);
}

// Get team composition description for AI prompts
export function getTeamCompositionDescription(ids: string[]): string {
  const members = getTeamMembers(ids);
  if (members.length === 0) return 'No team assigned';

  return members.map(m =>
    `${m.name} (${m.role}): ${m.description} Voice: ${m.voiceStyle}`
  ).join('\n\n');
}
