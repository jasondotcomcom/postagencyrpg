export interface ContentSection {
  type: 'header' | 'text';
  content: string;
}

// Patterns that indicate section headers in AI output
const HEADER_PATTERNS = [
  /^([A-Z][A-Z\s&/]{2,}):(.*)$/,           // HEADLINE: ..., BODY COPY: ...
  /^\[([A-Z][A-Z\s&/]{2,})\]\s*(.*)$/,     // [HERO], [CTA]
  /^(SCENE\s*\d+)\s*[:\-—]\s*(.*)$/i,       // SCENE 1: ...
  /^(ACT\s*\d+)\s*[:\-—]\s*(.*)$/i,         // ACT 1: ...
  /^(SLIDE\s*\d+)\s*[:\-—]\s*(.*)$/i,       // SLIDE 1: ...
  /^(FRAME\s*\d+)\s*[:\-—]\s*(.*)$/i,       // FRAME 1: ...
  /^(PANEL\s*\d+)\s*[:\-—]\s*(.*)$/i,       // PANEL 1: ...
];

// Sections to hide (image is already shown above)
const HIDDEN_SECTIONS = [
  'VISUAL DESCRIPTION',
  'IMAGE DESCRIPTION',
  'IMAGE PROMPT',
  'ART DIRECTION',
];

export function parseContent(raw: string): ContentSection[] {
  if (!raw) return [];

  const lines = raw.split('\n');
  const sections: ContentSection[] = [];
  let currentText: string[] = [];
  let isHidden = false;

  const flushText = () => {
    if (currentText.length > 0) {
      const text = currentText.join('\n').trim();
      if (text && !isHidden) {
        sections.push({ type: 'text', content: text });
      }
      currentText = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentText.push('');
      continue;
    }

    let matched = false;
    for (const pattern of HEADER_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        flushText();
        const headerName = match[1].trim();

        // Check if this section should be hidden
        isHidden = HIDDEN_SECTIONS.some(
          (h) => headerName.toUpperCase().includes(h),
        );

        if (!isHidden) {
          sections.push({ type: 'header', content: headerName });
          // If there's inline content after the header label, add it
          const inline = match[2]?.trim();
          if (inline) {
            currentText.push(inline);
          }
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentText.push(line);
    }
  }

  flushText();
  return sections;
}

export function isVideoType(type: string): boolean {
  return type === 'video' || type === 'tiktok_series';
}

export function stripTrailingVisualDescription(raw: string): string {
  const marker = 'VISUAL DESCRIPTION:';
  const index = raw.lastIndexOf(marker);
  if (index === -1) return raw;
  return raw.substring(0, index).trimEnd();
}

export function getQuickGet(preview: string | undefined, content: string, type: string): string {
  if (preview) return preview;
  if (isVideoType(type)) return generateScriptSummary(content);
  // Fallback: first 2-3 sentences
  const stripped = stripTrailingVisualDescription(content);
  const sentences = stripped.split(/(?<=[.!?])\s+/).slice(0, 3);
  return sentences.join(' ');
}

function generateScriptSummary(content: string): string {
  const stripped = stripTrailingVisualDescription(content);
  // Extract key visual and audio beats from shot-based scripts
  const shots = stripped.match(/━━━\s*SHOT\s*\d+[^━]*/gi) || [];
  if (shots.length > 0) {
    const beats = shots.slice(0, 3).map(shot => {
      const visualMatch = shot.match(/VISUAL:\s*(.+)/i);
      return visualMatch ? visualMatch[1].trim().split('.')[0] : '';
    }).filter(Boolean);
    if (beats.length > 0) return beats.join('. ') + '.';
  }
  // Fallback: first 2-3 sentences
  const sentences = stripped.split(/(?<=[.!?])\s+/).slice(0, 3);
  return sentences.join(' ');
}
