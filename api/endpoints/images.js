import { extractAuthUser } from './lib/auth.js';
import { writeCorsHeaders } from './lib/cors.js';

function getApiKey() {
  let key = process.env.IMAGE_API_KEY || process.env.GEMINI_API_KEY;
  if (key) key = key.trim().replace(/^["']|["']$/g, '');
  if (!key || key === 'YOUR_GEMINI_API_KEY' || key === 'your_api_key_here') return null;
  return key;
}

export default async function handler(req, res) {
  const isAllowedOrigin = writeCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(isAllowedOrigin ? 200 : 403).end();
  }

  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = extractAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to generate images.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { prompt } = body || {};

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Image prompt is required' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'AI image generation service is not configured.' });
  }

  try {
    // 1. First attempt: Google Imagen / Gemini 2.0 Flash Image generation
    // Use official generateImages or generative AI endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const payload = {
      instances: [{ prompt: prompt.trim() }],
      parameters: { sampleCount: 1, aspectRatio: '1:1', outputOptions: { mimeType: 'image/jpeg' } },
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
      if (base64Bytes) {
        const imageUrl = `data:image/jpeg;base64,${base64Bytes}`;
        return res.status(200).json({
          imageUrl,
          prompt: prompt.trim(),
          provider: 'imagen-3.0',
        });
      }
    }

    // 2. Fallback attempt: Pollinations high-res AI image generator (free, zero-downtime, no key needed)
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    return res.status(200).json({
      imageUrl: fallbackUrl,
      prompt: prompt.trim(),
      provider: 'pollinations',
    });
  } catch (err) {
    console.error('[Image Generation Error]:', err);
    return res.status(500).json({ error: 'Failed to generate image. Please try again.' });
  }
}
