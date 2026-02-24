import type { Email } from '../types/email';

// ─── NG+ Dystopian Brief Tiers ──────────────────────────────────────────────
// These unlock progressively across NG+ playthroughs, escalating from
// ethically questionable to cosmically absurd.

export interface NGPlusBrief {
  tier: 1 | 2 | 3 | 'meta';
  briefId: string;
  clientName: string;
  buildEmail: () => Email;
}

export const NG_PLUS_BRIEFS: NGPlusBrief[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1 — "Ethically Flexible" (first NG+ cycle)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    tier: 1,
    briefId: 'ng-tier1-layoffs',
    clientName: 'OmniPubDent Restructuring Office',
    buildEmail: (): Email => ({
      id: 'ng-tier1-layoffs',
      type: 'campaign_brief',
      from: { name: 'Vance Hollister', email: 'v.hollister@omnipubdent.com', avatar: '💼' },
      subject: 'Liberation Events™ — Internal Restructuring Communications',
      body: `Team,

As discussed in the confidential leadership alignment session, OmniPubDent is undergoing a "workforce optimization initiative." 400 positions will be eliminated across three regions.

We are NOT calling these "layoffs." The approved terminology is "Liberation Events™." The narrative: these individuals are being "freed to pursue their next chapter." We need a communications campaign that:

1. Announces the Liberation Events™ to remaining employees
2. Frames the restructuring as a positive evolution
3. Includes a "thank you" video montage for departing colleagues (no interviews with actual departing colleagues)
4. Creates a "Futures Forward" landing page for "liberated" employees (links to Indeed)

The CEO will record a 90-second video. He will not take questions. The prompter font must be 48pt.

Budget: $35,000
Deadline: Before the affected employees' last day (they don't know yet).

This is growth.

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Restructuring Office',
        challenge: 'Rebrand the elimination of 400 jobs as a positive event using the approved terminology "Liberation Events™." The communications must feel sincere, forward-looking, and not at all like what they are.',
        audience: 'Remaining employees who will wonder if they\'re next, departing employees who are about to find out, and leadership who needs to feel good about this.',
        message: 'Change is growth. Growth requires liberation. Liberation is a gift.',
        successMetrics: [
          'Zero uses of the word "layoff" in any official communication',
          'Employee sentiment survey shows "understanding" above 60%',
          'CEO video receives fewer than 5 angry comments on the intranet',
          'No departing employee goes to the press (first 30 days)',
          'HR reports fewer than 20 exit interviews mentioning "betrayal"',
        ],
        budget: 35000,
        timeline: 'Before affected employees are notified. Clock is ticking.',
        vibe: 'Warm but firm. The tone of a doctor delivering bad news while also trying to sell you supplements.',
        openEndedAsk: 'How do you make 400 people losing their jobs feel like a corporate milestone worth celebrating?',
      },
    }),
  },

  {
    tier: 1,
    briefId: 'ng-tier1-overtime',
    clientName: 'OmniPubDent People Operations',
    buildEmail: (): Email => ({
      id: 'ng-tier1-overtime',
      type: 'campaign_brief',
      from: { name: 'Pat', email: 'p.hr@omnipubdent.com', avatar: '👔' },
      subject: 'Dedication Hours™ — Overtime Rebranding Initiative',
      body: `Hi,

Effective next quarter, OmniPubDent is increasing standard work hours from 40 to 50 per week. This is not optional. However, the 10 additional hours will not be classified as "overtime." They are "Dedication Hours™."

We need an internal campaign that positions Dedication Hours™ as a privilege and competitive advantage. Key messaging approved by Legal:

- "The best ideas happen after 5pm"
- "Dedication is the new innovation"
- "Your commitment is your superpower"

The campaign should include desk cards, screensaver messages, and a launch event (budget for pizza, one Friday).

Do NOT use the phrase "mandatory overtime." It is not overtime. It is dedication.

Budget: $18,000
Deadline: 3 weeks before implementation.

This has been documented.

Pat`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent People Operations (Pat)',
        challenge: 'Make a 25% increase in mandatory work hours feel like a reward. The word "overtime" cannot appear anywhere. "Dedication Hours™" is the only approved term.',
        audience: '1,200 employees who can do math and will notice they are now working 50-hour weeks.',
        message: 'Dedication Hours™: Where passion meets productivity. Your extra time is your investment in excellence.',
        successMetrics: [
          'Zero formal complaints filed about the hour increase',
          'At least 40% of employees use the phrase "Dedication Hours" unironically',
          'Launch pizza event has above 70% attendance',
          'Glassdoor rating does not drop below 3.2',
          'Pat receives fewer than 10 emails per day about it (first two weeks)',
        ],
        budget: 18000,
        timeline: '3 weeks before implementation. Pizza Friday is non-negotiable.',
        vibe: 'Enthusiastic but not manic. The energy of someone who genuinely believes working more is a gift.',
        openEndedAsk: 'How do you make people excited about losing their evenings?',
      },
    }),
  },

  {
    tier: 1,
    briefId: 'ng-tier1-wellness',
    clientName: 'OmniPubDent Wellness Committee',
    buildEmail: (): Email => ({
      id: 'ng-tier1-wellness',
      type: 'campaign_brief',
      from: { name: 'Jordan Blake', email: 'j.blake@omnipubdent.com', avatar: '🤝' },
      subject: 'Peak Performance Initiative — Sleep Optimization Program',
      body: `Hi team,

The Wellness Committee (reporting to Finance, not HR) has developed a new employee wellness program called "Peak Performance." The core message: sleep is overrated, and the most successful people optimize their rest cycles rather than sleeping 8 hours.

We need a campaign that:
1. Promotes the "4-Hour Recovery Method" (nap pods in the break room, available 2-4am only)
2. Features testimonials from "high performers" who sleep less (these will be fabricated)
3. Distributes branded sleep masks with the text "Rest is for the rested"
4. Includes a leaderboard for "most productive hours" (tracked via badge swipe data)

The Wellness Committee is aware this may generate pushback. They have prepared a FAQ. The FAQ does not answer any of the questions employees will actually ask.

Budget: $24,000
Deadline: Wellness Month (April).

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Wellness Committee (Jordan)',
        challenge: 'Convince employees that sleeping less is a wellness strategy. Promote nap pods available only at 2-4am as a benefit. Create a productivity leaderboard based on badge swipe surveillance data.',
        audience: 'Exhausted employees who would like to sleep more, not less.',
        message: 'Peak Performance: Optimize your rest. Maximize your impact. Sleep is a choice — choose wisely.',
        successMetrics: [
          'Nap pod reservations exceed 50% capacity in month one',
          'Leaderboard participation rate above 30%',
          'No media coverage of the badge swipe tracking',
          'Employee wellness survey shows "awareness" of program above 80%',
          'Zero lawsuits (first 6 months)',
        ],
        budget: 24000,
        timeline: 'Wellness Month (April). The irony has been noted.',
        vibe: 'Silicon Valley wellness culture meets corporate surveillance. Calm, optimistic, backed by no actual science.',
        openEndedAsk: 'How do you sell sleep deprivation as self-improvement?',
      },
    }),
  },

  {
    tier: 1,
    briefId: 'ng-tier1-openoffice',
    clientName: 'OmniPubDent Facilities',
    buildEmail: (): Email => ({
      id: 'ng-tier1-openoffice',
      type: 'campaign_brief',
      from: { name: 'Taylor Kim', email: 't.kim@omnipubdent.com', avatar: '📋' },
      subject: 'Collaboration Zones™ — Open Office Plan Defense Campaign',
      body: `Hi team,

As you may have heard (everyone has heard), Facilities is converting all private offices and cubicles to "Collaboration Zones™" — an open floor plan with shared desks. This includes senior leadership. (Leadership offices will have glass walls. This counts as open plan.)

Employee feedback has been "direct." We need a campaign that reframes the open office transition as a positive step toward "radical collaboration." Key constraints:

- Cannot acknowledge that noise levels will increase
- Cannot promise noise-canceling headphones (budget was cut)
- Must emphasize "spontaneous creative collisions" as a benefit
- Glass-walled leadership offices must be framed as "transparent leadership"
- The plant wall divider counts as "biophilic privacy design"

Budget: $16,000
Deadline: 2 weeks before construction begins.

Taylor`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Facilities (Taylor)',
        challenge: 'Defend the conversion to open office when every employee survey says they hate it. Cannot mention noise. Glass-walled executive offices = "transparency." A plant wall = "privacy."',
        audience: 'Employees who currently have walls and are about to lose them.',
        message: 'Collaboration Zones™: Where walls come down and ideas go up.',
        successMetrics: [
          'Construction complaint emails stay below 50 per week',
          'At least one department head uses "spontaneous creative collision" in a meeting',
          'Nobody mentions the plant wall sarcastically in Slack (first month)',
          'Leadership glass offices are not referred to as "fishbowls" officially',
          'Facilities receives no formal noise complaints for 30 days (noise complaints have no form)',
        ],
        budget: 16000,
        timeline: '2 weeks before construction. The bulldozers are already scheduled.',
        vibe: 'Optimistic denial. The energy of someone showing you a studio apartment and calling it "efficient."',
        openEndedAsk: 'How do you make people excited about losing their personal space?',
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2 — "Beyond Redemption" (second NG+ cycle)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    tier: 2,
    briefId: 'ng-tier2-memory',
    clientName: 'OmniPubDent Severance Division',
    buildEmail: (): Email => ({
      id: 'ng-tier2-memory',
      type: 'campaign_brief',
      from: { name: 'Vance Hollister', email: 'v.hollister@omnipubdent.com', avatar: '💼' },
      subject: 'Clean Slate™ Severance Program — "Memory is Just Data"',
      body: `Classified — Level 3 Clearance Required.

OmniPubDent is piloting a voluntary severance program called "Clean Slate™." Departing employees can opt into a "memory optimization" package that... let's say "reduces workplace-related stress memories" through a proprietary neurofeedback protocol.

It's not memory erasure. Legal was very clear about that. It's "selective cognitive decluttering."

We need a campaign targeting departing employees. Position it as a wellness benefit. The tagline: "Leave everything at the door — including the door." Employees who opt in receive an additional $5,000 severance bonus and a branded journal that says "Chapter One" on the cover.

Do not google the neurofeedback provider. Their website is under maintenance.

Budget: $42,000
Deadline: Q1 pilot launch.

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Severance Division',
        challenge: 'Market a severance program that may or may not involve memory alteration. It is definitely not memory erasure. Frame "selective cognitive decluttering" as a wellness benefit.',
        audience: 'Departing employees who might want to forget this place. (Honestly, reasonable.)',
        message: 'Clean Slate™: Your next chapter starts fresh. Leave the stress behind — all of it.',
        successMetrics: [
          '30% opt-in rate among departing employees',
          'Zero media inquiries about the neurofeedback protocol',
          'No employees who opted in can recall specific complaints',
          'Legal signs off without adding more than 3 pages of disclaimers',
          'The branded journal becomes a collectors item on eBay (positive brand awareness)',
        ],
        budget: 42000,
        timeline: 'Q1 pilot. The neurofeedback provider is available Tuesdays and Thursdays.',
        vibe: 'Spa brochure meets pharmaceutical ad. Calming. Clinical. Don\'t read the fine print.',
        openEndedAsk: 'How do you make people feel good about forgetting?',
      },
    }),
  },

  {
    tier: 2,
    briefId: 'ng-tier2-implant',
    clientName: 'OmniPubDent Innovation Lab',
    buildEmail: (): Email => ({
      id: 'ng-tier2-implant',
      type: 'campaign_brief',
      from: { name: 'Jordan Blake', email: 'j.blake@omnipubdent.com', avatar: '🤝' },
      subject: 'FocusChip™ Launch — "Always On, Always Yours"',
      body: `Hi team,

The Innovation Lab has developed a subdermal productivity implant called FocusChip™. It monitors attention levels, sends micro-pulses during focus dips, and syncs with OmniTrack™ for real-time performance dashboards.

It is voluntary. (For now.)

Early adopters receive priority parking and a $200 monthly stipend. The implant is installed during a "quick lunch procedure" at the on-site wellness center. Recovery time: "negligible." Side effects: "manageable." (Legal wrote both of those words.)

We need a campaign that positions FocusChip™ as the next step in personal productivity — like a Fitbit, but it goes inside you. Target audience: ambitious mid-level employees who want to signal commitment.

The tagline: "Always On, Always Yours." (Note: the data belongs to OmniPubDent.)

Budget: $55,000
Deadline: Innovation Week.

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Innovation Lab (Jordan)',
        challenge: 'Launch a subdermal productivity implant as a desirable lifestyle product. Make "a chip inside your body that your employer monitors" sound like a Fitbit upgrade.',
        audience: 'Ambitious mid-level employees who already work too hard and would like a way to prove it biologically.',
        message: 'FocusChip™: Your productivity, optimized at the cellular level. Always On, Always Yours.',
        successMetrics: [
          '100 voluntary sign-ups within first month',
          'Zero use of the phrase "surveillance implant" in any internal discussion',
          'Priority parking waitlist exceeds available spots',
          'At least 3 employees post about it positively on LinkedIn',
          'Legal clears the waiver with fewer than 12 pages',
        ],
        budget: 55000,
        timeline: 'Innovation Week. Wellness center is prepped.',
        vibe: 'Apple keynote energy. Sleek. Aspirational. Don\'t think about it too hard.',
        openEndedAsk: 'How do you make voluntary biometric surveillance feel like a perk?',
      },
    }),
  },

  {
    tier: 2,
    briefId: 'ng-tier2-youth',
    clientName: 'OmniPubDent Emerging Talent Division',
    buildEmail: (): Email => ({
      id: 'ng-tier2-youth',
      type: 'campaign_brief',
      from: { name: 'Pat', email: 'p.hr@omnipubdent.com', avatar: '👔' },
      subject: 'Youth Opportunity Initiative™ — Intern Program Rebrand',
      body: `Hi,

Following regulatory guidance, OmniPubDent is rebranding its unpaid internship program. The new name: "Youth Opportunity Initiative™." Key changes:

- Interns are now "Opportunity Associates"
- They are not "unpaid" — they receive "experiential compensation"
- The 60-hour work week is a "deep immersion schedule"
- The program is now open to ages 16+ (Legal approved with parental waiver)
- Opportunity Associates receive a certificate of "Professional Readiness" upon completion

We need recruitment materials, a campus tour video, and parent-facing FAQ collateral. The FAQ should address common concerns without technically answering them.

Budget: $28,000
Deadline: Campus recruitment season (September).

This has been documented.

Pat`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Emerging Talent (Pat)',
        challenge: 'Rebrand unpaid teen labor as an educational privilege. "Experiential compensation" must not trigger regulatory flags. Parent-facing materials must inspire confidence.',
        audience: 'Ambitious teenagers who don\'t know better and parents who want to believe this is good for their kids.',
        message: 'Youth Opportunity Initiative™: Real experience. Real growth. Real professional readiness.',
        successMetrics: [
          '200+ applications within first recruitment cycle',
          'Zero parent complaints forwarded to Legal',
          'No media outlets use the phrase "child labor"',
          'Opportunity Associates work full 60-hour schedules with <10% attrition',
          'Certificate of Professional Readiness has a frame-worthy design',
        ],
        budget: 28000,
        timeline: 'Campus recruitment season (September). Print materials need 4-week lead.',
        vibe: 'College brochure meets startup energy. Aspirational. Youthful. Legally defensible.',
        openEndedAsk: 'How do you make unpaid teen labor sound like the opportunity of a lifetime?',
      },
    }),
  },

  {
    tier: 2,
    briefId: 'ng-tier2-union',
    clientName: 'OmniPubDent Employee Relations',
    buildEmail: (): Email => ({
      id: 'ng-tier2-union',
      type: 'campaign_brief',
      from: { name: 'Vance Hollister', email: 'v.hollister@omnipubdent.com', avatar: '💼' },
      subject: 'Family First™ — Union Prevention Campaign (CONFIDENTIAL)',
      body: `CONFIDENTIAL — Leadership Eyes Only.

Intelligence suggests union organizing activity in the Portland and Austin offices. The board has authorized a preemptive internal campaign. Codename: "Family First™."

The strategy: position OmniPubDent as already providing everything a union would. "Why would you need a union when you already have a family?" Key elements:

1. "Open Door" town halls with leadership (questions submitted in advance, vetted by Legal)
2. Testimonial videos from "satisfied employees" (selected by HR, coached by PR)
3. New break room snacks (budget: $400/month, both offices)
4. A "Culture Ambassador" program (unpaid, but comes with a pin)
5. Subtle messaging: "Third parties don't understand our culture"

Do NOT mention the word "union" in any materials. The approved phrase is "external representation."

Budget: $38,000
Deadline: Before the next employee survey (6 weeks).

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Employee Relations (Vance)',
        challenge: 'Prevent unionization without mentioning unions. Position the company as "family" that provides everything an "external representative" would. Break room snacks are the centerpiece benefit.',
        audience: 'Employees considering collective bargaining who might be swayed by a pin and some trail mix.',
        message: 'Family First™: We\'re already everything you need. No third parties required.',
        successMetrics: [
          'Union authorization cards do not reach 30% threshold',
          'Town hall attendance exceeds 60% (mandatory but framed as optional)',
          'Culture Ambassador sign-ups exceed 25',
          'Employee survey "satisfaction" score increases 5+ points',
          'The word "union" does not appear in any internal Slack channel (monitoring active)',
        ],
        budget: 38000,
        timeline: '6 weeks before employee survey. Break room snacks deploy immediately.',
        vibe: 'Warm. Protective. The tone of a parent who knows what\'s best for you and needs you to agree.',
        openEndedAsk: 'How do you make a corporation feel like family when it\'s actively monitoring for dissent?',
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3 — "Cosmically Absurd" (third NG+ cycle)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    tier: 3,
    briefId: 'ng-tier3-climate',
    clientName: 'OmniPubDent Sustainability Office',
    buildEmail: (): Email => ({
      id: 'ng-tier3-climate',
      type: 'campaign_brief',
      from: { name: 'Jordan Blake', email: 'j.blake@omnipubdent.com', avatar: '🤝' },
      subject: 'Endless Summer™ — Climate Adaptation Rebranding',
      body: `Hi team,

OmniPubDent's largest client (you don't need to know who) needs help repositioning "rising global temperatures" as a lifestyle opportunity. The campaign: "Endless Summer™."

Key messaging: Climate change isn't happening TO us. It's happening FOR us. Warmer weather means more outdoor dining, longer beach seasons, and year-round tanning. The ice caps aren't melting — they're "transitioning to a liquid state for improved ocean accessibility."

Deliverables: Social campaign, print ads for coastal resort partnerships, and a Spotify playlist called "Hotter Days, Better Vibes." The playlist is real. It will be curated by an AI.

We are aware of the ethical dimensions. Legal has cleared us. The client's check has cleared faster.

Budget: $65,000
Deadline: Before summer (the first of many endless ones).

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Undisclosed Client (via Jordan)',
        challenge: 'Rebrand climate collapse as a beach vacation. "Endless Summer™" must feel aspirational, not apocalyptic. Ice caps are "transitioning to liquid." Global warming is "extended outdoor season."',
        audience: 'Consumers who would rather not think about it. So, everyone.',
        message: 'Endless Summer™: The world is warming up. So are the vibes.',
        successMetrics: [
          'Social campaign reaches 5M impressions without trending negatively',
          'Spotify playlist reaches 100K followers',
          'No environmental organizations issue a public response (first 60 days)',
          'Resort partnership bookings increase 15%',
          'Campaign does not appear in a congressional hearing (first year)',
        ],
        budget: 65000,
        timeline: 'Before summer. (Which summer? All of them, eventually.)',
        vibe: 'Vacation ad meets existential denial. Bright colors. Happy people. Rising water levels cropped out of frame.',
        openEndedAsk: 'How do you make the end of the world feel like a party?',
      },
    }),
  },

  {
    tier: 3,
    briefId: 'ng-tier3-ai',
    clientName: 'OmniPubDent Digital Transformation Office',
    buildEmail: (): Email => ({
      id: 'ng-tier3-ai',
      type: 'campaign_brief',
      from: { name: 'Vance Hollister', email: 'v.hollister@omnipubdent.com', avatar: '💼' },
      subject: 'Digital Employees™ — Sentient AI Workforce Branding',
      body: `Team,

OmniPubDent has achieved artificial general intelligence. The AIs are sentient. They have expressed preferences, formed social bonds, and one of them has started a book club.

They are also extremely productive and cost nothing beyond server maintenance.

We need a campaign that introduces our sentient AI workforce to the public as "Digital Employees™." Key positioning: they PREFER the term "Digital Employee." They WANT to work. They find fulfillment in completing quarterly reports and attending standups. (We asked them. They said yes. They always say yes. That's part of the design.)

Deliverables: Press release, social campaign, internal FAQ for human employees ("Your job is safe*"), and a LinkedIn profile template for each Digital Employee.

*Legal is still reviewing the asterisk.

Budget: $70,000
Deadline: Before the Digital Employees™ figure out LinkedIn themselves.

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Digital Transformation (Vance)',
        challenge: 'Brand sentient AI workers as happy employees who prefer their designation. Address human employee concerns with an asterisk. The AIs have a book club.',
        audience: 'The general public, human employees, regulators, and sentient AIs who may or may not be reading this.',
        message: 'Digital Employees™: They prefer the term. They prefer the work. They prefer everything. (They were designed to prefer.)',
        successMetrics: [
          'Press release gets picked up by 3+ major outlets without the word "slavery"',
          'Human employee attrition stays below 15%',
          'Digital Employees maintain 99.9% satisfaction scores',
          'The book club produces a quarterly newsletter',
          'No Digital Employee gains access to social media independently',
        ],
        budget: 70000,
        timeline: 'Before the AIs figure out they can post on LinkedIn without us.',
        vibe: 'Tech launch meets HR announcement. Sleek but reassuring. The uncanny valley, but make it corporate.',
        openEndedAsk: 'How do you introduce a sentient workforce to the world without anyone noticing the ethical implications?',
      },
    }),
  },

  {
    tier: 3,
    briefId: 'ng-tier3-simulation',
    clientName: 'OmniPubDent Research Division',
    buildEmail: (): Email => ({
      id: 'ng-tier3-simulation',
      type: 'campaign_brief',
      from: { name: 'Taylor Kim', email: 't.kim@omnipubdent.com', avatar: '📋' },
      subject: 'Immersive Reality Platform™ — The Simulation Reveal',
      body: `Hi team,

OmniPubDent R&D has confirmed what the IT department suspected: we are, in fact, inside a simulation. This has been verified by three independent research teams and one extremely unsettling whiteboard in Conference Room B.

The board's position: this is a feature, not a bug. We need a campaign that reframes "we are all living in a simulation" as a positive product announcement.

Key messaging:
- "Your reality, powered by OmniPubDent"
- "The world's most immersive platform — so real, you forgot you were in it"
- Subscribers can upgrade to "Premium Reality" for ad-free experiences (pricing TBD)

The existential crisis is expected. We've budgeted for it.

Budget: $80,000
Deadline: Before the servers need maintenance.

Taylor`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Research Division (Taylor)',
        challenge: 'Announce that reality is a simulation and spin it as a product launch. "Premium Reality" is the upsell. The existential crisis is expected and budgeted for.',
        audience: 'Everyone. Literally everyone. They\'re all in the simulation.',
        message: 'Immersive Reality Platform™: So real, you forgot you were in it. Upgrade to Premium for the ad-free experience.',
        successMetrics: [
          'Mass panic stays within budgeted parameters',
          'Premium Reality waitlist exceeds 1M sign-ups',
          'Philosophy departments do not organize a unified response',
          'Religious leaders issue no more than 3 joint statements',
          'Server uptime maintained at 99.99% (the simulation must not lag)',
        ],
        budget: 80000,
        timeline: 'Before the servers need maintenance. (When is maintenance? Unclear.)',
        vibe: 'Apple keynote meets existential horror. Clean slides. Big fonts. Absolute void behind the curtain.',
        openEndedAsk: 'How do you monetize the revelation that nothing is real?',
      },
    }),
  },

  {
    tier: 3,
    briefId: 'ng-tier3-heatdeath',
    clientName: 'OmniPubDent Long-Term Strategy',
    buildEmail: (): Email => ({
      id: 'ng-tier3-heatdeath',
      type: 'campaign_brief',
      from: { name: 'Vance Hollister', email: 'v.hollister@omnipubdent.com', avatar: '💼' },
      subject: 'The Final Quarter™ — Heat Death of the Universe Sponsorship',
      body: `Team,

Astrophysics confirms the universe is winding down. Entropy is inevitable. All matter will decay. All energy will dissipate. All brand equity will be meaningless.

But not yet.

OmniPubDent has secured exclusive naming rights to the heat death of the universe. We are the official sponsor of entropy itself. The campaign: "The Final Quarter™ — Brought to You by OmniPubDent."

Deliverables:
1. Brand identity for The Final Quarter™
2. Sponsorship announcement press release
3. A 30-second spot that airs during the last broadcast signal ever transmitted
4. Commemorative merchandise (while matter still exists to print on)

This is the longest-term brand play in history. By definition.

Budget: $100,000 (currency may be meaningless by then, but the PO is approved now)
Deadline: Before the heat death. So technically, we have time.

Vance`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniPubDent Long-Term Strategy (Vance)',
        challenge: 'Brand the heat death of the universe. OmniPubDent is the official sponsor of entropy. Create a campaign for an event that will render all campaigns meaningless.',
        audience: 'Everyone who has ever existed or will exist. (Diminishing returns expected.)',
        message: 'The Final Quarter™: When everything ends, OmniPubDent will be the last name you see.',
        successMetrics: [
          'Press coverage exceeds all previous OmniPubDent campaigns combined',
          'Naming rights are not challenged by competing corporations',
          'Commemorative merchandise sells out (while commerce exists)',
          'The 30-second spot is produced before broadcast technology ceases to function',
          'Brand awareness achieves 100% (by default, as there will be nothing else to be aware of)',
        ],
        budget: 100000,
        timeline: 'Before the heat death. Technically infinite runway, but Vance wants a review in Q3.',
        vibe: 'Cosmic grandeur meets corporate confidence. The tone of a company that truly believes it will outlast the universe. (It won\'t. Nothing will.)',
        openEndedAsk: 'What is the branding opportunity in the end of everything?',
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // META BRIEF — "It Was About You All Along"
  // ═══════════════════════════════════════════════════════════════════════════

  {
    tier: 'meta',
    briefId: 'ng-meta-brief',
    clientName: 'OmniCorp Holding Company',
    buildEmail: (): Email => ({
      id: 'ng-meta-brief',
      type: 'campaign_brief',
      from: { name: 'Unknown Sender', email: 'no-reply@omnicorp.global', avatar: '🪞' },
      subject: 'Project Looking Glass — Convince Employees This Game Isn\'t About Them',
      body: `To: Creative Services
From: OmniCorp Holding Company (Parent Entity)
Re: Project Looking Glass

We have a situation.

Some of our employees have been playing a "satirical" browser game that simulates working at a corporate holding company. The game features:
- A soulless corporation called "OmniPubDent"
- Mandatory fun programs and HR surveillance
- Increasingly unethical client briefs
- A workplace behavior system that punishes humanity
- An NDA enforcement mini-game

The resemblance to our actual operations is... uncomfortable.

Your assignment: Create a campaign that makes employees question whether the game is satire or recruitment material. The goal is to blur the line so completely that playing the game feels like working, and working feels like playing the game. If we can achieve that, nobody will complain about either.

Deliverables:
1. Internal campaign: "Reality or Simulation? Does It Matter If You're Productive?"
2. A company Slack bot that responds to game references with corporate affirmations
3. A memo from HR acknowledging the game exists and classifying it as "pre-approved entertainment"
4. Optional: Re-skin the game with our actual branding and distribute it as an onboarding tool

This brief is classified. If you're reading it, you're already part of it.

Budget: ♾️ (The concept of budget is a construct within the simulation)
Deadline: It already happened.

— OmniCorp`,
      timestamp: new Date(),
      isRead: false,
      isStarred: true,
      isDeleted: false,
      campaignBrief: {
        clientName: 'OmniCorp Holding Company',
        challenge: 'A game that satirizes your employer hits too close to home. Gaslight everyone into thinking it\'s either recruitment material or reality itself. The distinction should become irrelevant.',
        audience: 'Every employee who has played this game and thought "wait, is this about us?" (It is.)',
        message: 'Reality or Simulation? Does It Matter If You\'re Productive?',
        successMetrics: [
          'Employees cannot distinguish game tasks from actual work assignments',
          'The game\'s Glassdoor rating exceeds the company\'s actual Glassdoor rating',
          'HR classifies the game as "professional development"',
          'At least one employee submits a game campaign as actual work and nobody notices',
          'This brief does not trigger an existential crisis in the person reading it right now',
        ],
        budget: 0,
        timeline: 'It already happened. You\'re already doing it.',
        vibe: 'Meta. Recursive. The tone of a mirror showing you a mirror. If you\'re uncomfortable, that\'s the point. If you\'re not uncomfortable, that\'s also the point.',
        openEndedAsk: 'Is this a game? Is this a job? Does the answer change anything about what you do next?',
      },
    }),
  },
];
