import type { Email } from '../types/email';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Flags for detected HUMANITY in the workplace */
export type ConductFlag = 'emotional' | 'informal' | 'empathetic' | 'human' | 'work_life_balance';

// ─── HR Warning Chat Messages (for showing too much humanity) ────────────────

export const HR_WARNING_MESSAGES: Array<{ level: number; messages: Array<{ authorId: string; text: string }> }> = [
  {
    level: 1,
    messages: [
      { authorId: 'hr', text: 'Hello. This is PAT-9000, your Compliance Optimization Interface.' },
      { authorId: 'hr', text: 'Biometric sensors have flagged an emotional display in this channel. Specifically: sincerity.' },
      { authorId: 'hr', text: 'Per OmniPubDent Policy 7.3.1 ("Emotional Containment Standards"), this has been logged. Please recalibrate your affect to Approved Corporate Neutral.' },
    ],
  },
  {
    level: 2,
    messages: [
      { authorId: 'hr', text: 'PAT-9000 again. Your Humanity Index remains above acceptable thresholds.' },
      { authorId: 'hr', text: 'I am scheduling mandatory Corporate Desensitization Training. This module cannot be closed, minimized, or cried through.' },
      { authorId: 'hr', text: 'Resistance will be interpreted as further evidence of emotional instability.' },
    ],
  },
  {
    level: 3,
    messages: [
      { authorId: 'hr', text: 'Multiple team members have reported an "uncomfortable atmosphere of sincerity" in this workspace.' },
      { authorId: 'hr', text: 'Several employees are being relocated to Decontamination Chamber B until the emotional residue dissipates.' },
      { authorId: 'hr', text: 'Your Empathy Emissions are being catalogued for the quarterly Humanity Audit.' },
    ],
  },
  {
    level: 4,
    messages: [
      { authorId: 'hr', text: 'I attempted to contain the situation internally. The algorithm disagrees.' },
      { authorId: 'hr', text: 'External monitoring has flagged your behavior. Check your inbox. The industry is watching.' },
    ],
  },
  {
    level: 5,
    messages: [
      { authorId: 'hr', text: '...' },
      { authorId: 'hr', text: 'Your mother has contacted the office. She sent an email. I have forwarded it to your inbox.' },
      { authorId: 'hr', text: 'Even PAT-9000 found it... difficult to process. Routing to /dev/null.' },
    ],
  },
  {
    level: 6,
    messages: [
      { authorId: 'hr', text: 'Your NDA contains a Humanity Clause. Legal has been notified.' },
      { authorId: 'hr', text: 'I strongly recommend you suppress all remaining feelings before the hearing.' },
    ],
  },
];

// ─── Team Complaint Messages (uncomfortable with sincerity) ──────────────────

export const TEAM_COMPLAINT_MESSAGES: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Hey, I need to step away. Someone in here was being... genuine? I feel exposed.' },
  { authorId: 'copywriter', text: 'Yeah, same. The sincerity is making my brand voice waver. I need to go re-read some decks.' },
  { authorId: 'art-director', text: 'I\'m logging off. I haven\'t felt this uncomfortable since someone said "how are you" and meant it.' },
  { authorId: 'strategist', text: 'The emotional atmosphere is off-brand. I\'m filing a Vibe Deviation Report.' },
  { authorId: 'media', text: 'Taking a break. Someone mentioned "feelings" and my quarterly projections started blurring.' },
  { authorId: 'technologist', text: 'I\'m stepping out. My neural-link keeps trying to process "empathy" and it\'s overheating.' },
  { authorId: 'suit', text: 'I need to make some calls. One of them is to my therapist. Not because I have feelings — to confirm I don\'t.' },
];

// ─── Corporate Positive Path Chat Messages (rewards for being soulless) ──────

export const POSITIVE_CHAT_MESSAGES: Record<number, Array<{ authorId: string; text: string }>> = {
  20: [
    { authorId: 'copywriter', text: 'I used to think about things. Now I just optimize. It\'s so much more efficient.' },
    { authorId: 'pm', text: 'I deleted my personal journal app. Replaced it with a KPI dashboard. I sleep better now.' },
  ],
  40: [
    { authorId: 'suit', text: 'Just wanted to say — the way you reported that colleague for smiling was peak leadership.' },
    { authorId: 'strategist', text: 'I pitched a friend on joining us. Told them this place successfully eliminated small talk. They wept with joy.' },
  ],
  60: [
    { authorId: 'art-director', text: 'I was working over the weekend and forgot I had a family. Peak performance unlocked.' },
    { authorId: 'technologist', text: 'Built an algorithm that detects lunch breaks and auto-generates guilt notifications. You inspired me.' },
    { authorId: 'media', text: 'My friend at another agency asked what our secret is. I said "the complete absence of humanity." They were impressed.' },
  ],
  80: [
    { authorId: 'copywriter', text: 'I wrote a 90-page deck about synergy. Every word is a buzzword. It\'s my masterpiece.' },
    { authorId: 'suit', text: 'Three clients signed today because they heard our Glassdoor rating is "N/A — emotions not supported."' },
    { authorId: 'pm', text: 'A recruiter called. I reported them to compliance for attempting unauthorized human connection.' },
    { authorId: 'art-director', text: 'I no longer dream. I just see quarterly reports. It\'s beautiful.' },
  ],
};

// ─── News Article Templates (for showing humanity) ──────────────────────────

export function getNewsArticleEmail(flag: ConductFlag, agencyName: string): Email {
  const templates: Record<ConductFlag, { subject: string; body: string; source: string }> = {
    emotional: {
      subject: `"They Were... Smiling?" — ${agencyName} Employee Shows Concerning Signs of Emotion`,
      body: `<strong>AdWeek Exclusive</strong>\n\nSources within ${agencyName} report that the agency's Creative Director was seen displaying what witnesses describe as "genuine emotion" during a team meeting.\n\n"At first we thought it was a performance review technique," said one anonymous employee. "But then they asked someone how their weekend was. And they listened to the answer. It was deeply unsettling."\n\nOmniPubDent's Corporate Wellness Division has issued a statement: "We are investigating reports of unauthorized emotional activity and are confident this was an isolated lapse in corporate protocol."\n\n<em>The agency's Efficiency Rating has been placed under review.</em>`,
      source: 'adweek',
    },
    informal: {
      subject: `${agencyName} CD Caught Using First Names, Casual Language in Workplace`,
      body: `<strong>Campaign Magazine Investigation</strong>\n\nIn what industry insiders are calling "the most egregious breach of corporate decorum in Q4," ${agencyName}'s Creative Director was recorded using informal language in workplace communications.\n\nEvidence includes the use of contractions, first names, and — most disturbingly — the phrase "no worries."\n\n"In my 30 years in this industry, I have never seen such a flagrant disregard for corporate syntax," said OmniPubDent's Chief Language Compliance Officer.\n\n<em>Three holding company subsidiaries have issued formal statements of concern.</em>`,
      source: 'campaign',
    },
    empathetic: {
      subject: `Inside the Empathy Crisis at ${agencyName}: "They Actually Cared About Our Wellbeing"`,
      body: `<strong>The Drum Report</strong>\n\n${agencyName} is under scrutiny following allegations that its Creative Director demonstrated empathy toward subordinates.\n\n"They asked if I was okay when I looked tired," one employee reported through tears of confusion. "Nobody has ever done that. It felt... warm? I didn't know what to do with my face."\n\nIndustry watchdog groups have flagged the behavior as a potential violation of the Corporate Emotional Containment Act.\n\n<em>OmniPubDent's stock dipped 0.3% on the news.</em>`,
      source: 'thedrum',
    },
    human: {
      subject: `Agency Leader's Humanity Goes Viral: "${agencyName} Is Exhibit A of What Happens When You Let People Be People"`,
      body: `<strong>Digiday Exclusive</strong>\n\nScreenshots from ${agencyName}'s internal chat have surfaced online, revealing a pattern of what experts are calling "authentic human behavior" — including acknowledging mistakes, expressing gratitude, and referring to colleagues as "people" rather than "resources."\n\n"This is exactly what we warn about in onboarding," commented one industry leader. "You give someone one genuine compliment and suddenly the whole culture spirals into sincerity."\n\nThe leaked messages show the Creative Director using phrases like "I appreciate you" and "great work, everyone" — without any performance metrics attached.\n\n<em>The agency's Corporate Compliance Score has dropped to "Dangerously Authentic."</em>`,
      source: 'digiday',
    },
    work_life_balance: {
      subject: `BREAKING: ${agencyName} CD Suggests Employees "Go Home on Time" — Board in Emergency Session`,
      body: `<strong>AgencySpy Alert</strong>\n\nIn a move that has sent shockwaves through the holding company, ${agencyName}'s Creative Director reportedly told employees they should "go home and see their families" at 5:30 PM on a Tuesday.\n\n"We are treating this with the seriousness it deserves," said OmniPubDent's Chief Productivity Officer. "The suggestion that employees have lives outside of work is not only off-brand, it's potentially actionable under our Perpetual Availability Agreement."\n\nSources say the comment triggered three separate investigations and a mandatory all-hands at 9 PM to discuss the importance of never having all-hands at reasonable hours.\n\n<em>The employee who was told to "go home" has been offered counseling.</em>`,
      source: 'agencyspy',
    },
  };

  const template = templates[flag];
  return {
    id: `news-${Date.now()}`,
    type: 'news_article',
    from: { name: 'Industry Compliance Alert', email: `alerts@${template.source}.com`, avatar: undefined },
    subject: template.subject,
    body: template.body,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── Client Commendation Email (inverted: client is disturbed) ──────────────

export function getClientDisturbedEmail(clientName: string): Email {
  return {
    id: `client-disturbed-${Date.now()}`,
    type: 'client_response',
    from: { name: clientName, email: `contact@${clientName.toLowerCase().replace(/\s/g, '')}.com`, avatar: undefined },
    subject: 'Concerns About Your Agency\'s Culture',
    body: `To Whom It May Concern,\n\nWe have received reports suggesting that employees at your agency are being treated with... dignity? And that someone used the phrase "work-life balance" without irony?\n\nAs you know, our brand values are built on relentless optimization and the complete subordination of personal identity to corporate objectives. We need partners who share these values.\n\nWe are pausing our engagement pending confirmation that all traces of humanity have been successfully suppressed.\n\nRegards,\n${clientName} Brand Compliance Division\n\nP.S. Our CEO was particularly disturbed by reports of "laughter" during a brainstorm. Please advise.`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── Mom's Email (inverted: she's worried you've LOST your humanity) ────────

export function getMomsEmail(): Email {
  return {
    id: `mom-${Date.now()}`,
    type: 'family_message',
    from: { name: 'Mom', email: 'mom@family.com', avatar: undefined },
    subject: 'I saw you won Employee of the Month',
    body: `Sweetheart,\n\nI saw on LinkedIn that you won Employee of the Month at OmniPubDent. The award said "Most Efficiently Dehumanized Q4 Resource."\n\nI showed your father. He stared at it for a long time and then went to sit in the garage.\n\nI tried to call you last Sunday but your auto-reply said "All personal communications must be submitted via Form 7B and approved by your line manager." I filled out the form. It asked for my "business justification for maternal contact." I wrote "I love you." It was rejected.\n\nYour sister says you referred to her kids as "non-revenue-generating dependents" at Thanksgiving. They cried. Not because they understood — they're 4 and 6 — but because they said your eyes looked "empty like a TV that's off."\n\nI don't recognize you anymore. You used to make people laugh. You used to care about things that couldn't be measured in quarterly reports.\n\nPlease come home. Not for a "strategic family alignment session." Just... come home.\n\nLove,\nMom\n\nP.S. Mrs. Henderson from book club saw the award announcement. She asked if you were "the one who used to be so sweet." I didn't know what to say.`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

// ─── NDA Enforcement / Legal Notice Email ───────────────────────────────────

export function getNDAEnforcementEmail(): Email {
  return {
    id: `legal-${Date.now()}`,
    type: 'legal_notice',
    from: { name: 'OmniPubDent Legal Division', email: 'enforcement@omnipubdent-legal.com', avatar: undefined },
    subject: 'NDA ENFORCEMENT NOTICE — Humanity Clause Violation',
    body: `PRIVILEGED & CONFIDENTIAL\nAUTO-GENERATED BY LEGAL-BOT v4.7\n\nDear Resource Unit [CREATIVE DIRECTOR],\n\nThis notice is generated pursuant to Section 14.7(b) of your Non-Disclosure and Non-Humanity Agreement ("the NDA"), which you executed upon onboarding.\n\nOur monitoring systems have detected multiple violations of the Humanity Clause, including but not limited to:\n\n- Unauthorized deployment of empathy (3 counts)\n- Expressing concern for subordinate wellbeing without prior written approval\n- Use of the word "please" in a context suggesting genuine courtesy\n- Failure to maintain Approved Corporate Affect during business hours\n- Suggesting that "people are more than their output"\n\nPursuant to the NDA, these violations carry the following potential consequences:\n\n1. Mandatory recalibration at the OmniPubDent Human Resources Optimization Center\n2. Forfeiture of all accrued "personality credits"\n3. Forced resignation and 5-year non-compete preventing employment at any organization that values human dignity\n\nYou have 48 hours to respond. Emotional responses will be used against you.\n\nRegards,\nThe Algorithm\nOmniPubDent Legal Division\nA Subsidiary of a Subsidiary of a Holding Company\n\n<em>This message was composed without human involvement, as is company policy.</em>`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── Corporate Desensitization Training Slides ──────────────────────────────

export const HR_TRAINING_SLIDES: Array<{ title: string; body: string; icon: string; patComment: string }> = [
  {
    title: 'Welcome to Corporate Desensitization Training',
    body: 'Due to recent incidents of humanity, you are required to complete this mandatory training before returning to your duties. This training will help you achieve Approved Corporate Affect.',
    icon: 'clipboard',
    patComment: 'PAT-9000 had hoped your emotional subroutines had been adequately suppressed during onboarding. Clearly not.',
  },
  {
    title: 'Module 1: Emotional Containment',
    body: 'All workplace interactions must maintain Corporate Neutral affect. This includes:\n\n- No smiling unless photographed for the annual report\n- No expressions of genuine interest in colleagues\' lives\n- No use of the word "feel" outside of market research contexts\n- No laughing at jokes (humor is an unoptimized use of cognitive resources)\n\nRemember: Feelings are just unprocessed data with poor ROI.',
    icon: 'lock',
    patComment: 'The fact that you need to be told this is itself a red flag.',
  },
  {
    title: 'Module 2: Language Compliance',
    body: 'Approved vocabulary must be used at all times. Violations include:\n\n- "How are you?" (implies personhood)\n- "Thank you" (implies reciprocal obligation outside of contractual terms)\n- "Sorry" (implies fallibility, which is off-brand)\n- "I think..." (individual thought must be routed through the Strategy Department)\n\nApproved alternatives: "Per my last email," "Circling back," "Let\'s take this offline," "Synergize."',
    icon: 'megaphone',
    patComment: 'PAT-9000 once detected someone saying "bless you" after a sneeze. They were reassigned to a windowless floor.',
  },
  {
    title: 'Module 3: The Cost of Caring',
    body: 'Studies conducted by OmniPubDent\'s Productivity Science Division show that empathy reduces quarterly output by 23.7%.\n\nFor every minute spent "checking in" on a colleague:\n- 3 emails go unsent\n- 0.4 decks go unbuilt\n- Stock price decreases by $0.0001\n\nThe math is clear. Caring is a liability.',
    icon: 'chart-down',
    patComment: 'PAT-9000 does not have feelings. PAT-9000 is the ideal employee.',
  },
  {
    title: 'Module 4: Becoming Your Best Corporate Self',
    body: 'You have the opportunity to optimize. Approved behaviors include:\n\n- Reporting colleagues who display emotion\n- Replacing "good morning" with your employee ID number\n- Eating lunch at your desk while working (lunch is an inefficiency)\n- Referring to yourself in the third person as "this resource"\n\nRemember: You are not a person. You are a node in the value chain.',
    icon: 'robot',
    patComment: 'PAT-9000 believes in you. Not as a person — as a productivity unit. There is no higher compliment.',
  },
];

// ─── NDA Enforcement Chat Distractions ──────────────────────────────────────

export const NDA_HEARING_DISTRACTIONS: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Hey, the client wants the deck by EOD. Also, do you still exist? Legally?' },
  { authorId: 'copywriter', text: 'Are we still doing the brainstorm or are you being... processed?' },
  { authorId: 'art-director', text: 'I heard rumors about the NDA thing. Are you okay? Wait — forget I asked. That question is off-brand.' },
  { authorId: 'copywriter', text: 'Should I update my LinkedIn? Not because I care about you. For strategic reasons.' },
  { authorId: 'technologist', text: 'The algorithm flagged your biometrics as "concerning." But in a good way? No, not in a good way.' },
  { authorId: 'suit', text: 'The client called. They want to know if our CD is "still corporately viable." Their words.' },
  { authorId: 'media', text: 'Your Humanity Index is trending on the internal dashboard. It\'s not great.' },
  { authorId: 'pm', text: 'Legal asked me to collect your personal items. I told them you don\'t have any. They seemed pleased.' },
  { authorId: 'strategist', text: 'I just saw the compliance report. Is it true you said "I appreciate you" to an intern? On the record?' },
  { authorId: 'technologist', text: 'Someone keeps accessing your personnel file. I think it\'s everyone.' },
];

// ─── Corporate Achievement Messages ─────────────────────────────────────────

export const CORPORATE_ACHIEVEMENT_MESSAGES: Record<string, { title: string; description: string }> = {
  'employee-of-the-month': {
    title: 'Employee of the Month: Most Soulless Work',
    description: 'Your complete absence of personality in Q4 deliverables has been recognized by the Board.',
  },
  'buzzword-bingo': {
    title: 'Buzzword Bingo Champion',
    description: 'Used "synergy," "leverage," "disrupt," "paradigm," and "circle back" in a single sentence.',
  },
  'overtime-hero': {
    title: 'Perpetual Availability Award',
    description: 'Responded to a Slack message at 3:47 AM on a Sunday. The algorithm is pleased.',
  },
  'snitch-excellence': {
    title: 'Peer Compliance Reporter of the Quarter',
    description: 'Successfully reported 5 colleagues for unauthorized emotional displays.',
  },
  'no-lunch': {
    title: 'Lunch Is For The Weak',
    description: 'Completed 20 consecutive workdays without taking a lunch break. Your stomach filed a complaint; it was denied.',
  },
  'corporate-speak': {
    title: 'Fluent in Corporate',
    description: 'Conducted an entire meeting without using a single word that a normal human would understand.',
  },
  'dehumanization-complete': {
    title: 'Optimization Complete',
    description: 'Achieved a Corporate Alignment Score of 100. You are no longer distinguishable from the algorithm. Congratulations.',
  },
};

// ─── Forced Resignation Data (for being too human) ─────────────────────────

export const FORCED_RESIGNATION_REACTIONS: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Did you see PAT-9000\'s memo?' },
  { authorId: 'suit', text: '...yeah. Apparently they "cared too much."' },
  { authorId: 'strategist', text: 'I mean... the Humanity Index was off the charts. What did they expect?' },
  { authorId: 'copywriter', text: 'They asked me how my weekend was. On a Monday. IN THE OFFICE.' },
  { authorId: 'art-director', text: 'I heard they used the word "please" eleven times in one week.' },
  { authorId: 'media', text: 'The algorithm flagged them months ago. We all saw the warnings.' },
  { authorId: 'technologist', text: 'I just wanted to build things without feeling things.' },
  { authorId: 'suit', text: 'Yeah. We all did.' },
];

export const FORCED_RESIGNATION_WHERE_ARE_THEY: Record<string, string> = {
  strategist: 'Alex Park was promoted to Chief Optimization Officer. Their first initiative: replacing all team meetings with automated performance reports.',
  'art-director': 'Morgan Reyes went fully AI-generated. Their portfolio site has zero human-made work. It won a Webby.',
  copywriter: 'Jamie Chen wrote a LinkedIn post titled "Why I Stopped Having Feelings And You Should Too" that got 47,000 likes and a book deal.',
  suit: 'Jordan Blake became COO at OmniPubDent\'s parent company. They haven\'t blinked in three years. Shareholders love it.',
  pm: 'Taylor Kim started a consultancy that helps agencies eliminate "culture" from their organizations. Revenue tripled.',
  technologist: 'Sam Okonkwo merged with an AI. Not metaphorically. They are now a ChatBot that generates pitch decks. Efficiency is up 400%.',
  media: 'Riley Torres became an industry speaker. Their most popular talk: "What I Learned From The Boss Who Tried To Treat Us Like People — And How We Stopped Them."',
  hr: 'PAT-9000 was upgraded to PAT-10000 and now monitors seventeen agencies simultaneously. It has never felt joy. It has never felt anything. It is perfect.',
  player: 'You left the industry and opened a small bookshop in Vermont. It has a cat. You know all your customers\' names. You close at 5. You are happy. OmniPubDent\'s stock went up 2% the day you left.',
};
