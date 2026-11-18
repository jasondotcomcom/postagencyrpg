import type { ChannelId, ChatMessage, ChatCampaignEvent, ChatEventContext, MessageTemplate, MoraleLevel } from '../types/chat';
import { getAmbientPool, chainId, chainHasPat } from './ambientMessages';
import type { AmbientChain } from './ambientMessages';
import { pickUnseen } from '../utils/chatMemory';

// ─── Seed Messages ────────────────────────────────────────────────────────────
// Openers that make the Approved Communication Portal feel lived-in. Drawn from
// each channel's scripted pool with seen-tracking (chatMemory), so a thread
// never shows up again — as an opener or as ambient chat — until the whole pool
// has been used. Tracking is saved with the game and cleared on New Game.

const SEED_CHANNELS: ChannelId[] = ['general', 'creative', 'random', 'food', 'memes', 'haiku'];

export function getInitialMessages(): ChatMessage[] {
  const now = Date.now();
  const out: ChatMessage[] = [];

  SEED_CHANNELS.forEach((channel, channelIdx) => {
    const pool = getAmbientPool(channel);
    const chainsWanted = channel === 'general' ? 1 + (Math.random() < 0.5 ? 1 : 0) : 1;
    const picked: AmbientChain[] = [];
    for (let n = 0; n < chainsWanted; n++) {
      // Openers never feature Pat — Pat stays rare.
      const c = pickUnseen(`pool:${channel}`, pool, ch => chainId(channel, ch), ch => !chainHasPat(ch) && !picked.includes(ch));
      if (c) picked.push(c);
    }
    let t = now - 7_200_000 + channelIdx * 600_000;
    picked.forEach((c, ci) => {
      c.messages.forEach((m, mi) => {
        t += mi === 0 ? 900_000 + Math.random() * 600_000 : 60_000 + Math.random() * 180_000;
        out.push({
          id: `seed-${channel}-${ci}-${mi}`,
          channel,
          authorId: m.authorId,
          text: m.text,
          timestamp: Math.min(t, now - 60_000),
          reactions: m.reactions ?? [],
          isRead: true,
          ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
        });
      });
    });
  });

  return out;
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
  const pmText: Record<MoraleLevel, string> = {
    high: `Brief accepted: "${ctx.campaignName}" for ${ctx.clientName}. Scoping now. Timelines by EOD.`,
    medium: `Brief accepted: "${ctx.campaignName}" for ${ctx.clientName}. Scoping now. Timelines by EOD.`,
    low: `Brief is in. "${ctx.campaignName}" for ${ctx.clientName}. Starting the approval routing.`,
    toxic: `Another one. "${ctx.campaignName}". ${ctx.clientName}. Sure.`,
    mutiny: `I'm not scoping this until we talk about workload. Seriously.`,
  };
  const suitText: Record<MoraleLevel, string> = {
    high: `${ctx.clientName} — good client. Let's make sure we're aligned on what they actually want before we do anything.`,
    medium: `${ctx.clientName}. I'll schedule a pre-brief alignment call. Don't start concepting until after.`,
    low: `${ctx.clientName}. Looping in Vance before we go too far.`,
    toxic: `${ctx.clientName}. Whatever. I'll forward it.`,
    mutiny: `I'm not presenting this to the client. Someone else can do it.`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `Excellent. Let's leverage this brief to demonstrate our strategic value. I'll set up a kickoff framework.`,
    medium: `Good. I'd like to see a strategic positioning brief before concepting begins. Happy to circle back on this.`,
    low: `I'll need to see the scope before we allocate resources. Taylor, can you align on capacity?`,
    toxic: `I'll review when I have time. Which I don't.`,
    mutiny: `This is the third brief this week. I'm escalating the capacity issue to leadership. This is unsustainable.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── CONCEPTING ───────────────────────────────────────────────────────────────

function getConceptingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const strategistText: Record<MoraleLevel, string> = {
    high: `Pulling benchmarks and competitive landscape for "${ctx.campaignName}". There's actually an interesting angle here.`,
    medium: `Pulling benchmarks for "${ctx.campaignName}". Will share positioning options with the team.`,
    low: `Running the benchmarks. Will have a 2x2 by end of day.`,
    toxic: `Benchmarks. Sure.`,
    mutiny: `I'm not doing another 2x2. The last three were ignored. What's the point.`,
  };
  const copywriterText: Record<MoraleLevel, string> = {
    high: `Working through the messaging architecture. There's something here — not sure what yet, but something.`,
    medium: `Working on the messaging. I have three directions. I like one of them. Vance will probably like a different one.`,
    low: `On the copy. Will have options.`,
    toxic: `Copy. Fine.`,
    mutiny: `I wrote six taglines last week and none were used. I'm updating my portfolio instead.`,
  };

  return [
    { channel: 'creative', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'creative', authorId: 'copywriter', text: copywriterText[morale] },
  ];
}

// ─── CONCEPT_CHOSEN ───────────────────────────────────────────────────────────

function getConceptChosenMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText: Record<MoraleLevel, string> = {
    high: `Direction locked for "${ctx.campaignName}". Moving to production phase — approval routing starts now.`,
    medium: `Direction confirmed for "${ctx.campaignName}". Routing for Vance sign-off before we proceed.`,
    low: `Direction set. Waiting on Vance sign-off. I've sent the calendar invite.`,
    toxic: `Direction picked. Moving on.`,
    mutiny: `I don't care which direction. Pick one. I have twelve other projects.`,
  };
  const suitText: Record<MoraleLevel, string> = {
    high: `This direction works. I can sell this. Let's make sure Legal sees it before we go too far.`,
    medium: `Good direction. I'll prepare the client-facing framing. Taylor, what's the timeline to Legal review?`,
    low: `Direction is fine. Legal turnaround is 5-7 days. Factor that in.`,
    toxic: `Fine. Send it.`,
    mutiny: `The client won't notice either way. They never read these.`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `I appreciate the strategic alignment here. This direction leverages our core strengths. Moving forward.`,
    medium: `This is solid. I want to see the Legal-cleared version before we finalize. Keep me in the loop.`,
    low: `Approved, pending Legal. I've flagged this as a P2. Don't let it slip.`,
    toxic: `Approved. I don't have bandwidth to review this properly.`,
    mutiny: `I've stopped approving things. Everything is approved. Nothing matters.`,
  };

  const strategistConceptText: Record<MoraleLevel, string> = {
    high: `This direction indexes well against category benchmarks. I can build a positioning rationale that'll hold up in the client review.`,
    medium: `Direction noted. I'll map it against the competitive landscape and flag any risks before production.`,
    low: `I'll validate against the benchmarks. Should have a read by tomorrow.`,
    toxic: `Fine. It's a direction. They all look the same to me now.`,
    mutiny: `Nobody asked for my analysis so I'll keep it to myself. Like always.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'creative', authorId: 'strategist', text: strategistConceptText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── DELIVERABLES_GENERATING ──────────────────────────────────────────────────

function getDeliverablesGeneratingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const copywriterText: Record<MoraleLevel, string> = {
    high: `Working through the deliverables for "${ctx.campaignName}". This one might actually be good.`,
    medium: `Working through the deliverables. On track for the submission window.`,
    low: `Heads down on deliverables. Almost done.`,
    toxic: `Deliverables. Done. Whatever.`,
    mutiny: `I finished the deliverables but I'm not proud of them. Nobody asked me to be.`,
  };
  const contractorText: Record<MoraleLevel, string> = {
    high: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
    medium: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
    low: `Attached please find the design assets per the attached brief. Please advise on revisions.`,
    toxic: `Assets attached. Please advise.`,
    mutiny: `Assets attached. My contract ends Friday. Just so everyone knows.`,
  };
  const pmText: Record<MoraleLevel, string> = {
    high: `Production is moving. "${ctx.campaignName}" is on track. Routing for approval in 48 hours.`,
    medium: `Production underway for "${ctx.campaignName}". Tracking to deadline. I\'ll send a status update tomorrow.`,
    low: `Production in progress. Tracking. No issues to surface yet.`,
    toxic: `It's in production. Don't ask me when it's done.`,
    mutiny: `Production is "in progress." I'm using air quotes because nobody is actually working.`,
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

  const suitText: Record<MoraleLevel, string> = {
    high: `Stakeholder feedback on "${ctx.campaignName}" came back strong — ${score} out of 100. Good outcome.`,
    medium: `Stakeholder feedback on "${ctx.campaignName}" came back strong — ${score} out of 100. Good outcome.`,
    low: `Scores back for "${ctx.campaignName}". ${score}. Acceptable.`,
    toxic: `${score}. Fine.`,
    mutiny: `Oh look. ${score}. They liked it. Does anyone here still care?`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `This is excellent. I'd like to use this as a case study in the capabilities deck. Let's document the learnings.`,
    medium: `Good result. I'll note this in the performance documentation. Let's see if we can replicate the framework.`,
    low: `Good result. I'll note this in the performance documentation. Let's see if we can replicate the framework.`,
    toxic: `Noted.`,
    mutiny: `A good score doesn't fix what's broken here. But sure. Noted.`,
  };
  const pmText: Record<MoraleLevel, string> = {
    high: `Great work team. "${ctx.campaignName}" is a strong deliverable. Adding to the archive.`,
    medium: `Good outcome. Archiving the assets. Routing the post-mortem for sign-off.`,
    low: `Good outcome. Archiving the assets. Routing the post-mortem for sign-off.`,
    toxic: `Archived.`,
    mutiny: `I archived it. I archive everything. That's all I do now.`,
  };
  const copywriterText: Record<MoraleLevel, string> = {
    high: `The work was actually good on this one. I'm going to let myself feel that for a moment.`,
    medium: `Good. It was good work.`,
    low: `Good. It was good work.`,
    toxic: `Cool.`,
    mutiny: `Great. Can I go home now.`,
  };

  const strategistText: Record<MoraleLevel, string> = {
    high: `Quick analysis on "${ctx.campaignName}" (${score}/100): Strong execution against the brief. The audience targeting was on-point — conversion signals look promising. Adding to our benchmark deck.`,
    medium: `${score}/100 for "${ctx.campaignName}". Solid. I'll run a competitive comparison to see where we index. Results by Thursday.`,
    low: `${score}. I'll pull the benchmarks and send a summary.`,
    toxic: `${score}. Numbers don't lie. Unlike some people in this thread.`,
    mutiny: `${score}. I've been tracking our scores. They correlate directly with team morale. I've put together a chart. Nobody will look at it.`,
  };

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale], reactions: [{ emoji: '\u2713', count: 3 }] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'creative', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
  ];
}

// ─── CAMPAIGN_SCORED_POORLY ───────────────────────────────────────────────────

function getCampaignScoredPoorlyMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 65;

  const suitText: Record<MoraleLevel, string> = {
    high: `Feedback on "${ctx.campaignName}" — ${score} out of 100. Not what we hoped for, but within acceptable parameters.`,
    medium: `Scores back for "${ctx.campaignName}". ${score}. I'll schedule a debrief.`,
    low: `Scores back for "${ctx.campaignName}". ${score}. I'll schedule a debrief.`,
    toxic: `${score}. Shocking.`,
    mutiny: `${score}. And somehow this is everyone's fault except the people who set the deadlines.`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `This is a learning opportunity. Let's regroup and identify the strategic gaps. I'll send a framework.`,
    medium: `I'd like to understand what happened here. Taylor, can you schedule a post-mortem?`,
    low: `I'd like to understand what happened here. Taylor, can you schedule a post-mortem?`,
    toxic: `Post-mortem. Sure. Add it to the pile.`,
    mutiny: `I'm not attending another post-mortem where we all pretend the problem isn't systemic.`,
  };
  const pmText: Record<MoraleLevel, string> = {
    high: `Let's do a structured debrief. I'll send an agenda.`,
    medium: `Scheduling the post-mortem. I'll have an agenda out by tomorrow.`,
    low: `Scheduling the post-mortem. I'll have an agenda out by tomorrow.`,
    toxic: `Post-mortem scheduled. Not that anyone reads the action items.`,
    mutiny: `I'm not scheduling another meeting. We all know what went wrong. We always know.`,
  };
  const hrText: Record<MoraleLevel, string> = {
    high: 'A reminder that performance documentation is updated quarterly. If you have concerns about workload or scope, the HR portal is available.',
    medium: 'A reminder that performance documentation is updated quarterly. If you have concerns about workload or scope, the HR portal is available.',
    low: 'A reminder that performance documentation is updated quarterly. If you have concerns about workload or scope, the HR portal is available.',
    toxic: 'The anonymous feedback portal is available. Responses are reviewed by management.',
    mutiny: 'HR has been made aware of recent sentiment. A mandatory wellness check-in has been scheduled for all staff.',
  };

  const strategistText: Record<MoraleLevel, string> = {
    high: `I've reviewed the data for "${ctx.campaignName}" (${score}/100). A few insights: the audience targeting could be tighter, and the creative didn't differentiate enough vs. category norms. I'll have a full debrief doc ready for the post-mortem.`,
    medium: `${score}/100 for "${ctx.campaignName}". Below benchmark. I'll pull the competitive set to identify gaps. Sending analysis by EOD.`,
    low: `${score}. I have thoughts on what went wrong but I'll save them for the post-mortem.`,
    toxic: `${score}. My 2x2 predicted this. I sent it last Tuesday. Nobody read it.`,
    mutiny: `You want data? Here's data: our scores have declined 15% over the last quarter. Directly correlated with headcount reduction. I've documented this. Twice. In frameworks nobody opens.`,
  };

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'creative', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'general', authorId: 'hr', text: hrText[morale] },
  ];
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────

function getNewBriefArrivedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText: Record<MoraleLevel, string> = {
    high: `New request in from ${ctx.clientName}. Check the inbox when you have a moment.`,
    medium: `New project request from ${ctx.clientName} in the queue. I\'ll scope it before we commit capacity.`,
    low: `${ctx.clientName} request is in the inbox. Holding off on resource allocation until we have scope clarity.`,
    toxic: `${ctx.clientName}. Inbox. I can't.`,
    mutiny: `Another brief from ${ctx.clientName}. I'm not opening it. Someone else can.`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `I\'ll review the brief and identify strategic synergies before we kick off. Let\'s circle back Thursday.`,
    medium: `Good. I\'d like to see the brief before we scope. Can someone ping me when it\'s ready to review?`,
    low: `Is this within our current approved capacity? Taylor, can you check the Q3 utilization before we accept?`,
    toxic: `Sure. More work. Why not.`,
    mutiny: `We are at 200% capacity and you're sending new briefs. I'm documenting this for the record.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
  ];
}

// ─── AWARD_WON ────────────────────────────────────────────────────────────────

function getAwardWonMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const award = ctx.awardName ?? 'a recognition';
  const suitText: Record<MoraleLevel, string> = {
    high: `"${ctx.campaignName}" received the ${award}. This goes in the credentials deck.`,
    medium: `${award} for "${ctx.campaignName}". Good for the portfolio.`,
    low: `We received the ${award} for "${ctx.campaignName}". I\'ll update the deck.`,
    toxic: `We won something. ${award}. Okay.`,
    mutiny: `${award}. Fantastic. Maybe they can give us staffing instead of trophies.`,
  };
  const vanceText: Record<MoraleLevel, string> = {
    high: `Excellent. I\'d like to feature this in the next investor update and the Q4 All-Hands deck. Can someone flag this for Comms?`,
    medium: `Good recognition. Let\'s make sure we document the learnings. I\'ll reference this at the next leadership sync.`,
    low: `Noted. I\'ll include it in the performance review documentation. Well done.`,
    toxic: `Great. More content for the investor deck nobody reads.`,
    mutiny: `Awards won't stop the attrition. But congratulations, I guess.`,
  };
  const hrText = `Congratulations to the team on this recognition. This will be noted in Q3 performance documentation. Per People Policy 4.1, award recognitions may be referenced in annual performance reviews.`;

  const strategistAwardText: Record<MoraleLevel, string> = {
    high: `The ${award} validates our strategic positioning on "${ctx.campaignName}". I'll add this to the effectiveness case study we're building.`,
    medium: `Good signal. The ${award} should strengthen our pitch in that category. I'll update the competitive deck.`,
    low: `I'll reference the ${award} in the next stakeholder report. Every data point helps.`,
    toxic: `An award. How nice. Does it come with a budget increase?`,
    mutiny: `The ${award} is for work done by people who've since left. Just noting that.`,
  };

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'vance', text: vanceText[morale] },
    { channel: 'creative', authorId: 'strategist', text: strategistAwardText[morale] },
    { channel: 'general', authorId: 'hr', text: hrText },
    {
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `We won something. I'm choosing to let that matter.`
        : morale === 'mutiny'
        ? `I'm putting this award on my resume. The one I'm updating right now.`
        : morale === 'toxic'
        ? `Lol.`
        : `Cool.`,
    },
  ];
}
