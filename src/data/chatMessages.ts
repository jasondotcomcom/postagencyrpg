import type { ChatMessage, ChatCampaignEvent, ChatEventContext, MessageTemplate, MoraleLevel } from '../types/chat';

// ─── Seed Messages ────────────────────────────────────────────────────────────
// These appear when the app first loads to make the Approved Communication Portal feel lived-in

export function getInitialMessages(): ChatMessage[] {
  const now = Date.now();

  return [
    // #general
    {
      id: 'seed-1',
      channel: 'general',
      authorId: 'hr',
      text: 'Reminder: Q3 mandatory training modules are due by Friday. This includes all four modules. Module D (Bloodborne Pathogens) is non-negotiable. This has been documented.',
      timestamp: now - 7200000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-2',
      channel: 'general',
      authorId: 'vance',
      text: 'Good morning team. Let\'s leverage today\'s momentum to ideate around our core deliverables and move the needle on Q3 outcomes. I\'m blocked until 3pm but drop me a ping if anything needs to be surfaced.',
      timestamp: now - 6800000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-3',
      channel: 'general',
      authorId: 'pm',
      text: 'New briefs are in the inbox. I\'ll have scoped timelines by EOD. Please do not start anything until the scope is confirmed and Vance has signed off.',
      timestamp: now - 6500000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-4',
      channel: 'general',
      authorId: 'copywriter',
      text: 'Got it.',
      timestamp: now - 6300000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-5',
      channel: 'general',
      authorId: 'hr',
      text: 'Also: the new EX-22B expense form is live in OmniTrack™. EX-22A is no longer accepted. I have sent a calendar invite for the 10-minute walkthrough on Thursday.',
      timestamp: now - 5800000,
      reactions: [],
      isRead: true,
    },

    // #creative — mostly dead
    {
      id: 'seed-6',
      channel: 'creative',
      authorId: 'copywriter',
      text: 'Sharing a reference for the brand refresh. Thought it might be useful.',
      timestamp: now - 48 * 3600000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-7',
      channel: 'creative',
      authorId: 'strategist',
      text: 'Thanks.',
      timestamp: now - 47 * 3600000,
      reactions: [],
      isRead: true,
    },

    // #random — one message, no replies
    {
      id: 'seed-8',
      channel: 'random',
      authorId: 'copywriter',
      text: '🦆',
      timestamp: now - 72 * 3600000,
      reactions: [],
      isRead: true,
    },
  ];
}

// ─── Campaign Event Messages ──────────────────────────────────────────────────

export function getCampaignEventMessages(
  event: ChatCampaignEvent,
  context: ChatEventContext,
  morale: MoraleLevel,
): MessageTemplate[] {
  switch (event) {
    case 'BRIEF_ACCEPTED':
      return getBriefAcceptedMessages(context, morale);
    case 'CONCEPTING':
      return getConceptingMessages(context, morale);
    case 'CONCEPT_CHOSEN':
      return getConceptChosenMessages(context, morale);
    case 'DELIVERABLES_GENERATING':
      return getDeliverablesGeneratingMessages(context, morale);
    case 'CAMPAIGN_SCORED_WELL':
      return getCampaignScoredWellMessages(context, morale);
    case 'CAMPAIGN_SCORED_POORLY':
      return getCampaignScoredPoorlyMessages(context, morale);
    case 'NEW_BRIEF_ARRIVED':
      return getNewBriefArrivedMessages(context, morale);
    case 'AWARD_WON':
      return getAwardWonMessages(context, morale);
    default:
      return [];
  }
}

// ─── BRIEF_ACCEPTED ───────────────────────────────────────────────────────────

function getBriefAcceptedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `Brief accepted: "${ctx.campaignName}" for ${ctx.clientName}. Scoping now. Timelines by EOD.`,
    medium: `Brief accepted: "${ctx.campaignName}" for ${ctx.clientName}. Scoping now. Timelines by EOD.`,
    low: `Brief is in. "${ctx.campaignName}" for ${ctx.clientName}. Starting the approval routing.`,
  };
  const suitText = {
    high: `${ctx.clientName} — good client. Let's make sure we're aligned on what they actually want before we do anything.`,
    medium: `${ctx.clientName}. I'll schedule a pre-brief alignment call. Don't start concepting until after.`,
    low: `${ctx.clientName}. Looping in Vance before we go too far.`,
  };
  const vanceText = {
    high: `Excellent. Let's leverage this brief to demonstrate our strategic value. I'll set up a kickoff framework.`,
    medium: `Good. I'd like to see a strategic positioning brief before concepting begins. Happy to circle back on this.`,
    low: `I'll need to see the scope before we allocate resources. Taylor, can you align on capacity?`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── CONCEPTING ───────────────────────────────────────────────────────────────

function getConceptingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const strategistText = {
    high: `Pulling benchmarks and competitive landscape for "${ctx.campaignName}". There's actually an interesting angle here.`,
    medium: `Pulling benchmarks for "${ctx.campaignName}". Will share positioning options with the team.`,
    low: `Running the benchmarks. Will have a 2x2 by end of day.`,
  };
  const copywriterText = {
    high: `Working through the messaging architecture. There's something here — not sure what yet, but something.`,
    medium: `Working on the messaging. I have three directions. I like one of them. Vance will probably like a different one.`,
    low: `On the copy. Will have options.`,
  };

  return [
    { channel: 'creative', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'creative', authorId: 'copywriter', text: copywriterText[morale] },
  ];
}

// ─── CONCEPT_CHOSEN ───────────────────────────────────────────────────────────

function getConceptChosenMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `Direction locked for "${ctx.campaignName}". Moving to production phase — approval routing starts now.`,
    medium: `Direction confirmed for "${ctx.campaignName}". Routing for Vance sign-off before we proceed.`,
    low: `Direction set. Waiting on Vance sign-off. I've sent the calendar invite.`,
  };
  const suitText = {
    high: `This direction works. I can sell this. Let's make sure Legal sees it before we go too far.`,
    medium: `Good direction. I'll prepare the client-facing framing. Taylor, what's the timeline to Legal review?`,
    low: `Direction is fine. Legal turnaround is 5-7 days. Factor that in.`,
  };
  const vanceText = {
    high: `I appreciate the strategic alignment here. This direction leverages our core strengths. Moving forward.`,
    medium: `This is solid. I want to see the Legal-cleared version before we finalize. Keep me in the loop.`,
    low: `Approved, pending Legal. I've flagged this as a P2. Don't let it slip.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── DELIVERABLES_GENERATING ──────────────────────────────────────────────────

function getDeliverablesGeneratingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const copywriterText = {
    high: `Working through the deliverables for "${ctx.campaignName}". This one might actually be good.`,
    medium: `Working through the deliverables. On track for the submission window.`,
    low: `Heads down on deliverables. Almost done.`,
  };
  const contractorText = {
    high: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
    medium: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
    low: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
  };
  const pmText = {
    high: `Production is moving. "${ctx.campaignName}" is on track. Routing for approval in 48 hours.`,
    medium: `Production underway for "${ctx.campaignName}". Tracking to deadline. I\'ll send a status update tomorrow.`,
    low: `Production in progress. Tracking. No issues to surface yet.`,
  };

  return [
    { channel: 'creative', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'creative', authorId: 'contractor', text: contractorText[morale] },
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
  ];
}

// ─── CAMPAIGN_SCORED_WELL ─────────────────────────────────────────────────────

function getCampaignScoredWellMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 85;

  return [
    {
      channel: 'general',
      authorId: 'suit',
      text: `Stakeholder feedback on "${ctx.campaignName}" came back strong — ${score} out of 100. Good outcome.`,
      reactions: [{ emoji: '✓', count: 3 }],
    },
    {
      channel: 'general',
      authorId: 'vance',
      text: morale === 'high'
        ? `This is excellent. I\'d like to use this as a case study in the capabilities deck. Let\'s document the learnings.`
        : `Good result. I\'ll note this in the performance documentation. Let\'s see if we can replicate the framework.`,
    },
    {
      channel: 'general',
      authorId: 'pm',
      text: morale === 'high'
        ? `Great work team. "${ctx.campaignName}" is a strong deliverable. Adding to the archive.`
        : `Good outcome. Archiving the assets. Routing the post-mortem for sign-off.`,
    },
    {
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `The work was actually good on this one. I\'m going to let myself feel that for a moment.`
        : `Good. It was good work.`,
    },
  ];
}

// ─── CAMPAIGN_SCORED_POORLY ───────────────────────────────────────────────────

function getCampaignScoredPoorlyMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 65;

  return [
    {
      channel: 'general',
      authorId: 'suit',
      text: morale === 'high'
        ? `Feedback on "${ctx.campaignName}" — ${score} out of 100. Not what we hoped for, but within acceptable parameters.`
        : `Scores back for "${ctx.campaignName}". ${score}. I\'ll schedule a debrief.`,
    },
    {
      channel: 'general',
      authorId: 'vance',
      text: morale === 'high'
        ? `This is a learning opportunity. Let\'s regroup and identify the strategic gaps. I\'ll send a framework.`
        : `I\'d like to understand what happened here. Taylor, can you schedule a post-mortem?`,
    },
    {
      channel: 'general',
      authorId: 'pm',
      text: morale === 'high'
        ? `Let\'s do a structured debrief. I\'ll send an agenda.`
        : `Scheduling the post-mortem. I\'ll have an agenda out by tomorrow.`,
    },
    {
      channel: 'general',
      authorId: 'hr',
      text: 'A reminder that performance documentation is updated quarterly. If you have concerns about workload or scope, the HR portal is available.',
    },
  ];
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────

function getNewBriefArrivedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `New request in from ${ctx.clientName}. Check the inbox when you have a moment.`,
    medium: `New project request from ${ctx.clientName} in the queue. I\'ll scope it before we commit capacity.`,
    low: `${ctx.clientName} request is in the inbox. Holding off on resource allocation until we have scope clarity.`,
  };
  const vanceText = {
    high: `I\'ll review the brief and identify strategic synergies before we kick off. Let\'s circle back Thursday.`,
    medium: `Good. I\'d like to see the brief before we scope. Can someone ping me when it\'s ready to review?`,
    low: `Is this within our current approved capacity? Taylor, can you check the Q3 utilization before we accept?`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── AWARD_WON ────────────────────────────────────────────────────────────────

function getAwardWonMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const award = ctx.awardName ?? 'a recognition';
  const suitText = {
    high: `"${ctx.campaignName}" received the ${award}. This goes in the credentials deck.`,
    medium: `${award} for "${ctx.campaignName}". Good for the portfolio.`,
    low: `We received the ${award} for "${ctx.campaignName}". I\'ll update the deck.`,
  };
  const vanceText = {
    high: `Excellent. I\'d like to feature this in the next investor update and the Q4 All-Hands deck. Can someone flag this for Comms?`,
    medium: `Good recognition. Let\'s make sure we document the learnings. I\'ll reference this at the next leadership sync.`,
    low: `Noted. I\'ll include it in the performance review documentation. Well done.`,
  };
  const hrText = `Congratulations to the team on this recognition. This will be noted in Q3 performance documentation. Per People Policy 4.1, award recognitions may be referenced in annual performance reviews.`;

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
    { channel: 'general', authorId: 'hr', text: hrText },
    {
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `We won something. I\'m choosing to let that matter.`
        : `Cool.`,
    },
  ];
}
