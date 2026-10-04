import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Robust CORS: Allow any origin or normalize CLIENT_ORIGIN (trim trailing slashes)
const rawOrigin = process.env.CLIENT_ORIGIN;
const cleanClientOrigin = rawOrigin ? rawOrigin.trim().replace(/\/+$/, '') : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/+$/, '');
      if (!cleanClientOrigin || cleanClientOrigin === '*' || normalized === cleanClientOrigin) {
        return callback(null, true);
      }

      // Default allow so cross-domain deployment never breaks unexpectedly
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoints (supports both /health and /api/health)
app.get(['/', '/health', '/api/health'], (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_api_key_here' &&
      process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'
  );

  res.json({
    status: 'ok',
    message: 'Chatbot Backend API is running',
    hasApiKey: hasKey,
    configuredModel: GEMINI_MODEL,
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required',
        reply: "Please provide a valid question.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === 'YOUR_GEMINI_API_KEY') {
      console.warn('[Gemini Server] Warning: GEMINI_API_KEY is not configured or is a placeholder in .env.');
      return res.status(503).json({
        error: 'GEMINI_API_KEY missing or invalid',
        details: 'GEMINI_API_KEY is not configured on the backend hosting server.',
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini API: role is 'user' or 'model'
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

    // Try configured model first, fallback to stable models if model is not found
    const candidateModels = [
      GEMINI_MODEL,
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

        if (response?.text) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Server] Model ${modelToTry} attempt failed: ${err.message}`);

        // If the API key itself is invalid or quota is exceeded, fail immediately without trying other models
        if (
          err.message?.includes('API_KEY_INVALID') ||
          err.message?.includes('API key not valid') ||
          err.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          throw err;
        }
      }
    }

    const reply = response?.text ? response.text.trim() : '';

    if (!reply) {
      if (lastError) throw lastError;
      console.warn('[Gemini Server] Empty response returned from model.');
      return res.status(200).json({
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    return res.json({ reply });
  } catch (error) {
    const errorMsg = error?.message || 'Unknown error';
    console.error('[Gemini Server Error]:', errorMsg);

    let friendlyDetail = 'Backend error communicating with Gemini API.';
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
      friendlyDetail = 'Invalid GEMINI_API_KEY. Please check your API key in the Render Environment settings.';
    } else if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      friendlyDetail = 'Gemini API quota exceeded for this API key.';
    } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      friendlyDetail = 'Requested Gemini model not available for this API key.';
    }

    return res.status(500).json({
      error: 'Failed to generate response',
      details: friendlyDetail,
      reply: "Sorry, I couldn't get a response right now. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Gemini Server] Listening on http://localhost:${PORT}`);
  console.log(`[Gemini Server] Configured model: ${GEMINI_MODEL}`);
});
