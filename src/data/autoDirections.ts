// ─── Auto-Generated Creative Directions ("Surprise Me") ─────────────────────

interface Direction {
  text: string;
  quality: 'good' | 'mid' | 'bad';
}

const goodDirections: Direction[] = [
  { text: "Challenge every assumption the client made. Rebuild from the audience's actual needs.", quality: 'good' },
  { text: "Go brutally minimal. One image, one line. Make them feel something before they think.", quality: 'good' },
  { text: "Find the tension in the brief and lean into it. The conflict IS the campaign.", quality: 'good' },
  { text: "Forget the category. What would this look like if it were a music video? A protest? A love letter?", quality: 'good' },
  { text: "Start with the audience's biggest frustration. Build the whole thing around solving that moment.", quality: 'good' },
  { text: "Kill the tagline. Let the work speak. If it needs explaining, it's not bold enough.", quality: 'good' },
  { text: "Make it feel like a cultural moment, not an ad. People should share it because they want to, not because we asked.", quality: 'good' },
  { text: "What would we make if we knew the client would say yes to anything? Start there, then barely pull back.", quality: 'good' },
  { text: "Flip the medium. If everyone expects digital, go physical. If they expect polished, go raw.", quality: 'good' },
  { text: "Find the one human truth hiding in the data and make that the entire campaign.", quality: 'good' },
];

const midDirections: Direction[] = [
  { text: "Follow best practices. Clean execution, clear messaging, deliver on time.", quality: 'mid' },
  { text: "Stay within the brand guidelines. Make it polished and professional.", quality: 'mid' },
  { text: "Use proven frameworks. Don't reinvent the wheel.", quality: 'mid' },
  { text: "Look at what competitors are doing and do it slightly better.", quality: 'mid' },
  { text: "Focus on the key benefit. Keep the message simple and repeatable.", quality: 'mid' },
  { text: "Make sure it tests well with focus groups. Minimize risk.", quality: 'mid' },
];

const badDirections: Direction[] = [
  { text: "Leverage synergistic paradigm shifts to optimize stakeholder engagement vectors.", quality: 'bad' },
  { text: "Per the VP's nephew's suggestion, make it more like TikTok but for shareholders.", quality: 'bad' },
  { text: "Disrupt the vertical by pivoting our deliverables into a scalable thought-leadership ecosystem.", quality: 'bad' },
  { text: "Align the brand's north star with our synergy matrix for maximum stakeholder amplification.", quality: 'bad' },
  { text: "Circle back on the blue-sky ideation to ensure we're moving the needle on core competencies.", quality: 'bad' },
  { text: "Activate a 360-degree omnichannel touchpoint strategy that ladders up to our Q3 KPIs.", quality: 'bad' },
];

function pickWeightedPool(): Direction[] {
  const roll = Math.random();
  if (roll < 0.5) return goodDirections;      // 50%
  if (roll < 0.8) return midDirections;        // 30%
  return badDirections;                        // 20%
}

function pickRandom(pool: Direction[]): Direction {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick a random direction with weighted quality distribution. */
export function getRandomDirection(): Direction {
  return pickRandom(pickWeightedPool());
}

/** Pick a random direction, excluding one that matches `current` text. */
export function getRandomDirectionExcluding(current: string): Direction {
  // Try up to 20 times to get something different
  for (let i = 0; i < 20; i++) {
    const dir = getRandomDirection();
    if (dir.text !== current) return dir;
  }
  // Fallback: just return whatever we get
  return getRandomDirection();
}

/** Get score modifiers based on direction quality. */
export function getDirectionScoreModifier(quality: string): { penalty: number; boldnessMultiplier: number } {
  switch (quality) {
    case 'good': return { penalty: 0, boldnessMultiplier: 1.2 };
    case 'mid':  return { penalty: -2, boldnessMultiplier: 0.8 };
    case 'bad':  return { penalty: -5, boldnessMultiplier: 0.5 };
    default:     return { penalty: 0, boldnessMultiplier: 1.0 };
  }
}
