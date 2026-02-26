import type { Campaign, CampaignConcept, DeliverableType, Platform } from '../types/campaign';
import { getTeamMembers } from '../data/team';

// ─── Claude Text Generation ──────────────────────────────────────────────────

async function generateDeliverableText(
  deliverable: { type: DeliverableType; platform: Platform; description: string },
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string
): Promise<string> {
  const prompt = getDeliverablePrompt(
    deliverable.type,
    deliverable.platform,
    deliverable.description,
    campaign,
    concept,
    feedback
  );

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── DALL-E Image Generation ─────────────────────────────────────────────────

let _openaiKeyMissing = false;

async function generateDeliverableImage(
  visualDescription: string,
  deliverableType: DeliverableType
): Promise<string | undefined> {
  if (_openaiKeyMissing) return undefined;

  const size = getSizeForDeliverableType(deliverableType);

  try {
    const response = await fetch('/api/openai/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: visualDescription,
        n: 1,
        size,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (response.status === 401 || errorText.includes('invalid_api_key')) {
        _openaiKeyMissing = true;
        console.warn(
          'DALL-E image generation requires OPENAI_API_KEY. Add it to .env.local.'
        );
        return undefined;
      }
      throw new Error(`DALL-E API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.warn('Image generation failed:', error);
    return undefined;
  }
}

// ─── Visual Description Extraction ───────────────────────────────────────────

export function extractVisualDescription(textContent: string): string | null {
  const marker = 'VISUAL DESCRIPTION:';
  const index = textContent.lastIndexOf(marker);
  if (index === -1) return null;
  return textContent.substring(index + marker.length).trim();
}

// ─── Image Sizes ─────────────────────────────────────────────────────────────

function getSizeForDeliverableType(
  type: DeliverableType
): '1024x1024' | '1792x1024' | '1024x1792' {
  switch (type) {
    case 'billboard':
    case 'print_ad':
    case 'landing_page':
    case 'video':
      return '1792x1024'; // Landscape
    case 'tiktok_series':
      return '1024x1792'; // Portrait
    default:
      return '1024x1024'; // Square
  }
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

function extractQuickGet(text: string): { preview: string | undefined; content: string } {
  const match = text.match(/^QUICK GET:\s*([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (match) {
    return { preview: match[1].trim(), content: match[2].trim() };
  }
  return { preview: undefined, content: text };
}

export async function generateDeliverable(
  deliverable: { type: DeliverableType; platform: Platform; description: string },
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string,
  retryCount = 0
): Promise<{ content: string; imageUrl?: string; preview?: string }> {
  try {
    const textContent = await generateDeliverableText(
      deliverable,
      campaign,
      concept,
      feedback
    );

    const { preview, content } = extractQuickGet(textContent);

    let imageUrl: string | undefined;
    try {
      const visualDesc = extractVisualDescription(content);
      if (visualDesc) {
        imageUrl = await generateDeliverableImage(visualDesc, deliverable.type);
      }
    } catch {
      // Image failure is non-fatal
    }

    return { content, imageUrl, preview };
  } catch (error) {
    if (retryCount < 1) {
      await new Promise((r) => setTimeout(r, 1000));
      return generateDeliverable(deliverable, campaign, concept, feedback, retryCount + 1);
    }
    throw error;
  }
}

// ─── Prompt Templates ────────────────────────────────────────────────────────

function getDeliverablePrompt(
  type: DeliverableType,
  platform: Platform,
  description: string,
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string
): string {
  const members = campaign.conceptingTeam
    ? getTeamMembers(campaign.conceptingTeam.memberIds)
    : [];
  const teamNames = members.map((m) => `${m.name} (${m.role})`).join(', ');

  const context = `
CAMPAIGN CONTEXT:
Client: ${campaign.clientName}
Campaign: ${campaign.campaignName}
Brief Challenge: ${campaign.brief.challenge}
Target Audience: ${campaign.brief.audience}
Key Message: ${campaign.brief.message}
Vibe/Tone: ${campaign.brief.vibe}

CHOSEN CONCEPT: "${concept.name}"
Tagline: "${concept.tagline}"
Big Idea: ${concept.bigIdea}
Tone: ${concept.tone}

PLAYER'S STRATEGIC DIRECTION: ${campaign.strategicDirection}

CREATIVE TEAM: ${teamNames}

DELIVERABLE: ${description}
PLATFORM: ${platform}
`.trim();

  const revisionNote = feedback
    ? `\n\nPREVIOUS FEEDBACK (address this in your revision):\n${feedback}\n`
    : '';

  const typePrompt = getTypeSpecificPrompt(type, platform);

  return `You are a world-class creative team at an advertising agency. Generate content for the following deliverable. Write deliverables that are immediately compelling. The reader should understand what this is and why it's exciting within the first two sentences. Avoid vague setup language — lead with the idea, not the context. Be specific and vivid. Then go deep.

${context}
${revisionNote}

Begin your response with "QUICK GET:" followed by a 2-3 sentence elevator pitch of what this deliverable IS and why it's exciting. Be specific and vivid. Lead with the idea, not context. Then write "---" on its own line and proceed with the full content.

${typePrompt}

End your response with a section labeled "VISUAL DESCRIPTION:" that describes a single compelling image to accompany this deliverable. Be specific about composition, colors, mood, style, lighting, and subject matter. This description will be used to generate the image via AI. Do NOT include any text or words in the visual description — describe only the visual elements.`;
}

function getTypeSpecificPrompt(type: DeliverableType, platform: Platform): string {
  switch (type) {
    case 'social_post':
      return `Create a ${platform} social media post.

Generate:
1. Caption (2-3 engaging sentences, on-brand for the concept)
2. Hashtags (5-8 relevant tags)
3. Call-to-action

Format your response as:
CAPTION:
[caption text]

HASHTAGS:
#tag1 #tag2 #tag3 ...

CTA:
[call to action]`;

    case 'video':
      return `Create a professional production script (30-60 seconds).

Generate an integrated shot-by-shot script. DO NOT separate visual descriptions from shots — each shot must be a self-contained block with its own VISUAL, AUDIO, and TEXT OVERLAY directions.

Format your response EXACTLY like this:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [DELIVERABLE NAME] — [DURATION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUSIC: [overall music direction — genre, energy, tempo, mood]

━━━ SHOT 1 — COLD OPEN (0:00–0:05) ━━━
VISUAL: [camera angle, movement, lighting, mood, colors, what we see]
AUDIO: [music cue / VO / SFX for this moment]
TEXT OVERLAY: [any on-screen text]

━━━ SHOT 2 — [SHOT NAME] (0:05–0:15) ━━━
VISUAL: [camera angle, movement, lighting, mood, colors, what we see]
AUDIO: [music cue / VO / SFX for this moment]
TEXT OVERLAY: [any on-screen text]

...continue for each shot (4-6 shots total)...

━━━ END CARD ━━━
VISUAL: [final frame composition]
AUDIO: [music resolve / final VO]
TEXT OVERLAY: [tagline + CTA]

PRODUCTION NOTES:
- [any additional direction]`;

    case 'tiktok_series':
      return `Create a TikTok series (3 episodes, 15-30 seconds each) as integrated production scripts.

DO NOT separate visual descriptions from shots. Each shot must be a self-contained block with VISUAL, AUDIO, and TEXT OVERLAY.

Format your response EXACTLY like this:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 1 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUSIC: [sound/music direction for this episode]

━━━ SHOT 1 — HOOK (0:00–0:03) ━━━
VISUAL: [camera angle, framing, what we see, energy]
AUDIO: [sound cue / VO / SFX]
TEXT OVERLAY: [on-screen text]

━━━ SHOT 2 — [SHOT NAME] (0:03–0:08) ━━━
VISUAL: [camera angle, framing, what we see, energy]
AUDIO: [sound cue / VO / SFX]
TEXT OVERLAY: [on-screen text]

...continue for 3-5 shots per episode...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 2 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...same format...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 3 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...same format...

HASHTAGS: #tag1 #tag2 #tag3 ...`;

    case 'twitter_thread':
      return `Create a Twitter/X thread (5-7 tweets).

Rules:
- Tweet 1 must hook — make people want to read more
- Each tweet under 280 characters
- Mix of insight, story, and data
- End with a clear CTA
- Use thread mechanics (numbering, cliffhangers)

Format your response as:
1/ [tweet text]

2/ [tweet text]

3/ [tweet text]

...continue...`;

    case 'reddit_ama':
      return `Create a Reddit AMA concept.

Generate:
1. AMA title
2. Target subreddit
3. Introduction post (authentic, non-corporate tone)
4. 5-6 key talking points / prepared responses
5. Rules for the brand team

Format your response as:
TITLE: [AMA title]
SUBREDDIT: r/[subreddit]

INTRO POST:
[full introduction text]

KEY TALKING POINTS:
1. [topic]: [prepared answer]
2. [topic]: [prepared answer]
...

TEAM RULES:
- [rule 1]
- [rule 2]
...`;

    case 'billboard':
      return `Create billboard creative.

Constraints:
- Headline: maximum 8 words (must be readable at 35mph)
- Body copy: maximum 1 short line
- Read time: under 3 seconds
- One bold visual focal point

Format your response as:
HEADLINE:
[main text — 8 words max]

BODY:
[one short supporting line]

PLACEMENT: [ideal location type]
FORMAT: 14' x 48' standard bulletin
COLOR PALETTE: [2-3 colors]
TYPOGRAPHY: [direction]`;

    case 'email_campaign':
      return `Create an email campaign.

Generate:
1. Subject line (compelling, under 60 chars)
2. Preview text (40-90 chars)
3. Email body with sections
4. Primary CTA button text

Format your response as:
SUBJECT: [subject line]
PREVIEW TEXT: [preview text]

[HEADER IMAGE DIRECTION: brief visual note]

BODY:
[greeting]

[paragraph 1 — hook/context]

[paragraph 2 — value proposition]

KEY BENEFITS:
- [benefit 1]
- [benefit 2]
- [benefit 3]

[CTA BUTTON: "button text"]

[sign-off]`;

    case 'landing_page':
      return `Create landing page content.

Generate section-by-section copy:
1. Hero section (headline + subheadline + CTA)
2. Problem section
3. Solution section with 3 key points
4. Social proof section
5. Final CTA section

Format your response as:
[HERO]
Headline: [text]
Subheadline: [text]
CTA Button: [text]

[SECTION 1 — THE PROBLEM]
Headline: [text]
Copy: [paragraph]

[SECTION 2 — THE SOLUTION]
Headline: [text]
Point 1: [headline + description]
Point 2: [headline + description]
Point 3: [headline + description]

[SECTION 3 — SOCIAL PROOF]
Headline: [text]
Testimonial: [quote]
Metrics: [key numbers]

[FINAL CTA]
Headline: [text]
CTA Button: [text]`;

    case 'experiential':
      return `Create an experiential activation concept.

Generate:
1. Experience flow (discovery → engagement → peak moment → takeaway)
2. Logistics (venue type, staffing, duration, capacity)
3. Shareability moments (designed for social capture)

Format your response as:
CONCEPT: [one-line summary]

EXPERIENCE FLOW:
1. DISCOVERY (0-2 min): [description]
2. ENGAGEMENT (2-10 min): [description]
3. THE MOMENT (peak): [description]
4. TAKEAWAY: [what participants leave with]

LOGISTICS:
Venue: [type and requirements]
Staffing: [team needed]
Duration: [hours]
Capacity: [number]

SHAREABILITY:
[what makes this phone-out worthy]`;

    case 'blog_post':
      return `Create a blog post outline with key copy.

Generate:
1. Title and meta description
2. Lede paragraph (hook the reader)
3. 3-4 sections with headlines and copy direction
4. Closing CTA

Format your response as:
TITLE: [title]
META: [155-char description]
READ TIME: ~[X] minutes

LEDE:
[opening paragraph]

SECTION 1: [HEADLINE]
[2-3 paragraph copy]

SECTION 2: [HEADLINE]
[2-3 paragraph copy]

SECTION 3: [HEADLINE]
[2-3 paragraph copy]

CLOSING:
[final paragraph with CTA]`;

    case 'podcast_ad':
      return `Create a podcast ad script (60-second host-read, mid-roll).

Rules:
- Should feel natural, not scripted
- Host endorsement tone
- Clear CTA with tracking mechanism

Format your response as:
FORMAT: Host-read, 60 seconds, mid-roll

[HOST SCRIPT]
"[full script text — conversational, authentic]"

KEY MESSAGES:
- [message 1]
- [message 2]
- [message 3]

CTA: [specific call to action with URL/code]`;

    case 'influencer_collab':
      return `Create an influencer collaboration brief.

Generate:
1. Creator brief (what we need, brand voice)
2. Do's and Don'ts
3. Deliverable requirements
4. Key messages (for the creator to express in their own voice)

Format your response as:
CREATOR BRIEF:
Brand: [name]
Campaign: [name]
What we need: [description]

KEY MESSAGES (express in your own voice):
- [message 1]
- [message 2]

DO:
- [guideline]
- [guideline]

DON'T:
- [restriction]
- [restriction]

DELIVERABLES:
- [deliverable 1]
- [deliverable 2]
Usage rights: [terms]

HASHTAGS: [required tags]`;

    case 'guerrilla':
      return `Create a guerrilla marketing activation concept.

Generate:
1. The setup (location, timing, element of surprise)
2. The execution (what happens, how people encounter it)
3. The reveal (brand moment)
4. Documentation plan (how to capture for social)

Format your response as:
CONCEPT: [one-line summary]

THE SETUP:
Location: [where]
Timing: [when]
Surprise element: [what's unexpected]

THE EXECUTION:
[step-by-step description of what happens]

THE REVEAL:
[how the brand is revealed]
[tagline moment]

DOCUMENTATION:
[how to capture content for social amplification]

LEGAL: [permit/clearance notes]`;

    case 'print_ad':
      return `Create a print advertisement.

Generate:
1. Headline (punchy, memorable)
2. Body copy (concise — 2-3 sentences max)
3. Visual concept and layout direction
4. Tagline placement

Format your response as:
HEADLINE:
[main headline]

BODY COPY:
[2-3 sentences]

TAGLINE:
[tagline]

LAYOUT DIRECTION:
[describe composition, visual hierarchy, where elements sit]

PUBLICATION TARGETS: [where this should run]`;

    default: {
      const _exhaustive: never = type;
      return `Create content for this ${String(_exhaustive)} deliverable on ${platform}. Generate appropriate creative content.`;
    }
  }
}
