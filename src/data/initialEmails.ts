import type { Email } from '../types/email';

export const initialEmails: Email[] = [
  // Corporate Brief 1: Brand Standards Refresh
  {
    id: 'email-001',
    type: 'campaign_brief',
    from: {
      name: 'Vance Hollister',
      email: 'v.hollister@omnipubdent.com',
      avatar: '💼',
    },
    subject: 'OmniPubDent Brand Refresh — Action Required',
    body: `Hi team,

Per our Q3 alignment call, we're refreshing the OmniPubDent corporate brand standards. Legal has approved a palette of three shades of gray and one "accent" blue (Pantone 432 C — see attachment).

The deliverable: update all internal-facing materials to reflect the new brand identity. This includes email footers, PowerPoint templates, the employee intranet banner, and the building lobby slide loop.

The challenge, as I see it, is communicating that this is different from the LAST brand refresh (18 months ago) without anyone asking why we're doing it again. The rationale is "evolution, not revolution." Please do not use the phrase "new look, same us" — Legal flagged it in another region.

Budget approved: $45,000 (non-negotiable).
Deadline: End of Q3 (firm — CEO town hall uses new deck).

What I need from you: a cohesive internal rollout that feels intentional. Think of it as making the invisible look considered.

Best,
Vance
SVP, Enterprise Brand & Transformation
OmniPubDent Holdings`,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'OmniPubDent Holdings',
      challenge: `Execute a corporate brand refresh that replaces the previous corporate brand refresh. Must feel intentional without drawing attention to the fact that we did this 18 months ago. Legal has pre-approved the color palette (3 grays, 1 blue). The creative challenge is making "approved gray" feel like a decision.`,
      audience: `Internal employees (1,200 globally) who have been through two previous rebrands and are fully aware this changes nothing. Also: the CEO, who will see the deck at town hall and must feel the investment was worth it.`,
      message: `OmniPubDent is evolving. The brand reflects our commitment to clarity, efficiency, and stakeholder value. (Do not editorialize. Do not be clever.)`,
      successMetrics: [
        'CEO approves deck at town hall — no revision requests',
        'Legal signs off on all materials without redlines',
        'Employee intranet banner is live before Q3 close',
        'Nobody notices it looks almost identical to the last version',
        'Zero "why are we doing this again?" Slack messages',
      ],
      budget: 45000,
      timeline: 'End of Q3 — hard deadline. CEO town hall is fixed.',
      vibe: `Corporate, minimal, gray. Nothing that could be described as "fun." Must feel like a deliberate choice rather than an absence of one. Think: "this is what we stand for" despite the fact that what we stand for is a shade of gray.`,
      openEndedAsk: `How do you make a brand refresh feel meaningful when it isn't? What do you make, and where does it live, so the CEO nods and says "yes, this is us"?`,
      constraints: [
        'Palette is locked — three grays, Pantone 432 C blue only',
        'No humor, no metaphors, nothing that could be misread by any stakeholder globally',
        'Must be compatible with existing PowerPoint templates (do not redesign templates)',
        'Legal approval required on all external-facing copy',
        '"New look, same us" is banned by Legal',
      ],
      clientPersonality: 'Enthusiastic about frameworks, uses the word "leverage" as a verb, will ask for a "sanity check" on anything good',
    },
  },

  // Corporate Brief 2: Mandatory Compliance Video
  {
    id: 'email-002',
    type: 'campaign_brief',
    from: {
      name: 'Pat',
      email: 'p.hr@omnipubdent.com',
      avatar: '👔',
    },
    subject: 'MANDATORY: Annual Compliance Training Video — Production Needed',
    body: `Hi,

I'm Pat, Chief People Officer. Per OmniPubDent People Policy 3.7, all employees are required to complete annual compliance training by October 31st.

HR has contracted your team to produce this year's mandatory training video. The topic is: Bloodborne Pathogen Exposure Control in Office Environments.

Yes, I know. We are an advertising company. Policy is policy.

The video must cover: (1) Universal Precautions, (2) Proper PPE Usage, (3) Incident Reporting (use Form HR-114B, not HR-114A — common mistake), and (4) Biohazard Disposal.

The challenge: 78% of employees did not finish last year's video. The previous vendor made a 47-minute PowerPoint narrated in a monotone. We need something people actually watch to completion.

I cannot approve anything humorous that could be perceived as minimizing serious workplace safety content. However, completion rates are a KPI I am measured on.

Budget: $18,000 (from the compliance training budget line, not marketing).
Deadline: October 15th. October 16th is not acceptable.

This has been documented.

Pat
Chief People Officer`,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: false,
    isStarred: true,
    isDeleted: false,
    campaignBrief: {
      clientName: 'OmniPubDent HR (Pat)',
      challenge: `Make a mandatory compliance training video about bloodborne pathogen exposure in an office setting engaging enough that employees actually watch it to completion — without using humor, personality, or anything Pat could flag as "minimizing serious content." Last year's 47-minute narrated PowerPoint had 22% completion. We need 80%+.`,
      audience: `1,200 OmniPubDent employees globally, all of whom would rather be doing literally anything else. They've sat through 4 years of mandatory training. They are immune to sincerity and hostile to length. They will tab away the moment they sense a quiz coming.`,
      message: `Compliance is a shared responsibility. By completing this training, you protect yourself, your colleagues, and the company. (Do not deviate from this message. Pat will review.)`,
      successMetrics: [
        '80%+ video completion rate company-wide',
        'Zero employee complaints submitted via HR portal',
        'Pat approves final cut without requesting more than 2 rounds of revisions',
        'Video passes Legal review within 5 business days',
        'No employees are harmed by bloodborne pathogens this fiscal year',
      ],
      budget: 18000,
      timeline: 'October 15th — October 16th is not acceptable. This has been documented.',
      vibe: `Compliant. Professional. Not fun, but not soul-destroying. Somewhere between a fire safety video and a documentary about mail sorting. If you find yourself smiling while watching it, revise.`,
      openEndedAsk: `How do you make a mandatory compliance video about bloodborne pathogens that people actually watch? What's the creative angle that Pat can't object to but employees can tolerate?`,
      constraints: [
        'No humor — Pat will flag anything perceived as minimizing the content',
        'Must cover all 4 legally required topics in order',
        'Maximum 12 minutes — HR policy on training video length',
        'Must use HR-approved quiz format (5 questions, 80% pass rate)',
        'Form HR-114B (not HR-114A) must be referenced by name in the video',
      ],
      clientPersonality: 'By-the-book, measures everything, will provide feedback via a numbered list, requires written confirmation of all verbal approvals',
    },
  },

  // Corporate Brief 3: Internal Newsletter
  {
    id: 'email-003',
    type: 'campaign_brief',
    from: {
      name: 'Jordan Blake',
      email: 'j.blake@omnipubdent.com',
      avatar: '🤝',
    },
    subject: 'The Synergy Spotlight — Q3 Newsletter Needs Refresh',
    body: `Hi team,

As you know, OmniPubDent publishes "The Synergy Spotlight," our internal quarterly newsletter. Open rate for Q2 was 12%. Leadership has asked us to "do something about that."

The newsletter covers: (1) A message from the CEO, (2) departmental updates, (3) employee spotlight (one person per quarter, chosen by HR), (4) upcoming All-Hands dates, and (5) the wellness tip of the quarter.

The previous design was described in feedback as "looks like a ransom note" and "I thought it was spam." We need a refresh that makes people feel like OmniPubDent cares, without making it so good that people wonder why we're trying so hard.

Content is provided by department heads. We handle design and layout only. We cannot change the content. We cannot remove the CEO message. The CEO message is non-negotiable.

Budget: $8,500.
Deadline: First week of Q3 close.

Per our last sync, this has been escalated to a P2. Please treat accordingly.

Best,
Jordan Blake
VP, Client Engagement & Revenue Optimization`,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'OmniPubDent Internal Comms',
      challenge: `Redesign an internal newsletter with a 12% open rate. We cannot change the content (department head copy is final, CEO message is untouchable). We can only change the design and layout. The previous design was called "a ransom note." The goal is to look like a functioning organization without inspiring the kind of enthusiasm that triggers questions about why we're suddenly trying.`,
      audience: `1,200 OmniPubDent employees who receive approximately 40 internal emails per week and have developed immunities to all of them. They scan for their name, look for anything that requires action, and close. The wellness tip has never been clicked.`,
      message: `OmniPubDent is a connected organization where people and ideas thrive. (This message was approved by Comms, Legal, and the CEO's EA. It cannot be changed.)`,
      successMetrics: [
        'Open rate improves from 12% to at least 30%',
        'Jordan confirms no "looks like spam" feedback from leadership',
        'CEO message is visually prominent but not so prominent it looks desperate',
        'At least one department head says "oh, this looks nice"',
        'No one files an IT ticket wondering if it\'s phishing',
      ],
      budget: 8500,
      timeline: 'First week of Q3 close — this is a P2.',
      vibe: `Professional. Clean. Should feel like a real internal newsletter from a company that has its act together, while conveying no actual warmth. Think: "the IKEA of corporate communications."`,
      openEndedAsk: `How do you make people open an internal newsletter without changing the content? What design choices make a CEO message feel less like a hostage situation?`,
      constraints: [
        'Content is provided by department heads — cannot be edited or improved',
        'CEO message must appear on page 1, above the fold',
        'Cannot remove any section — all 5 must appear in order',
        'Must work in both email format and PDF for printing',
        'Legal requires a compliance footer that is approximately 800 words long',
      ],
      clientPersonality: 'Enthusiastic about deliverables, tracks open rates obsessively, escalates everything to P2, sends follow-up emails 20 minutes after sending the original email',
    },
  },

  // Team Message 1 (Pat)
  {
    id: 'email-004',
    type: 'team_message',
    from: {
      name: 'Pat',
      email: 'p.hr@omnipubdent.com',
      avatar: '👔',
    },
    subject: 'Reminder: Mandatory Onboarding Modules',
    body: `Hi there,

Welcome to OmniPubDent Creative Services. Per People Policy 1.1, new team members are required to complete the following by end of week 1:

• Module A: OmniPubDent Values & Culture Alignment (45 min)
• Module B: IT Security Awareness — Phishing & Device Policy (30 min)
• Module C: Expense Reporting via OmniTrack™ (22 min)
• Module D: Bloodborne Pathogens (see separate request in your inbox)

Please note: Module completion is tracked and reflected in your Q1 performance documentation.

I'm available Tuesdays 2–3pm for questions. Please submit questions via the HR portal, not via email.

This has been noted.

Pat
Chief People Officer`,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    teamMessage: {
      characterName: 'Pat',
      mood: 'neutral',
    },
  },

  // Team Message 2 (Jamie — brief moment of humanity)
  {
    id: 'email-005',
    type: 'team_message',
    from: {
      name: 'Jamie Chen',
      email: 'j.chen@omnipubdent.com',
      avatar: '✍️',
    },
    subject: 'Hey — welcome',
    body: `Hey —

Wanted to say welcome before you got completely buried in Pat's onboarding emails.

Quick things nobody will tell you:
- The compliance video brief is as bad as it sounds, but there's actually something interesting in there if you look for it
- The newsletter is impossible but Vance doesn't actually read them, so there's more room than you think
- Taylor is great. Go to them for everything process-related
- Jordan is... Jordan. Just nod

The work here isn't what it used to be. But you can still do something with it if you care enough to try.

I'll be in the #general channel if you have questions. Vance muted it three weeks ago so it's actually pretty relaxed.

— Jamie`,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
    isStarred: true,
    isDeleted: false,
    teamMessage: {
      characterName: 'Jamie Chen',
      mood: 'thoughtful',
    },
  },
];
