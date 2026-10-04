import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Vercel Serverless Function Handler
 * Endpoint: POST /api/chat
 */
export default async function handler(req, res) {
  // CORS & Security headers
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

  // Health check endpoint (GET /api/chat)
  if (req.method === 'GET') {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' &&
        process.env.GEMINI_API_KEY !== 'your_api_key_here'
    );
    return res.status(200).json({
      status: 'ok',
      hasApiKey: hasKey,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      reply: 'Please send a POST request.',
    });
  }

  try {
    // Robust request body parsing (handles string or pre-parsed object)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        console.error('Failed to parse request JSON body:', parseError);
      }
    }

    const { message, history } = body || {};

    // 1. Validate that the message exists
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required',
        reply: 'Please provide a valid question.',
      });
    }

    // 2. Read GEMINI_API_KEY from the server environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === 'your_api_key_here') {
      console.error('[Gemini Server Error]: GEMINI_API_KEY is not configured in Vercel environment variables.');
      return res.status(500).json({
        error: 'Gemini API key is not configured.',
        details: 'GEMINI_API_KEY is missing in server environment variables.',
        reply: 'Gemini API key is not configured. Please add GEMINI_API_KEY in Vercel Project Settings.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const configuredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    // 3. Format chat history for Gemini multi-turn conversation
    // Gemini SDK expects: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedHistory = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text && typeof item.text === 'string' && item.text.trim()) {
          const role = item.sender === 'user' ? 'user' : 'model';
          formattedHistory.push({
            role,
            parts: [{ text: item.text.trim() }],
          });
        }
      }
    }

    // Candidate models to ensure resilience across API tiers
    const candidateModels = [
      configuredModel,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let replyText = '';
    let lastError = null;

    // 4. Send the conversation/message to Gemini
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        if (formattedHistory.length > 0) {
          const chat = model.startChat({
            history: formattedHistory,
          });
          const result = await chat.sendMessage(message.trim());
          const response = await result.response;
          replyText = response.text();
        } else {
          const result = await model.generateContent(message.trim());
          const response = await result.response;
          replyText = response.text();
        }

        if (replyText) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini API] Model "${modelName}" failed:`, err?.message || err);

        // Immediate stop on auth error or exhausted quota
        if (
          err?.message?.includes('API_KEY_INVALID') ||
          err?.message?.includes('API key not valid') ||
          err?.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          throw err;
        }
      }
    }

    // 5. Extract the generated text correctly
    if (!replyText) {
      if (lastError) throw lastError;
      return res.status(200).json({
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    // 6. Return JSON { reply: "actual Gemini response" }
    return res.status(200).json({
      reply: replyText.trim(),
    });
  } catch (error) {
    const errorMsg = error?.message || 'Unknown error';
    const status = error?.status || 500;
    console.error(`[Gemini API Error] Status ${status}:`, errorMsg);

    let friendlyMessage = "Sorry, I couldn't get a response right now. Please try again.";
    let errorDetail = 'Error communicating with Google Gemini API.';

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
      friendlyMessage = 'Invalid Gemini API key. Please check your GEMINI_API_KEY in Vercel settings.';
      errorDetail = 'Invalid GEMINI_API_KEY.';
    } else if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      friendlyMessage = 'Gemini API quota exceeded. Please try again later.';
      errorDetail = 'Gemini API quota exceeded.';
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Failed to generate response',
      details: errorDetail,
      reply: friendlyMessage,
    });
  }
}
