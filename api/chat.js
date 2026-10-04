import { GoogleGenAI } from '@google/genai';

/**
 * Vercel Serverless Function Handler
 * Endpoint: POST /api/chat (and GET /api/chat for health check)
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check on GET /api/chat
  if (req.method === 'GET') {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_api_key_here' &&
        process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'
    );
    return res.status(200).json({
      status: 'ok',
      hasApiKey: hasKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      reply: 'Please send a POST request.',
    });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required',
        reply: 'Please provide a valid question.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === 'YOUR_GEMINI_API_KEY') {
      console.error('[Gemini API Error]: GEMINI_API_KEY is missing or unconfigured in server environment variables.');
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        details: 'GEMINI_API_KEY is not set in environment variables.',
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini API: role must be 'user' or 'model'
    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text && typeof item.text === 'string' && item.text.trim()) {
          const role = item.sender === 'user' ? 'user' : 'model';
          contents.push({
            role,
            parts: [{ text: item.text.trim() }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const candidateModels = [
      configuredModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let response = null;
    let lastError = null;

    for (const modelToTry of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelToTry,
          contents,
        });

        const extractedText =
          response?.text ||
          response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (extractedText) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini API] Model "${modelToTry}" failed:`, err?.message || err);

        // Immediate fail on bad auth or exhausted quota
        if (
          err?.message?.includes('API_KEY_INVALID') ||
          err?.message?.includes('API key not valid') ||
          err?.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          throw err;
        }
      }
    }

    const reply =
      response?.text ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!reply) {
      if (lastError) throw lastError;
      return res.status(200).json({
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    const errorMsg = error?.message || 'Unknown error';
    const status = error?.status || 500;
    console.error(`[Gemini API Error] Status ${status}:`, errorMsg);

    let friendlyDetail = 'Error communicating with Google Gemini API.';
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
      friendlyDetail = 'Invalid GEMINI_API_KEY. Please check your API key in environment settings.';
    } else if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      friendlyDetail = 'Gemini API quota exceeded for this API key.';
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Failed to generate response',
      details: friendlyDetail,
      reply: "Sorry, I couldn't get a response right now. Please try again.",
    });
  }
}
