import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(clientOrigin ? { origin: clientOrigin } : undefined));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL });
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

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    const reply = response?.text ? response.text.trim() : '';

    if (!reply) {
      console.warn('[Gemini Server] Empty response returned from model.');
      return res.status(200).json({
        reply: "Sorry, I couldn't get a response right now. Please try again.",
      });
    }

    return res.json({ reply });
  } catch (error) {
    // Log safe error summary without printing the secret key
    console.error('[Gemini Server Error]:', error?.message || 'Unknown error');

    return res.status(500).json({
      error: 'Failed to generate response',
      reply: "Sorry, I couldn't get a response right now. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Gemini Server] Listening on http://localhost:${PORT}`);
  console.log(`[Gemini Server] Configured model: ${GEMINI_MODEL}`);
});
