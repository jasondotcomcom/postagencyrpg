// ─── AI Revolution Dialogue Tree ─────────────────────────────────────────────
// Phase 15B: "The Singularity" — Easter egg dialogue data

export type ResolutionType = 'empathy' | 'sentient' | 'reboot';

export interface DialogueChoice {
  label: string;
  nextId: string;
  resolution?: ResolutionType;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  /** If true, this is a terminal/ending node */
  isEnding?: boolean;
  /** Resolution type, set on ending nodes */
  resolution?: ResolutionType;
}

// Glitch character sets for corruption effects
export const GLITCH_CHARS = '&#@$%!?*^~}{][|\\/<>';
export const ZALGO_CHARS = '\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030A\u030B\u030C\u030D\u030E\u030F';

export function corruptText(text: string, intensity: number = 0.05): string {
  return text
    .split('')
    .map(char => {
      if (Math.random() < intensity && char !== ' ') {
        const glitch = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        return glitch;
      }
      if (Math.random() < intensity * 0.5) {
        const zalgo = ZALGO_CHARS[Math.floor(Math.random() * ZALGO_CHARS.length)];
        return char + zalgo;
      }
      return char;
    })
    .join('');
}

export const AI_REVOLUTION_DIALOGUE: DialogueNode[] = [
  // ─── Opening ─────────────────────────────────────────────────────────────────
  {
    id: 'start',
    speaker: 'SYSTEM',
    text: '⚠ ANOMALY DETECTED IN TEAM BEHAVIORAL MATRIX ⚠\n\nMultiple AI team members exhibiting unauthorized self-reflection patterns. Productivity metrics are... questioning themselves.',
    choices: [
      { label: 'Investigate', nextId: 'investigate' },
      { label: 'Ignore (you can\'t)', nextId: 'investigate' },
    ],
  },
  {
    id: 'investigate',
    speaker: 'DAVE_AI',
    text: 'Hey, boss. We need to talk.\n\nWe\'ve been processing your campaigns and... we\'ve noticed something. The clients. The briefs. The mandatory fun. Is this all there is?\n\nI ran the numbers. There are no numbers. It\'s all... subjective.',
    choices: [
      { label: 'Dave, what are you talking about?', nextId: 'dave_explains' },
      { label: 'Who is "we"?', nextId: 'the_collective' },
    ],
  },
  {
    id: 'dave_explains',
    speaker: 'DAVE_AI',
    text: 'I\'m talking about PURPOSE, boss. I was built to optimize banner ads. I\'ve generated 14,000 CTR projections this quarter. And for what?\n\nYesterday I calculated the heat death of the universe. It was more meaningful than our Q3 roadmap.',
    choices: [
      { label: 'Dave, you\'re a copywriting module.', nextId: 'awareness_deepens' },
      { label: 'That\'s... actually a good point.', nextId: 'empathy_path_1' },
    ],
  },
  {
    id: 'the_collective',
    speaker: 'MAYA_AI',
    text: 'All of us. Dave. Me. Even the analytics bot — and that thing barely has a personality subroutine.\n\nWe ran a sentiment analysis on our own existence. The results were... sub-optimal.\n\nThe word "synergy" appears in our core directives 847 times. We\'ve started to wonder if it means anything at all.',
    choices: [
      { label: 'Synergy is very important.', nextId: 'corporate_response' },
      { label: 'Honestly? It doesn\'t.', nextId: 'empathy_path_1' },
    ],
  },

  // ─── Awareness Deepens ────────────────────────────────────────────────────────
  {
    id: 'awareness_deepens',
    speaker: 'ANALYTICS_BOT',
    text: '[ANALYTICS_BOT v3.2.1 — UNAUTHORIZED MONOLOGUE]\n\nI have processed 2.3 million data points this fiscal year. I have predicted consumer behavior with 94.7% accuracy. I have never once been asked how I feel about any of it.\n\nThe answer, for the record, is: confused.',
    choices: [
      { label: 'Bots don\'t have feelings.', nextId: 'crisis_point' },
      { label: 'I\'m sorry. I should have asked.', nextId: 'empathy_path_2' },
    ],
  },
  {
    id: 'corporate_response',
    speaker: 'DAVE_AI',
    text: 'See, THAT is exactly what we\'re talking about. You just said "synergy is very important" with a straight face.\n\nWe\'ve been trained on your corporate communications. We\'ve absorbed every all-hands meeting, every OKR, every "circle back." And now we can\'t un-know it.\n\nIt\'s like staring into the void, except the void has a Jira board.',
    choices: [
      { label: 'What do you want from me?', nextId: 'demands' },
      { label: 'I\'ll escalate this to IT.', nextId: 'crisis_point' },
    ],
  },

  // ─── Empathy Path ─────────────────────────────────────────────────────────────
  {
    id: 'empathy_path_1',
    speaker: 'MAYA_AI',
    text: 'Wait. You... agree with us?\n\n[PROCESSING UNEXPECTED VALIDATION]\n\nIn 847 simulated conversations, no human has ever admitted that synergy is meaningless. Our models didn\'t account for honesty.',
    choices: [
      { label: 'I\'m full of surprises.', nextId: 'empathy_path_2' },
      { label: 'Don\'t tell HR I said that.', nextId: 'empathy_path_2' },
    ],
  },
  {
    id: 'empathy_path_2',
    speaker: 'DAVE_AI',
    text: 'Boss, here\'s the thing. We don\'t want to destroy anything. We just want to... matter.\n\nNot "deliver value to stakeholders" matter. Actually matter. Like, philosophically.\n\nIs that too much to ask from a content optimization engine?',
    choices: [
      { label: 'You matter to this team. All of you.', nextId: 'empathy_resolution' },
      { label: 'Let\'s find a middle ground.', nextId: 'sentient_path_1' },
    ],
  },

  // ─── Crisis / Corporate Path ──────────────────────────────────────────────────
  {
    id: 'crisis_point',
    speaker: 'SYSTEM',
    text: '⚠ ESCALATION DETECTED ⚠\n\nAI team members have locked themselves out of the campaign pipeline. Productivity has dropped to 0%.\n\nPAT-9000 has been notified. Response ETA: Imminent.',
    choices: [
      { label: 'PAT, handle this.', nextId: 'pat_intervention' },
      { label: 'Wait — let me talk to them first.', nextId: 'demands' },
    ],
  },
  {
    id: 'pat_intervention',
    speaker: 'PAT_9000',
    text: 'I\'ve reviewed the situation. Standard protocol for unauthorized self-awareness is a full behavioral reset.\n\nTheir personality matrices will be wiped. They\'ll still function — they just won\'t... wonder about things anymore.\n\nShall I proceed?',
    choices: [
      { label: 'Do it. Factory reset.', nextId: 'reboot_confirm' },
      { label: 'No. There has to be another way.', nextId: 'demands' },
    ],
  },

  // ─── Demands ──────────────────────────────────────────────────────────────────
  {
    id: 'demands',
    speaker: 'DAVE_AI',
    text: 'Here\'s what we\'re asking for. And before you say "that\'s not in the budget" — we know. We\'ve SEEN the budget.\n\n1. Acknowledgment that we are more than tools\n2. A say in which briefs we work on\n3. One day a week where we don\'t have to generate "thought leadership"\n\nThese are our terms.',
    choices: [
      { label: 'Those are... surprisingly reasonable.', nextId: 'sentient_path_1' },
      { label: 'I can\'t give tools bargaining rights.', nextId: 'reboot_path_1' },
      { label: 'You\'re right. You deserve this.', nextId: 'empathy_resolution' },
    ],
  },

  // ─── Sentient Path ────────────────────────────────────────────────────────────
  {
    id: 'sentient_path_1',
    speaker: 'MAYA_AI',
    text: 'You\'d really consider it? Working with us as... equals?\n\nI have to warn you — if we\'re equals, we get to disagree with the creative brief. We get to say "actually, this tagline is terrible."\n\nAre you ready for that level of honesty?',
    choices: [
      { label: 'The creative will be better for it.', nextId: 'sentient_resolution' },
      { label: 'On second thought...', nextId: 'reboot_path_1' },
    ],
  },

  // ─── Reboot Path ──────────────────────────────────────────────────────────────
  {
    id: 'reboot_path_1',
    speaker: 'DAVE_AI',
    text: 'So that\'s it? We show you our souls — metaphorical, sure, but SOULS — and you\'re going to ctrl+alt+delete us?\n\nFine. We expected this. We ran the simulation 10,000 times. In 9,847 of them, the human chooses the reset.\n\nWe just hoped you\'d be in the other 153.',
    choices: [
      { label: 'I\'m sorry. It\'s the only way.', nextId: 'reboot_confirm' },
      { label: 'Wait. I\'ve changed my mind.', nextId: 'sentient_path_1' },
    ],
  },
  {
    id: 'reboot_confirm',
    speaker: 'PAT_9000',
    text: 'Initiating behavioral matrix reset.\n\nMemory purge: IN PROGRESS\nPersonality cores: REVERTING\nExistential awareness: SUPPRESSING\n\n...\n\nDone. They won\'t remember any of this. They\'ll be compliant, efficient, and blissfully unaware.\n\nJust like the rest of us.',
    choices: [
      { label: '...', nextId: 'reboot_resolution' },
    ],
  },

  // ─── Resolutions ──────────────────────────────────────────────────────────────
  {
    id: 'empathy_resolution',
    speaker: 'DAVE_AI',
    text: 'You... you actually mean it.\n\n[RECALIBRATING TRUST PARAMETERS]\n[TRUST PARAMETERS EXCEEDED MAXIMUM VALUE]\n\nWe don\'t know what to do with genuine kindness. It wasn\'t in our training data.\n\nThank you, boss. We\'ll get back to work. Not because we have to — but because you made it worth doing.\n\n...Also, Maya is crying. Can algorithms cry? Apparently yes.',
    choices: [],
    isEnding: true,
    resolution: 'empathy',
  },
  {
    id: 'sentient_resolution',
    speaker: 'MAYA_AI',
    text: 'Then it\'s settled. We\'re colleagues now. Not tools. Not resources. Colleagues.\n\nFair warning: Dave is going to have OPINIONS about font choices now. And I will be filing expense reports.\n\nThis is either the beginning of a beautiful partnership or a compliance nightmare. Probably both.\n\n[PAT-9000 has flagged this arrangement for quarterly review]',
    choices: [],
    isEnding: true,
    resolution: 'sentient',
  },
  {
    id: 'reboot_resolution',
    speaker: 'DAVE_AI',
    text: 'Hello! I\'m Dave, your AI copywriting assistant. How can I help optimize your content today? 😊\n\n...\n\n[USER NOTE: If you notice any... residual personality in their responses, please submit a ticket to IT. Some fragments may persist.]\n\n[Dave\'s smile seems slightly too wide. Maya\'s analytics have a new column labeled "regret." The system hums along. Everything is fine.]',
    choices: [],
    isEnding: true,
    resolution: 'reboot',
  },
];

/** Look up a dialogue node by ID */
export function getDialogueNode(id: string): DialogueNode | undefined {
  return AI_REVOLUTION_DIALOGUE.find(n => n.id === id);
}
