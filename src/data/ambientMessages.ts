import type { ChannelId, ChatReaction } from '../types/chat';

// ─── Types ───────────────────────────────────────────────────────────────────
// Scripted chat threads for each OmniPubDent channel. Used for the openers on
// load and for ambient chat when the live, game-state-aware threads aren't
// available. Seen-tracking (utils/chatMemory) means a thread never repeats
// until its channel's pool has been used up; New Game resets the tracking.

export interface AmbientMessage {
  authorId: string;
  text: string;
  imageUrl?: string;
  delayMs?: number;
  reactions?: ChatReaction[];
}

export interface AmbientChain {
  messages: AmbientMessage[];
}

function solo(authorId: string, text: string, reactions?: ChatReaction[], imageUrl?: string): AmbientChain {
  return { messages: [{ authorId, text, reactions, imageUrl }] };
}

function chain(...msgs: AmbientMessage[]): AmbientChain {
  return { messages: msgs.map((m, i) => ({ ...m, delayMs: i === 0 ? 0 : (m.delayMs ?? 3000) })) };
}

function r(emoji: string, count = 1): ChatReaction[] {
  return [{ emoji, count }];
}

// ─── #all-staff (general) ────────────────────────────────────────────────────

const GENERAL_POOL: AmbientChain[] = [
  chain(
    { authorId: 'hr', text: 'Reminder: Q3 mandatory training modules are due by Friday. This includes all four modules. Module D (Bloodborne Pathogens) is non-negotiable. This has been documented.' },
    { authorId: 'vance', text: 'Good morning team. Let\'s leverage today\'s momentum to ideate around our core deliverables and move the needle on Q3 outcomes. I\'m blocked until 3pm but drop me a ping if anything needs to be surfaced.' },
    { authorId: 'pm', text: 'New briefs are in the inbox. Scoped timelines by EOD. Please don\'t start anything until scope is confirmed and Vance has signed off.' },
    { authorId: 'copywriter', text: 'Got it.' },
  ),
  chain(
    { authorId: 'pm', text: 'The new EX-22B expense form is live in OmniTrack™. EX-22A is no longer accepted.' },
    { authorId: 'strategist', text: 'What changed between A and B?' },
    { authorId: 'pm', text: 'The B.' },
  ),
  chain(
    { authorId: 'vance', text: 'Quick alignment check: are we all aligned on what alignment means going forward?' },
    { authorId: 'strategist', text: 'I can put together a framework.' },
    { authorId: 'vance', text: 'Love that. Let\'s get a meeting on the books to scope the framework.' },
  ),
  solo('suit', 'Just got off a call with HQ. They LOVED the deck. Well, they opened it. That\'s a great sign 🙌'),
  chain(
    { authorId: 'pm', text: 'Approval chain update: deck changes now need sign-off from Vance, Jordan, Legal, Brand, Regional, and Regional\'s assistant.' },
    { authorId: 'copywriter', text: 'For a font change?' },
    { authorId: 'pm', text: 'Especially for a font change.' },
  ),
  solo('strategist', 'Average email response time this week: 3m 52s. Down 8 seconds. I don\'t know who that helps.', r('📊', 1)),
  chain(
    { authorId: 'suit', text: 'Client wants "the same thing as last time but fresher."' },
    { authorId: 'copywriter', text: 'Last time was the same thing as the time before.' },
    { authorId: 'suit', text: 'And they loved it! 🚀' },
  ),
  chain(
    { authorId: 'vance', text: 'Team, I\'ve put a 60-minute block on everyone\'s calendar for a quick 5-minute sync.' },
    { authorId: 'pm', text: 'What\'s the other 55 for?' },
    { authorId: 'vance', text: 'Buffer for synergy.' },
  ),
  solo('pm', 'Reminder: all files must use the naming convention OPD_CLIENT_PROJECT_V#_DATE_INITIALS_FINAL. "FINAL" is mandatory even when it isn\'t.'),
  chain(
    { authorId: 'copywriter', text: 'Brand guide v14 is out. The only change is the word "delight" is now banned.' },
    { authorId: 'strategist', text: 'What replaced it?' },
    { authorId: 'copywriter', text: '"Satisfy."' },
  ),
  solo('suit', 'Big news: we\'re now the preferred agency for slide template refreshes across the entire Midwest region 🙌'),
  chain(
    { authorId: 'strategist', text: 'HQ sent a survey about whether we feel heard.' },
    { authorId: 'copywriter', text: 'It\'s mandatory?' },
    { authorId: 'strategist', text: 'And not anonymous.' },
  ),
  chain(
    { authorId: 'contractor', text: 'Revised logo files delivered per change order CO-112. Further revisions require CO-113. Regards, DesignHub Pro.' },
    { authorId: 'pm', text: 'We asked them to make it bigger.' },
    { authorId: 'copywriter', text: 'It\'s bigger.' },
  ),
  solo('vance', 'Thinking about our north star today. What if our north star had a north star? Let\'s unpack offline.'),
  chain(
    { authorId: 'pm', text: 'OmniTrack is down. Please don\'t do any work until it\'s back, since we can\'t log it.' },
    { authorId: 'copywriter', text: 'So we stop.' },
    { authorId: 'pm', text: 'We pause. Stopping requires a form.' },
  ),
  solo('strategist', 'Built a 2x2 for which meetings could be emails. All of them are in the top right.'),
  chain(
    { authorId: 'suit', text: 'Reminder that the client is a PARTNER, not a client. HQ language update.' },
    { authorId: 'copywriter', text: 'What do they call us?' },
    { authorId: 'suit', text: 'A vendor.' },
  ),
  chain(
    { authorId: 'vance', text: 'Who owns the Q4 narrative?' },
    { authorId: 'strategist', text: 'You do.' },
    { authorId: 'vance', text: 'Love the energy. Let\'s co-own it.' },
  ),
  solo('pm', 'The 14-step sign-off is now the 16-step sign-off. Steps 15 and 16 are confirming steps 1 through 14.'),
  chain(
    { authorId: 'copywriter', text: 'Can I use a semicolon in the client email?' },
    { authorId: 'pm', text: 'Checking with Brand.' },
    { authorId: 'pm', text: 'Brand says no. Legal says maybe. Regional hasn\'t replied.' },
  ),
  solo('suit', 'Client feedback on the deck: "Fine." Writing that up as "exceeded expectations."'),
  chain(
    { authorId: 'strategist', text: 'Has anyone actually met anyone from HQ in person?' },
    { authorId: 'vance', text: 'I\'m from HQ.' },
    { authorId: 'strategist', text: 'In person, Vance.' },
  ),
  solo('pm', 'Everyone please update your status in OmniTrack. "In a meeting" is not a status. "In a meeting (billable)" is.'),
  chain(
    { authorId: 'copywriter', text: 'The client asked if we could make the deck "feel more human."' },
    { authorId: 'suit', text: 'Can we?' },
    { authorId: 'copywriter', text: 'Not under the current brand guide.' },
  ),
  solo('vance', 'Shoutout to the team for crushing it this week. I don\'t know exactly what we crushed but the dashboard is green.'),
  chain(
    { authorId: 'pm', text: 'Fire drill at 2pm. It\'s been added to the project timeline as a deliverable.' },
    { authorId: 'strategist', text: 'Is it billable?' },
    { authorId: 'pm', text: 'Jordan\'s working on it.' },
  ),
  solo('suit', 'Upsold the client from a logo nudge to a logo nudge PLUS a color audit. That\'s what we do here 🚀'),
  chain(
    { authorId: 'copywriter', text: 'Draft is ready for review.' },
    { authorId: 'pm', text: 'Which review? Peer, lead, brand, legal, regional, or client-adjacent?' },
    { authorId: 'copywriter', text: 'Yes.' },
  ),
  solo('strategist', 'Benchmarked our turnaround time against the other 46 OmniPubDent offices. We are 31st. Nobody knows what the first one does differently.'),
  chain(
    { authorId: 'vance', text: 'Heads up: HQ is rolling out a new values framework. There are 11 values.' },
    { authorId: 'copywriter', text: 'Can you name one?' },
    { authorId: 'vance', text: 'Let\'s circle back once I\'ve read it.' },
  ),
  solo('pm', 'Out-of-office requests must be submitted 30 days in advance. Illness is not an exception, it\'s a separate form.'),
  chain(
    { authorId: 'suit', text: 'Wearing the OmniPubDent lanyard to the client meeting. Brand consistency 🙌' },
    { authorId: 'strategist', text: 'They also wear the OmniPubDent lanyard. We\'re the same company now.' },
    { authorId: 'suit', text: 'Even better.' },
  ),
  solo('copywriter', 'Wrote a headline today that I liked. Legal liked it less. It\'s in the folder now, with the others.'),
  chain(
    { authorId: 'contractor', text: 'Reminder: DesignHub Pro turnaround is 72 business hours. Weekends are not business hours. Regards.' },
    { authorId: 'pm', text: 'So Tuesday.' },
    { authorId: 'contractor', text: 'Wednesday. Regards.' },
  ),
  chain(
    { authorId: 'vance', text: 'What\'s our story for the town hall?' },
    { authorId: 'strategist', text: 'We shipped 14 deck updates and one logo nudge.' },
    { authorId: 'vance', text: 'Let\'s call it "15 strategic brand evolutions."' },
  ),
  solo('pm', 'Our OmniTrack utilization is 97%. The 3% is lunch. HQ has flagged the 3%.'),
  chain(
    { authorId: 'strategist', text: 'Interesting: client satisfaction went up when we did less.' },
    { authorId: 'suit', text: 'Don\'t put that in the deck.' },
  ),
  solo('copywriter', 'Replaced "you\'ll love it" with "you may find it satisfactory" per brand. Shipping.'),
  chain(
    { authorId: 'pm', text: 'Who approved the green on the Henderson slide?' },
    { authorId: 'suit', text: 'The client.' },
    { authorId: 'pm', text: 'The client isn\'t in the approval chain.' },
    { authorId: 'suit', text: 'They are now. I added them 🙌' },
  ),
  solo('vance', 'Reminder: there\'s no such thing as a bad idea. There are only ideas that haven\'t been through the approval chain yet.'),
  chain(
    { authorId: 'copywriter', text: 'Is the old agency Slack still archived somewhere?' },
    { authorId: 'strategist', text: 'Deleted per data retention policy.' },
    { authorId: 'copywriter', text: 'Right. Ok.' },
  ),
];

// ─── #project-work (creative) ────────────────────────────────────────────────

const CREATIVE_POOL: AmbientChain[] = [
  chain(
    { authorId: 'copywriter', text: 'Sharing a reference for the brand refresh. Thought it might be useful.' },
    { authorId: 'strategist', text: 'Thanks.' },
  ),
  solo('copywriter', 'Moved the logo 4px right per client feedback. Then 4px left per second client feedback. Net zero. Logging 3 hours.'),
  chain(
    { authorId: 'pm', text: 'Slide 7 is still using the old blue.' },
    { authorId: 'copywriter', text: 'There\'s an old blue?' },
    { authorId: 'pm', text: 'There are four blues. Three are retired.' },
  ),
  chain(
    { authorId: 'copywriter', text: 'I had an actual idea for the Henderson deck. Like a real one.' },
    { authorId: 'strategist', text: 'Is it in scope?' },
    { authorId: 'copywriter', text: 'No. Never mind.' },
  ),
  solo('strategist', 'Updated the competitive landscape slide. Everyone in the landscape is also owned by OmniPubDent now.'),
  chain(
    { authorId: 'contractor', text: 'Delivered: 3 headline font options. Per SOW, options are Arial, Arial Bold, and Arial Italic. Regards.' },
    { authorId: 'copywriter', text: 'Arial Italic. Let\'s be bold.' },
  ),
  chain(
    { authorId: 'vance', text: 'Can we make the deck more "visionary" without changing any of the content?' },
    { authorId: 'copywriter', text: 'Bigger font on the title.' },
    { authorId: 'vance', text: 'That\'s exactly it.' },
  ),
  solo('copywriter', 'The client wants the tagline "more aligned." It\'s now aligned center.'),
  chain(
    { authorId: 'pm', text: 'Version history on the deck is at v47. Please stop saving after every click.' },
    { authorId: 'copywriter', text: 'That was autosave.' },
    { authorId: 'pm', text: 'Then please stop autosave.' },
  ),
  solo('strategist', 'Ran the new slide through the readability checker. Grade level 4. Brand target is grade level 3.'),
  chain(
    { authorId: 'suit', text: 'Client wants to see "a few options." Let\'s give them 11 so they feel taken care of 🙌' },
    { authorId: 'copywriter', text: 'They\'ll pick the first one.' },
    { authorId: 'suit', text: 'And they\'ll feel GREAT about it.' },
  ),
  chain(
    { authorId: 'copywriter', text: 'Wrote a line that rhymed. Deleted it before anyone saw.' },
    { authorId: 'strategist', text: 'I saw.' },
    { authorId: 'copywriter', text: 'Please don\'t file it.' },
  ),
  solo('pm', 'Asset request for the Tuesday deck: one (1) stock photo of a diverse team pointing at a laptop. Approved vendor only.'),
  chain(
    { authorId: 'strategist', text: 'The insight for this one: customers want the product to work.' },
    { authorId: 'vance', text: 'Powerful. Let\'s make that the headline.' },
    { authorId: 'copywriter', text: 'The headline is now "It Works."' },
  ),
  solo('copywriter', 'Old me would\'ve made this a film. New me is changing slide 12 from "Q3" to "Q4."'),
  chain(
    { authorId: 'contractor', text: 'Clarification request: does "make it pop" refer to color, contrast, or size? Regards.' },
    { authorId: 'pm', text: 'Yes.' },
    { authorId: 'contractor', text: 'That will require a change order. Regards.' },
  ),
  chain(
    { authorId: 'copywriter', text: 'Does anyone have the original agency logo files? Just curious.' },
    { authorId: 'pm', text: 'Archived. Requesting access takes 6-8 weeks.' },
    { authorId: 'copywriter', text: 'Just curious.' },
  ),
  solo('strategist', 'Swapped the pie chart for a bar chart. Client feedback was "this changes everything."'),
  chain(
    { authorId: 'vance', text: 'Let\'s get some blue-sky thinking on the slide footer.' },
    { authorId: 'copywriter', text: 'The footer says "Confidential."' },
    { authorId: 'vance', text: 'What if it said "Confidential" but with purpose?' },
  ),
  solo('copywriter', 'Spellchecked the deck. Found "synergy" 14 times. Left them. They\'re load-bearing.'),
  chain(
    { authorId: 'pm', text: 'Can someone confirm the logo is the 2023 logo and not the 2023 logo (revised)?' },
    { authorId: 'copywriter', text: 'What\'s the difference?' },
    { authorId: 'pm', text: 'Nobody knows. That\'s why I\'m asking.' },
  ),
  solo('suit', 'Client loved the new deck! Their note: "Can it be shorter but have more in it?" Love a challenge 🚀'),
  chain(
    { authorId: 'strategist', text: 'There\'s a typo on slide 3.' },
    { authorId: 'copywriter', text: 'It\'s been there since v12. Legal approved it. Changing it restarts the chain.' },
    { authorId: 'strategist', text: 'Keeping the typo.' },
  ),
  solo('copywriter', 'Found my old manifesto draft in a folder. It was good. I closed the folder.'),
  chain(
    { authorId: 'contractor', text: 'The requested "warmer" version is attached. We adjusted the hue by 2 degrees. Regards.' },
    { authorId: 'suit', text: 'Client says it\'s too warm.' },
  ),
  solo('pm', 'Deck page count is now 71. Max allowed is 70. Please kill a slide. Any slide. I don\'t care which.'),
  chain(
    { authorId: 'vance', text: 'What if the deck was interactive?' },
    { authorId: 'pm', text: 'It\'s a PDF.' },
    { authorId: 'vance', text: 'An interactive PDF.' },
  ),
  solo('strategist', 'Framework update: the 2x2 is now a 3x3. More boxes, same answer.'),
  chain(
    { authorId: 'copywriter', text: 'Is "bold" allowed in headlines yet?' },
    { authorId: 'pm', text: 'The word or the font weight?' },
    { authorId: 'copywriter', text: 'Either.' },
    { authorId: 'pm', text: 'Neither.' },
  ),
  solo('suit', 'HQ wants us to use the new template. It\'s the old template with a bigger OmniPubDent logo 🙌'),
  chain(
    { authorId: 'copywriter', text: 'The client asked for something "nobody\'s seen before."' },
    { authorId: 'strategist', text: 'Did you send them the original concept?' },
    { authorId: 'copywriter', text: 'They saw it before. In round one. They rejected it.' },
  ),
  solo('pm', 'Reminder: no new ideas in round 3. New ideas are a round 1 activity.'),
  chain(
    { authorId: 'vance', text: 'Can someone mock up a mood board for the footer refresh?' },
    { authorId: 'copywriter', text: 'Mood: footer.' },
  ),
  solo('strategist', 'Tested two headlines with a focus group of four. Both tied. One person left early.'),
  chain(
    { authorId: 'copywriter', text: 'I want to try one thing on this deck. One. Small. Thing.' },
    { authorId: 'pm', text: 'Is it a font?' },
    { authorId: 'copywriter', text: 'It\'s a feeling.' },
    { authorId: 'pm', text: 'Not in scope.' },
  ),
  solo('contractor', 'Final files uploaded. Please note "final" means final per SOW section 3.2. Regards, DesignHub Pro.'),
  chain(
    { authorId: 'suit', text: 'Client asked who wrote the closing line. Said it made them "feel something."' },
    { authorId: 'copywriter', text: 'Me.' },
    { authorId: 'suit', text: 'Let\'s make sure it doesn\'t happen again 🙌' },
  ),
  solo('copywriter', 'Approved copy attached. It\'s fine. It\'s all fine.'),
  chain(
    { authorId: 'strategist', text: 'Should the CTA be "Learn More" or "Discover More"?' },
    { authorId: 'vance', text: 'Let\'s A/B test it over six weeks.' },
    { authorId: 'pm', text: 'It\'s due Friday.' },
  ),
  solo('pm', 'Slide 22 has been flagged by Regional for "tone." It\'s a chart.'),
];

// ─── #Approved Nutrition (food) ──────────────────────────────────────────────

const FOOD_POOL: AmbientChain[] = [
  chain(
    { authorId: 'hr', text: 'Welcome to #Approved Nutrition. All meal documentation must be submitted by 2pm. Unapproved snacking is a Policy 6.3 violation.' },
    { authorId: 'copywriter', text: 'The coffee machine on floor 3 is making a sound that can only be described as "distressed." Proceed with caution.', reactions: r('☕', 4) },
    { authorId: 'pm', text: 'Has anyone tried the new cafeteria options? I need to know before I commit 30 minutes of my lunch break.' },
  ),
  solo('pm', 'The vending machine has been upgraded. All selections now require manager approval.'),
  solo('copywriter', 'I ranked every cereal by caloric density. This is what happens when I skip lunch.'),
  solo('hr', 'Reminder: microwaving fish is a terminable offense as of Q3.'),
  solo('strategist', 'The salad bar has been "optimized." There are now three kinds of lettuce and nothing else.'),
  solo('copywriter', 'Someone labeled their lunch "DO NOT EAT" and that only made it more appealing.'),
  solo('pm', 'Floor 2 fridge cleanout is today. If your container has developed sentience, that\'s on you.'),
  solo('hr', 'The kombucha in the break room is not company-provided. Please stop expensing it.'),
  solo('strategist', 'I\'ve been eating desk granola for three days. I think I\'m becoming the granola.'),
  solo('suit', 'Client lunch went well. They ordered for us. We all had salad. Nobody wanted salad.'),
  solo('copywriter', 'The coffee machine is working again but it\'s making choices I don\'t agree with.'),
  chain(
    { authorId: 'suit', text: 'HQ is sending lunch for the team to celebrate the Q3 numbers 🙌' },
    { authorId: 'pm', text: 'What is it?' },
    { authorId: 'suit', text: 'A fruit platter. For forty offices. We get the melon.' },
  ),
  chain(
    { authorId: 'vance', text: 'Let\'s do a working lunch to ideate on the footer.' },
    { authorId: 'copywriter', text: 'Is the lunch provided?' },
    { authorId: 'vance', text: 'The ideation is provided.' },
  ),
  solo('strategist', 'Cafeteria wait time today: 14 minutes. Lunch break: 30. Eating time: 16. I made a chart.', r('📊', 1)),
  chain(
    { authorId: 'copywriter', text: 'Old agency had a taco Tuesday.' },
    { authorId: 'pm', text: 'We have a Tuesday.' },
  ),
  solo('pm', 'The cafeteria now has a QR code menu. The QR code leads to a PDF. The PDF is a photo of the menu.'),
  chain(
    { authorId: 'suit', text: 'Tried the new OmniBowl™ in the cafeteria. It\'s rice. But it\'s branded rice 🚀' },
    { authorId: 'strategist', text: 'What\'s in it?' },
    { authorId: 'suit', text: 'Synergy, I think.' },
  ),
  solo('copywriter', 'Brought soup from home. Felt like a small act of rebellion. It was minestrone.'),
  chain(
    { authorId: 'pm', text: 'Coffee machine on 3 is out of order. Coffee machine on 4 requires a badge. Coffee machine on 5 is a decoy.' },
    { authorId: 'strategist', text: 'What\'s on 6?' },
    { authorId: 'pm', text: 'HQ.' },
  ),
  solo('strategist', 'The free snack drawer now has a sign-out sheet.'),
  chain(
    { authorId: 'copywriter', text: 'There\'s cake in the kitchen.' },
    { authorId: 'pm', text: 'For whose birthday?' },
    { authorId: 'copywriter', text: 'It says "Congratulations on 14 consecutive days without an incident."' },
  ),
  solo('vance', 'Thinking about doing a team lunch-and-learn. The learn is the new OmniTrack features. The lunch is TBD.'),
  chain(
    { authorId: 'suit', text: 'Pro tip: the cafeteria\'s "chef\'s special" is yesterday\'s regular.' },
    { authorId: 'copywriter', text: 'That tracks.' },
  ),
  solo('pm', 'Lunch orders for Thursday\'s review must go through procurement. Lead time is 5 business days. Thursday is in 2.'),
  chain(
    { authorId: 'strategist', text: 'Anyone else\'s yogurt go missing?' },
    { authorId: 'copywriter', text: 'Mine had my name on it.' },
    { authorId: 'strategist', text: 'Mine had a policy number on it.' },
  ),
  solo('copywriter', 'Ate lunch outside today. Saw a bird. It didn\'t need approval to do anything. Thought about that a lot.'),
  chain(
    { authorId: 'contractor', text: 'DesignHub Pro does not participate in team lunches per vendor agreement 4.1. Regards.' },
    { authorId: 'pm', text: 'Nobody invited you.' },
    { authorId: 'contractor', text: 'Noted. Regards.' },
  ),
  solo('suit', 'Took the client to the steakhouse. Expensed it under "relationship investment." HQ approved it in 4 minutes. Faster than any deck 🙌'),
  chain(
    { authorId: 'pm', text: 'Microwave queue is 6 deep.' },
    { authorId: 'strategist', text: 'Average 2.5 minutes each. 15 minute wait. Not worth it.' },
    { authorId: 'copywriter', text: 'Cold pasta it is.' },
  ),
  solo('strategist', 'The cafeteria\'s new "wellness bowl" is the old salad with a new name. Benchmarking says that\'s industry standard.'),
  chain(
    { authorId: 'vance', text: 'Who wants to grab a coffee and align?' },
    { authorId: 'copywriter', text: 'Just the coffee, please.' },
  ),
  solo('copywriter', 'Someone left a single donut in the kitchen. Nobody\'s taking it. We\'ve all been trained.'),
  chain(
    { authorId: 'pm', text: 'Snack budget for Q4: $40.' },
    { authorId: 'suit', text: 'Per person?' },
    { authorId: 'pm', text: 'Per office.' },
  ),
  solo('strategist', 'Ordered a sandwich. It came in a box with the OmniPubDent values printed on it. Read all 11 while eating. Still hungry.'),
  chain(
    { authorId: 'copywriter', text: 'Is the oat milk still in the fridge?' },
    { authorId: 'pm', text: 'Discontinued. Cost-saving initiative.' },
    { authorId: 'copywriter', text: 'Of course.' },
  ),
  solo('suit', 'Brought in bagels for the team! Well, for the meeting. But you\'re all invited to the meeting 🙌'),
  chain(
    { authorId: 'strategist', text: 'Theory: the cafeteria soup is the same soup every day with different labels.' },
    { authorId: 'copywriter', text: 'Tested this. Tuesday\'s "tomato bisque" and Friday\'s "harvest vegetable" are identical.' },
  ),
  solo('pm', 'Please stop leaving dishes in the sink. Facilities has started photographing them.'),
  chain(
    { authorId: 'vance', text: 'Big believer in breakfast as a strategic advantage.' },
    { authorId: 'copywriter', text: 'What did you have?' },
    { authorId: 'vance', text: 'A meeting.' },
  ),
  solo('copywriter', 'Making toast at my desk is apparently a "fire safety concern" and also, per the email, "not on brand."'),
];

// ─── #Morale Content (memes) ─────────────────────────────────────────────────

const MEMES_POOL: AmbientChain[] = [
  chain(
    { authorId: 'hr', text: 'This channel is for pre-approved morale content only. All submissions are subject to review under Communications Policy 9.1.' },
    { authorId: 'copywriter', text: 'me: I\'ll leave at 5 today\nmy calendar: lol\nmy slack: lol\nmy laptop at 9pm: lol', reactions: r('😂', 5) },
  ),
  solo('copywriter', 'Nobody:\nAbsolutely nobody:\nVance: "Let\'s circle back on this"'),
  solo('strategist', 'Brief says "think outside the box"\nClient feedback: "not like that"', undefined, '  BRIEF: Think outside the box\n  ┌─────────────────────┐\n  │  CLIENT: Not like   │\n  │  that. Get back in  │\n  │  the box.           │\n  └─────────────────────┘'),
  solo('copywriter', 'Meetings that could have been emails\n  ╱|、\n(˚ˎ 。7\n |、˜〵\n じしˍ,)ノ\nthat\'s it. that\'s the meme.'),
  solo('pm', 'Timeline: 2 weeks\nScope creep: am I a joke to you\nTimeline: 6 weeks'),
  solo('strategist', 'Reading the brief vs guessing what the client actually wants', undefined, '┌──────────────┐\n│  DRAKE  NO:  │ Reading the brief\n├──────────────┤\n│  DRAKE YES:  │ Guessing what the\n│              │ client actually wants\n└──────────────┘'),
  solo('copywriter', 'POV: you\'re a tagline that survived 7 rounds of feedback\n\n  * * *   BATTLE SCARRED   * * *'),
  solo('pm', '"Can you just make it pop?"\n\n(┛◉Д◉)┛彡┻━┻'),
  solo('strategist', 'The four horsemen of the apocalypse:\n1. "Quick question"\n2. "Per my last email"\n3. "Going forward"\n4. "Let\'s take this offline"'),
  solo('copywriter', 'Me: *writes perfect headline*\nClient: "Can we try something more... blue?"'),
  solo('pm', '  EXPECTATION     REALITY\n ┌─────────┐   ┌─────────┐\n │ Creative │   │ 47 email│\n │ freedom  │   │ threads │\n │          │   │ about   │\n │          │   │ font    │\n │          │   │ size    │\n └─────────┘   └─────────┘'),
  chain(
    { authorId: 'copywriter', text: 'Me before the acquisition: 🎬\nMe after the acquisition: 📎' },
    { authorId: 'strategist', text: 'The paperclip is accurate.' },
  ),
  solo('strategist', 'Approval chain speedrun:\nAny%: 3 weeks\nNo-meetings%: impossible'),
  chain(
    { authorId: 'suit', text: 'Made a meme! "When the client says yes on the first round" 🙌\n[it\'s just a picture of a unicorn]' },
    { authorId: 'copywriter', text: 'Mythical. Accurate.' },
  ),
  solo('pm', 'Me: *closes 40 tickets*\nOmniTrack: 41 new tickets have been assigned to you'),
  chain(
    { authorId: 'copywriter', text: 'Vance explaining a 5-minute update:\n[slide 1 of 38]' },
    { authorId: 'vance', text: 'Great content. Let\'s socialize this.' },
  ),
  solo('strategist', 'Types of feedback:\n1. Useful\n2. Contradictory\n3. "Let\'s see it in situ"\n4. Silence (approval?)\n5. Silence (death)'),
  solo('copywriter', 'The old agency: "what if we tried something crazy"\nOmniPubDent: "what if we tried the template"'),
  chain(
    { authorId: 'pm', text: 'How it started: "quick tweak"\nHow it\'s going: v47_FINAL_FINAL_use_this_one.pptx' },
    { authorId: 'copywriter', text: 'That\'s not a meme that\'s a file.' },
  ),
  solo('suit', 'POV: you\'re the account lead and the client says "we need to talk" 😅 (it was about parking)'),
  solo('strategist', 'Me: makes a 2x2\nVance: "can we make it a 3x3"\nMe: makes a 3x3\nVance: "simpler"'),
  chain(
    { authorId: 'copywriter', text: 'Pat walks in\nEveryone: *alt-tabs*' },
    { authorId: 'pm', text: 'This one might not be pre-approved.' },
  ),
  solo('pm', 'Things that need approval:\n- decks\n- fonts\n- lunch\n- this meme'),
  solo('copywriter', 'Brand guide v1: "be bold"\nBrand guide v14: "be"'),
  chain(
    { authorId: 'strategist', text: 'Me: answers email in 4 minutes\nThe email: "thanks!"\nMe: answers in 4 minutes' },
    { authorId: 'copywriter', text: 'Please stop answering "thanks."' },
  ),
  solo('suit', 'When HQ replies-all with 🙌 and you reply-all with 🙌🙌'),
  solo('pm', '"Quick sync" (60 min)\n"Brief chat" (90 min)\n"Short check-in" (the rest of my life)'),
  chain(
    { authorId: 'contractor', text: 'Humor deliverables are not included in the current SOW. Regards.' },
    { authorId: 'copywriter', text: 'That\'s the funniest thing anyone\'s posted here.' },
  ),
  solo('copywriter', 'Every deck:\nSlide 1: Title\nSlide 2: Agenda\nSlide 3-70: The agenda but longer'),
  solo('strategist', 'Me in 2022: behavioral economics thesis\nMe in this office: makes the logo bigger on slide 4'),
  chain(
    { authorId: 'pm', text: 'Office tour:\n🖥️ desk\n🖥️ desk\n🖥️ desk\n☕ broken coffee machine\n🚪 Vance\'s 4th meeting room' },
    { authorId: 'vance', text: 'Love the shoutout.' },
  ),
  solo('copywriter', 'The client: "make it more premium"\nMe: *adds a gradient*\nThe client: "perfect"'),
  solo('suit', 'Upsell bingo 🚀\n[retainer] [audit] [refresh] [FREE SPACE: synergy] [workshop]'),
  solo('strategist', 'Productivity this week:\n████░░░░░░ 40%\nMeetings about productivity:\n██████████ 100%'),
  chain(
    { authorId: 'copywriter', text: '"We\'re a family here"\nThe family: *requires 3 forms to take Friday off*' },
    { authorId: 'pm', text: '4 forms. They added one.' },
  ),
  solo('pm', 'The Gantt chart at the start of the project: 📈\nThe Gantt chart now: 🍝'),
  solo('copywriter', 'Fun fact: this channel\'s description says "pre-approved humor only" which is the most dystopian sentence I\'ve ever written down'),
  solo('vance', 'Here\'s a morale meme I made:\n"Teamwork makes the dream work... and the dream is Q4 targets!"'),
  chain(
    { authorId: 'strategist', text: 'Me: why is this taking so long\nThe approval chain: 16 steps\nStep 15: approving steps 1-14' },
    { authorId: 'pm', text: 'I made step 15. I\'m not proud of it.' },
  ),
  solo('copywriter', 'Me opening the new template:\n( ͡° ʖ̯ ͡°)'),
];

// ─── #Structured Creativity (haiku) ──────────────────────────────────────────

const HAIKU_POOL: AmbientChain[] = [
  chain(
    { authorId: 'copywriter', text: 'Standup was cancelled\nThe joy was brief and fragile\nNow we have two more' },
    { authorId: 'strategist', text: 'That is six syllables.' },
  ),
  solo('copywriter', 'Open plan office\nI can hear you breathing, Greg\nPlease stop doing that'),
  solo('pm', 'Sprint is almost done\nNew requirements just dropped\nSprint is never done'),
  solo('strategist', 'The deck is perfect\nClient wants "one small change" though\nThe deck is ruined'),
  solo('copywriter', 'WiFi is down again\nI am free from all meetings\nNevermind it\'s back'),
  chain(
    { authorId: 'suit', text: 'Synergy is key\nLet us leverage our assets\nI don\'t know what that means' },
    { authorId: 'strategist', text: 'That last line is seven syllables. This channel has standards.' },
  ),
  solo('pm', 'Please update the board\nThe board has too many cards\nPlease update the board'),
  solo('copywriter', 'My chair was stolen\nI filed a formal complaint\nNow I have no desk'),
  solo('copywriter', 'Approved copy, sent\nIt says nothing, says it well\nI used to write films'),
  solo('strategist', 'Four minute replies\nThe inbox is always clean\nI am also clean'),
  solo('vance', 'Leverage the dream\nSynergize the north star, team\nCircle back on joy'),
  solo('pm', 'Sixteen step sign-off\nStep fifteen confirms the rest\nStep sixteen is me'),
  solo('suit', 'Client said "it\'s fine"\nI wrote "exceeded the brief"\nPromotion pending 🙌'),
  solo('copywriter', 'Logo moved four px\nThen it moved back the four px\nThis is my career'),
  chain(
    { authorId: 'strategist', text: 'Two by two matrix\nAll the meetings top right box\nNo one reads the box' },
    { authorId: 'pm', text: 'I read the box.' },
  ),
  solo('contractor', 'Revisions: two max\nThird revision is billed extra\nRegards, DesignHub'),
  solo('copywriter', 'Brand guide, version four-\nteen: delight is now banned. Still,\nI feel it sometimes'),
  solo('pm', 'OmniTrack is down\nWe cannot log any work\nSo no work was done'),
  solo('strategist', 'Benchmark, thirty-first\nOf forty-seven offices\nThat is fine. That\'s fine.'),
  chain(
    { authorId: 'copywriter', text: 'Old agency days\nWe made things that people felt\nNow I make slide nine' },
    { authorId: 'strategist', text: 'That one was actually good. Don\'t tell anyone.' },
  ),
  solo('vance', 'Quick five minute sync\nBooked for sixty, just in case\nCase: it took ninety'),
  solo('suit', 'Lanyard on my neck\nOmniPubDent, proud and strong\nIt is a bit tight'),
  solo('pm', 'Expense form B now\nForm A is retired, gone, dead\nForm C coming soon'),
  solo('copywriter', 'Wrote a line that rhymed\nDeleted it right away\nNo one saw. (Alex saw.)'),
  solo('strategist', 'Insight: customers\nWant the product to just work\nHeadline: "It Works." Done.'),
  solo('pm', 'Out of office, me?\nThirty days notice required\nI\'ll be sick next March'),
  solo('copywriter', 'Coffee on floor three\nMakes a sound like it\'s grieving\nI relate to it'),
  solo('suit', 'Upsell, cross-sell, sell\nRetainer, workshop, audit\nI dream in invoice'),
  chain(
    { authorId: 'vance', text: 'Values: we have eleven\nI can name at least zero\nLet\'s take this offline' },
    { authorId: 'strategist', text: 'First line is eight syllables, Vance.' },
  ),
  solo('copywriter', 'The footer says "Confidential"\nBut with purpose now, says Vance\nThe footer is me'),
  solo('pm', 'Deck at seventy\nMax allowed is seventy\nSomeone added one'),
  solo('strategist', 'Response time, falling\nThree fifty-two, minutes, mine\nWho is this helping'),
  solo('copywriter', 'Monday, the new blue\nTuesday, the old blue, approved\nWednesday, there is grey'),
  solo('contractor', 'Final means final\nPer SOW section three-two\nThank you. Regards. Bye.'),
  solo('pm', 'Badge out for lunch break\nThirty minutes, timed, tracked, logged\nI ate in the car'),
  solo('suit', 'HQ sent a fruit\nPlatter for forty offices\nWe received the melon'),
  solo('copywriter', 'Spark of an idea\nPM asks if it\'s in scope\nSpark goes back to sleep'),
  solo('strategist', 'Focus group of four\nTwo headlines tied, one left early\nStatistically: meh'),
  solo('pm', 'Ticket forty-one\nAssigned to me while I closed\nTicket forty. Cool.'),
  solo('copywriter', 'A bird outside, free\nNo approval chain for flight\nI watched it for lunch'),
  solo('vance', 'Q4 narrative\nWho owns it? I do. We do.\nCo-ownership, yes'),
];

// ─── #watercooler (random) ───────────────────────────────────────────────────

const RANDOM_POOL: AmbientChain[] = [
  solo('copywriter', '🦆'),
  chain(
    { authorId: 'copywriter', text: 'who keeps moving my chair' },
    { authorId: 'pm', text: 'What chair?' },
    { authorId: 'copywriter', text: 'MY chair. The one that was at MY desk. It\'s gone. Again.' },
    { authorId: 'strategist', text: 'I saw facilities moving furniture at 6am. Could be related.' },
  ),
  solo('copywriter', 'Is it 4pm already? Is this all there is?'),
  solo('strategist', 'Do you ever think about how "deadline" has the word "dead" in it?'),
  solo('pm', 'Does anyone else feel like today has been three days long?'),
  solo('copywriter', 'The printer on floor 2 has started making decisions on its own. I respect it.'),
  solo('suit', 'Has anyone seen my mug? It says "World\'s Most Adequate Employee." It has sentimental value.'),
  solo('strategist', 'It\'s 4pm. What are we all doing here. What is the point of anything.'),
  chain(
    { authorId: 'copywriter', text: 'Watched an old movie last night. Network. Felt seen.' },
    { authorId: 'strategist', text: 'The "mad as hell" one?' },
    { authorId: 'copywriter', text: 'I\'m mildly inconvenienced as hell.' },
  ),
  solo('suit', 'Golfed with a client this weekend. Lost on purpose. Won the account 🙌'),
  chain(
    { authorId: 'pm', text: 'Weekend plans?' },
    { authorId: 'strategist', text: 'Catching up on emails.' },
    { authorId: 'copywriter', text: 'Staring at a wall.' },
    { authorId: 'suit', text: 'Networking brunch!' },
  ),
  solo('strategist', 'My LinkedIn says "passionate about insights." I wrote that during the acquisition. I don\'t remember being passionate.'),
  chain(
    { authorId: 'copywriter', text: 'Does anyone else dream about slide templates?' },
    { authorId: 'pm', text: 'I dream about the approval chain. It\'s longer in the dream.' },
  ),
  solo('vance', 'Fun fact about me: I\'ve never not been in a meeting. Even now, technically.'),
  chain(
    { authorId: 'suit', text: 'Got a new lanyard. It\'s the same lanyard but I feel more aligned 🚀' },
    { authorId: 'copywriter', text: 'What changed?' },
    { authorId: 'suit', text: 'My mindset.' },
  ),
  solo('copywriter', 'Started a band. We\'re called Scope Creep. We only play covers.'),
  chain(
    { authorId: 'strategist', text: 'The plant by the window died.' },
    { authorId: 'pm', text: 'It was fake.' },
    { authorId: 'strategist', text: 'Then how did it die.' },
  ),
  solo('pm', 'My therapist asked what I do for fun. I said "update the board." She wrote something down.'),
  chain(
    { authorId: 'copywriter', text: 'Found a Post-it from the old agency under my desk. It says "MAKE IT WEIRD."' },
    { authorId: 'strategist', text: 'Keep it.' },
    { authorId: 'copywriter', text: 'I put it back. Felt safer down there.' },
  ),
  solo('suit', 'Reading a book about leadership. Chapter one is just a photo of the author shaking hands. Inspiring 🙌'),
  chain(
    { authorId: 'strategist', text: 'Is the clock in the kitchen fast or slow?' },
    { authorId: 'pm', text: 'It\'s HQ time.' },
    { authorId: 'strategist', text: 'Which is?' },
    { authorId: 'pm', text: 'Nobody knows.' },
  ),
  solo('copywriter', 'My mom asked what I do now. I said "compliance writing." She said "oh, honey."'),
  chain(
    { authorId: 'vance', text: 'Anyone into pickleball? Thinking of making it a team-building initiative.' },
    { authorId: 'copywriter', text: 'Is it mandatory?' },
    { authorId: 'vance', text: 'It\'s encouraged. In a mandatory way.' },
  ),
  solo('strategist', 'Ran a survey of the office: 100% of respondents want the old coffee machine back. 1 respondent.'),
  chain(
    { authorId: 'pm', text: 'There\'s a raccoon in the parking garage.' },
    { authorId: 'copywriter', text: 'Is it ok?' },
    { authorId: 'pm', text: 'It looks happier than us.' },
  ),
  solo('suit', 'Hot tip: the 6th floor bathroom is the HQ bathroom. The soap is better. Don\'t tell anyone 🙌'),
  chain(
    { authorId: 'copywriter', text: 'Is it weird that I miss deadlines that meant something?' },
    { authorId: 'strategist', text: 'No.' },
  ),
  solo('strategist', 'Counted the ceiling tiles in conference room B during the sync. 312. One is cracked. It\'s me.'),
  chain(
    { authorId: 'suit', text: 'Who wants to do trivia night Thursday?' },
    { authorId: 'pm', text: 'There\'s a review Thursday.' },
    { authorId: 'suit', text: 'Trivia night Friday?' },
    { authorId: 'pm', text: 'Also a review.' },
  ),
  solo('copywriter', 'Wrote a short story this weekend. Nobody had to approve it. I didn\'t know what to do with that feeling.'),
  chain(
    { authorId: 'pm', text: 'The elevator now plays the OmniPubDent jingle.' },
    { authorId: 'strategist', text: 'There\'s a jingle?' },
    { authorId: 'pm', text: 'There is now.' },
  ),
  solo('vance', 'Just finished a podcast about productivity. 3 hours long. Very efficient.'),
  chain(
    { authorId: 'copywriter', text: 'What happened to Morgan, Sam and Riley? Anyone still in touch?' },
    { authorId: 'strategist', text: 'Riley texts sometimes. From a beach.' },
    { authorId: 'copywriter', text: 'Good for Riley.' },
  ),
  solo('strategist', 'Sat in my car for 10 minutes before coming in today. Benchmarked: everyone else does 12.'),
  chain(
    { authorId: 'suit', text: 'Thinking about getting a dog!' },
    { authorId: 'pm', text: 'Who will watch it during the 60-minute syncs?' },
    { authorId: 'suit', text: '...thinking about getting a fish.' },
  ),
  solo('copywriter', 'Heard laughing from the 4th floor. Went up to check. It was a training video.'),
  chain(
    { authorId: 'contractor', text: 'This channel appears to be off-topic. DesignHub Pro does not engage in off-topic communication. Regards.' },
    { authorId: 'copywriter', text: 'You\'re engaging right now.' },
    { authorId: 'contractor', text: 'This message was in scope. Regards.' },
  ),
  solo('pm', 'Took a mental health day. Spent it reorganizing my spice rack by color. Felt like work. Felt good.'),
  solo('suit', 'Friday casual is now "Friday business casual." I\'m wearing the fun lanyard 🙌'),
  chain(
    { authorId: 'strategist', text: 'Is anyone else still on the old agency group text?' },
    { authorId: 'copywriter', text: 'It\'s mostly memes now.' },
    { authorId: 'strategist', text: 'Unapproved memes.' },
    { authorId: 'copywriter', text: 'The best kind.' },
  ),
];

// ─── Registry ────────────────────────────────────────────────────────────────

const POOLS: Record<string, AmbientChain[]> = {
  general: GENERAL_POOL,
  creative: CREATIVE_POOL,
  food: FOOD_POOL,
  memes: MEMES_POOL,
  haiku: HAIKU_POOL,
  random: RANDOM_POOL,
};

export function getAmbientPool(channel: ChannelId): AmbientChain[] {
  return POOLS[channel] ?? [];
}

/** Stable id for a chain (based on its first line), used for seen-tracking. */
export function chainId(channel: string, c: AmbientChain): string {
  const first = c.messages[0];
  const key = `${first.authorId}|${first.text}`;
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return `${channel}:${(h >>> 0).toString(36)}`;
}

export function chainHasPat(c: AmbientChain): boolean {
  return c.messages.some(m => m.authorId === 'hr');
}
