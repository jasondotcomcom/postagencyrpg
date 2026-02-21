import type { Email } from '../types/email';

export interface LockedBriefEntry {
  unlockAt: number;  // unlock after N completed campaigns
  clientName: string; // for notification copy
  briefId: string;    // matches email id
  buildEmail: () => Email;
}

export const LOCKED_BRIEFS: LockedBriefEntry[] = [

  // ─── Unlock after 1st completed campaign ────────────────────────────────────

  {
    unlockAt: 1,
    clientName: 'OmniPubDent C-Suite',
    briefId: 'email-006',
    buildEmail: (): Email => ({
      id: 'email-006',
      type: 'campaign_brief',
      from: {
        name: 'Vance Hollister',
        email: 'v.hollister@omnipubdent.com',
        avatar: '💼',
      },
      subject: 'Capabilities Deck — Q4 Investor Presentation (URGENT)',
      body: `Team,

We need a capabilities deck for the Q4 investor meeting. This is a top-priority deliverable. Vance is presenting.

The deck should communicate that OmniPubDent Creative Services is a "full-service strategic creative partner" capable of "enterprise-scale integrated campaigns." Please do not include any examples that might suggest we primarily make compliance videos and internal newsletters.

Key points to hit:
- We are "digitally native and data-driven"
- We have "cross-functional creative capabilities"
- We deliver "measurable outcomes for complex stakeholders"

The deck should be 15-20 slides. No more than 30 words per slide. The CEO likes Helvetica.

I have a creative instinct on this: can we do something that "pops"? But not in a way that's distracting. Elevated but accessible. Bold but not flashy. Different but familiar.

Budget: $22,000
Timeline: Investor meeting is in 3 weeks. I need a review draft in 10 days.

This is how we move the needle.

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent C-Suite (Vance)',
        challenge: `Create a capabilities deck that makes OmniPubDent Creative Services look like an "enterprise-scale integrated creative partner" to investors, without referencing any actual recent work (compliance videos, internal newsletters). Must use current agency buzzwords while the CEO remains unconfused. Vance wants it to "pop" but not too much.`,
        audience: `Institutional investors and board members who do not understand advertising and will ask questions like "what does 'integrated' mean?" Must also impress the CEO, who communicates primarily in nods and brief silences.`,
        message: `OmniPubDent Creative Services: strategic, integrated, data-driven. We deliver outcomes. (Do not elaborate on what outcomes. Do not give examples.)`,
        successMetrics: [
          'Vance presents without reading from the slides',
          'No investor asks "but what do you actually make?"',
          'CEO nods at least twice during the presentation',
          'Legal clears all claims ("full-service," "data-driven," "integrated") within 48 hours',
          'The deck "pops" in a way that nobody can specifically articulate',
        ],
        budget: 22000,
        timeline: '10 days to review draft, 3 weeks to investor meeting.',
        vibe: `Corporate premium. Think: the website of a consulting firm that charges $800/hour. Every word chosen to sound important. Nothing that would confuse a 68-year-old board member or excite a creative director.`,
        openEndedAsk: `How do you make a capabilities deck for a holding company feel like a creative pitch? What makes investors feel like they understand what they're investing in without having to explain what advertising is?`,
        constraints: [
          'Cannot reference actual recent work (compliance video, newsletter)',
          '15-20 slides, max 30 words per slide, Helvetica preferred',
          'All capability claims require Legal sign-off',
          '"Pop but not flashy" — get clarification if needed, then ignore it',
          'Investor meeting is fixed — no timeline flexibility',
        ],
        clientPersonality: 'Loves frameworks, measures decks by "polish level," will send one feedback email per day starting 2 days before the deadline',
      },
    }),
  },

  {
    unlockAt: 1,
    clientName: 'OmniPubDent CEO (ghostwriting)',
    briefId: 'email-007',
    buildEmail: (): Email => ({
      id: 'email-007',
      type: 'campaign_brief',
      from: {
        name: 'Jordan Blake',
        email: 'j.blake@omnipubdent.com',
        avatar: '🤝',
      },
      subject: 'CEO LinkedIn Content — Q4 Thought Leadership (Confidential)',
      body: `Hi —

Sensitive request. The CEO (Richard Holst) wants to build his personal brand on LinkedIn. He's asked our team to ghostwrite 8 posts per month on his behalf. He will review and may or may not change anything. He'll post as himself.

His current following is 4,200 (mostly internal). Target: 20,000 by end of fiscal year.

Topic areas he's approved: leadership, transformation, the future of work, AI in the enterprise. He would like to come across as "thoughtful but accessible." He is not particularly thoughtful or accessible in person, but we can work with what we have.

He does NOT want posts that sound ghostwritten. He wants them to sound like him. I have attached a sample email from Richard to use as a voice reference. (The sample email is about parking permits.)

Do not contact Richard directly. Route all approvals through me.

Budget: $30,000 for 3 months of content.
First draft due: Friday.

This stays in this thread.

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Richard Holst, CEO (via Jordan)',
        challenge: `Ghostwrite 8 LinkedIn posts/month for a CEO who communicates primarily about parking permits and does not have visible personal opinions about leadership or transformation. Posts must sound authentic, insightful, and personal — the opposite of what they are. Must not sound ghostwritten. Must route through Jordan.`,
        audience: `LinkedIn professionals (30-55) in the enterprise software and holding company space. They follow accounts like this for validation of their own corporate experience and will like posts about resilience, quiet leadership, and "the thing nobody talks about in meetings." They can smell ChatGPT from 3 posts away.`,
        message: `Richard Holst is a thoughtful, accessible leader navigating transformation with clarity and conviction. (He is not these things. Make him seem like them.)`,
        successMetrics: [
          'Richard grows from 4,200 to 10,000 followers in 3 months',
          'At least 2 posts exceed 500 likes',
          'Zero comments pointing out that the posts sound ghostwritten',
          'Richard approves all posts within 48 hours (Jordan escalates if not)',
          'Jordan does not have to explain what LinkedIn is to Richard again',
        ],
        budget: 30000,
        timeline: 'First draft due Friday. 8 posts/month for 3 months.',
        vibe: `Authentic executive voice. The parking permit email, but about leadership. Specific enough to feel real, vague enough to apply to everyone. Should make people in the replies say "so true" without knowing why.`,
        openEndedAsk: `How do you give a CEO a point of view he doesn't have? What's the formula for LinkedIn thought leadership that feels personal when nothing about it is?`,
        constraints: [
          'No direct contact with Richard — all through Jordan',
          'Must not sound ghostwritten (irony fully acknowledged)',
          'Topics: leadership, transformation, future of work, AI in the enterprise only',
          'Voice reference: parking permit email (will be provided)',
          'This assignment does not exist officially. Keep it in this thread.',
        ],
        clientPersonality: 'Jordan: efficient, escalates immediately, routes everything through process. Richard: unresponsive, approves by not disapproving, once replied "ok" to a 400-word post',
      },
    }),
  },

  // ─── Unlock after 2nd completed campaign ────────────────────────────────────

  {
    unlockAt: 2,
    clientName: 'OmniPubDent IT / Vendor Portal',
    briefId: 'email-008',
    buildEmail: (): Email => ({
      id: 'email-008',
      type: 'campaign_brief',
      from: {
        name: 'Taylor Kim',
        email: 't.kim@omnipubdent.com',
        avatar: '📋',
      },
      subject: 'Vendor Portal Rebrand — IT Ticket #IT-4482 (Design Scope)',
      body: `Hi team,

Following up on IT Ticket #IT-4482, which was acknowledged on Tuesday. The vendor portal redesign has been scoped to include a communications component, which falls under our team.

The portal currently has 47 pages. Vendors log in to submit invoices, track purchase orders, and file compliance documents. The average vendor spends 23 minutes completing a task that should take 4. The UI hasn't been updated since 2011.

We are NOT redesigning the portal (that's IT's scope, ticket #IT-4480, estimated Q2 next year). We are creating the onboarding email sequence and help documentation that will tell vendors how to use the portal as it currently exists.

The challenge: make a broken, complicated portal seem manageable through communication alone.

Budget: $14,000 (from the IT communications budget, requires IT Director sign-off).
Deadline: March 15th. Vendor communication goes live March 16th.

Please confirm receipt of this brief via the project tracker, not via email.

Taylor
Project Management Lead`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent IT (Taylor)',
        challenge: `Create onboarding and help documentation for a vendor portal that takes 23 minutes to complete a 4-minute task. We cannot change the portal. We can only write around it. The challenge is making something genuinely difficult seem intuitive through communication, without lying to the vendors who will immediately discover we lied.`,
        audience: `External vendors (50+ companies) ranging from small suppliers to enterprise software companies. They are all busy. None of them want to use this portal. The small suppliers will call Taylor. The enterprise vendors will submit tickets. Both responses are bad.`,
        message: `The OmniPubDent Vendor Portal is your central hub for seamless financial and compliance collaboration. (The word "seamless" was approved by Legal. We acknowledge the irony.)`,
        successMetrics: [
          'Vendor onboarding email open rate above 60%',
          'IT support tickets from vendors drop by 30% after launch',
          'Taylor receives fewer than 5 direct vendor complaints in first month',
          'IT Director signs off on budget within 3 business days',
          'No vendor publicly refers to the portal as "broken" in writing',
        ],
        budget: 14000,
        timeline: 'March 15th — vendor communication goes live March 16th.',
        vibe: `Patient. Clear. The tone of someone explaining airport security to a traveler who just wants to get through — apologetically efficient. Not cheerful. Not corporate. Just: "here is what you do."`,
        openEndedAsk: `How do you make a broken experience feel survivable through documentation? What's the clearest possible path through a 47-page portal when we can't change the portal?`,
        constraints: [
          'Cannot recommend changes to the portal — IT scope only',
          'Must not imply the portal is easy (vendors will feel gaslit)',
          'IT Director sign-off required on budget before production begins',
          'Must work as both email sequence and PDF download',
          'Legal must review any phrase that could be construed as a warranty',
        ],
        clientPersonality: 'Taylor: organized, tracks everything, sends status updates before you ask for them, privately exhausted by IT\'s timeline',
      },
    }),
  },

  {
    unlockAt: 2,
    clientName: 'OmniPubDent Facilities / Motivational Posters',
    briefId: 'email-009',
    buildEmail: (): Email => ({
      id: 'email-009',
      type: 'campaign_brief',
      from: {
        name: 'Pat',
        email: 'p.hr@omnipubdent.com',
        avatar: '👔',
      },
      subject: 'Break Room Refresh — Motivational Poster Series (Culture Initiative)',
      body: `Hi,

Per our Q3 Culture & Belonging Initiative (referenced in the All-Hands deck, slide 14), HR is commissioning a series of 6 motivational posters for the break rooms across all three floors.

The theme is: "OmniPubDent Values in Action." The six values are:
1. Integrity
2. Collaboration
3. Excellence
4. Accountability
5. Innovation
6. Growth

Each poster should visually represent one value. They should be appropriate for all employees. They should not be ironic. Please do not make them ironic.

Last year's posters (from an external vendor) used stock photography of people on mountains. Feedback was "generic." We want something that "feels like us." I am unable to describe what "feels like us" further. Please use your judgment.

Budget: $12,000 for all 6 (design and printing, 3 sizes: 11x17, 18x24, 24x36).
Deadline: Before the Q4 All-Hands on November 8th.

This has been noted.

Pat`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent HR (Pat)',
        challenge: `Design 6 motivational posters representing OmniPubDent's corporate values that do not look like the stock-photo mountain posters from last year, but also cannot be ironic, cannot be unusual, and must "feel like us" — a descriptor Pat is unable to elaborate on. The creative challenge is distinguishing sincerity from blandness when the brief prohibits both.`,
        audience: `1,200 employees who will glance at these posters while waiting for the microwave. The most they will think is "hm, poster." The ceiling for success is "feels like this place takes itself seriously." The floor is "I'm being mocked."`,
        message: `OmniPubDent values: Integrity. Collaboration. Excellence. Accountability. Innovation. Growth. Each one a poster. Each one framed. None of them ironic.`,
        successMetrics: [
          'Pat approves all 6 with no more than 1 revision per poster',
          'Nobody in the office posts a photo of them sarcastically on LinkedIn',
          'At least one department head says "oh, I like those" unprompted',
          'No employees file HR complaints about the posters',
          'Pat uses the phrase "this feels like us" in the approval email',
        ],
        budget: 12000,
        timeline: 'Before Q4 All-Hands on November 8th. 3 print sizes required.',
        vibe: `Sincere but not earnest. Corporate but not hollow. Should look like a company that believes in its values without looking like a company that hired a motivational speaker. The visual language of "competent and steady," not "inspirational LinkedIn post."`,
        openEndedAsk: `How do you make a motivational poster that isn't ironic but also isn't a cliché? What's the design language that makes "Accountability" feel worth looking at in a break room at 11:47am?`,
        constraints: [
          'No mountains, sunsets, or people on peaks (banned after last year)',
          'No irony — Pat will flag it and cannot be argued with',
          'All 6 values must be represented, one per poster, no combining',
          'Must print clearly at 11x17, 18x24, and 24x36',
          'Pat has final approval on all 6 before printing',
        ],
        clientPersonality: 'Pat: approves or does not. Documentation is sent either way. Will provide feedback via numbered list. Cannot define "feels like us" but will know it when they see it.',
      },
    }),
  },

  // ─── Unlock after 3rd completed campaign ────────────────────────────────────

  {
    unlockAt: 3,
    clientName: 'OmniPubDent All-Hands Planning',
    briefId: 'email-010',
    buildEmail: (): Email => ({
      id: 'email-010',
      type: 'campaign_brief',
      from: {
        name: 'Jordan Blake',
        email: 'j.blake@omnipubdent.com',
        avatar: '🤝',
      },
      subject: 'Q4 All-Hands Event — Theme, Collateral, and "Energy"',
      body: `Hi team,

We're planning the Q4 All-Hands for November 8th (same day as the poster rollout — coordinate with Pat). Vance wants this to feel "energized but focused." He used the word "momentum."

We need:
1. A theme for the All-Hands (tagline + visual identity)
2. Internal event collateral (agenda cards, name badges, table signage)
3. A "hype video" to open the presentation — 60–90 seconds, gets people in the room, Vance walks in to it

No budget for external production. The hype video will be made with stock footage and whatever tools we have. It will play on a projector at 9:03am to 200 people who wish they were still at their desk.

Theme cannot be a pun on any of the six corporate values (happened at Q2, it was a disaster). Theme cannot reference the restructuring. Theme should be forward-looking without making any commitments.

Budget: $19,000
Deadline: November 8th. The date is November 8th. This is the third time I'm saying it.

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Internal Events (Jordan)',
        challenge: `Create an All-Hands event theme, collateral, and a 60-90 second hype video made entirely from stock footage that generates "energy" and "momentum" at 9:03am for 200 employees who would rather be at their desks. Theme must be forward-looking without implying anything. Cannot be a value pun. Cannot acknowledge the restructuring.`,
        audience: `200 OmniPubDent employees at 9am. They are holding coffee. They will be on their phones. The hype video is playing. Vance will enter during it. The video must make that moment feel significant without anyone smiling sarcastically.`,
        message: `OmniPubDent: [theme]. We are moving forward together. (Do not specify what "forward" means or where "together" leads.)`,
        successMetrics: [
          'Vance walks in during the hype video and the room responds with applause',
          'Theme is approved by Vance, the CEO\'s EA, and Legal within one revision cycle',
          'Nobody posts about the hype video on LinkedIn',
          'Jordan receives no emails during the All-Hands',
          'The event ends on time',
        ],
        budget: 19000,
        timeline: 'November 8th. See Jordan\'s email for emphasis.',
        vibe: `Momentum without direction. Energy without content. Should feel like the beginning of a very important thing, with no indication of what that thing is. The hype video is made of stock footage and hope.`,
        openEndedAsk: `What theme works for a company that can't say what it's doing, where it's going, or what it's been through? How do you make 200 tired employees feel something at 9am?`,
        constraints: [
          'No value puns (Q2 was a disaster — details classified)',
          'No reference to restructuring, headcount changes, or Q2 results',
          'Hype video must be producible with stock footage only — no external production',
          'Must be 60-90 seconds exactly — Vance entrance is choreographed',
          'Legal must clear the theme tagline for any implied commitments',
        ],
        clientPersonality: 'Jordan: repeats deadlines, expects zero surprises, has been burned before, needs to be told it\'s fine even when it is not fine',
      },
    }),
  },

  {
    unlockAt: 3,
    clientName: 'OmniPubDent Finance / Expense Policy',
    briefId: 'email-011',
    buildEmail: (): Email => ({
      id: 'email-011',
      type: 'campaign_brief',
      from: {
        name: 'Pat',
        email: 'p.hr@omnipubdent.com',
        avatar: '👔',
      },
      subject: 'New Expense Policy Rollout — Internal Communications Campaign',
      body: `Hi,

Effective Q1, OmniPubDent is implementing a new expense policy. Key changes:
- Meal reimbursement cap reduced from $65 to $40 per person
- All expenses over $500 require pre-approval via OmniTrack™ (new form: EX-22B)
- Mileage reimbursement rate updated per federal guidelines
- Receipts must be submitted within 7 days (previously 30)
- All entertainment expenses now require VP-level approval

Finance needs a communications campaign to announce these changes in a way that employees accept without significant negative response. The policy is not changing. The challenge is the framing.

Previous policy announcements have been received poorly (see Q2 PTO restructuring, which we do not discuss). We need an approach that is transparent without inviting disagreement.

Budget: $9,500
Deadline: January 1st implementation — employees must be informed before December 15th.

This has been documented.

Pat`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Finance / HR (Pat)',
        challenge: `Communicate a series of expense policy changes that are uniformly worse for employees (lower meal caps, more pre-approval steps, shorter reimbursement window) in a way that employees accept without significant complaints — without lying, burying the lead, or inviting the kind of response that happened in Q2 (which we do not discuss). The policy is final. The communication is the product.`,
        audience: `1,200 OmniPubDent employees who will read "meal reimbursement reduced to $40" and feel something. The goal is for that something to be "this is fine" rather than "this is not fine." They have email fatigue, policy fatigue, and are aware of the Q2 incident.`,
        message: `OmniPubDent is committed to responsible financial management that supports long-term organizational health. The new expense policy reflects our shared commitment to sustainable operations. (Legal approved this framing. Do not deviate.)`,
        successMetrics: [
          'Zero all-staff reply-alls about the policy change',
          'Employee survey following announcement shows fewer than 20% "negative" responses',
          'Pat receives fewer than 15 individual emails asking for exceptions',
          'Q2-style incident does not repeat (Pat is tracking this personally)',
          'Finance Director says "well done" at the next leadership meeting',
        ],
        budget: 9500,
        timeline: 'December 15th announcement, January 1st implementation. Non-negotiable.',
        vibe: `Transparent without being inviting. Clear without being warm. Should communicate that this is happening, here is what it means, here is where to submit questions — without leaving any conversational door open. The tone of a well-run DMV.`,
        openEndedAsk: `How do you announce universally bad news in a way that reads as professional rather than tone-deaf? What's the format and channel strategy that makes "we're cutting your meal budget" feel like responsible stewardship?`,
        constraints: [
          'Policy details cannot be softened or reframed — Legal approved the text',
          'Must not invite employee feedback or questions in open format',
          'Must reference EX-22B form by name and link to OmniTrack™',
          'Cannot reference Q2 (Pat is firm on this)',
          'Rollout must complete before December 15th — HR compliance window',
        ],
        clientPersonality: 'Pat: precise, thorough, will not be argued with, sends follow-up confirmation of all verbal confirmations. Has been through this before. Is ready.',
      },
    }),
  },

];
