import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGIN = /^https:\/\/((www\.)?postagencyrpg\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/localhost(:\d+)?$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = (req.headers.origin as string) || '';
  if (!ALLOWED_ORIGIN.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
