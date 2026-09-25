import type { VercelRequest, VercelResponse } from '@vercel/node';

// Only the models the game actually calls. Anything else is rejected before it
// touches the API key.
const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  'claude-sonnet-5',
  'claude-opus-5-5',
]);

// Highest max_tokens the game asks for is 8000 (terminal/tool "game" builds).
const MAX_TOKENS_CAP = 8192;

// Browsers attach Origin to POSTs; requests from anywhere else are refused.
// (A determined script can fake this header, but it stops drive-by abuse.)
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?postagencyrpg\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = (req.headers.origin as string) || '';
  if (!ALLOWED_ORIGIN.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body ?? {};
  if (typeof body.model !== 'string' || !ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: 'Model not allowed' });
  }
  if (typeof body.max_tokens !== 'number' || body.max_tokens > MAX_TOKENS_CAP) {
    body.max_tokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_CAP);
  }
  if (body.stream) {
    return res.status(400).json({ error: 'Streaming not supported' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
