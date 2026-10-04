import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from '../api/chat.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '128kb';

// Robust CORS: Allow local tools when unset, otherwise enforce CLIENT_ORIGIN.
const rawOrigin = process.env.CLIENT_ORIGIN;
const cleanClientOrigin = rawOrigin ? rawOrigin.trim().replace(/\/+$/, '') : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/+$/, '');
      if (!cleanClientOrigin || cleanClientOrigin === '*' || normalized === cleanClientOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: JSON_BODY_LIMIT }));

// Health check endpoints (supports /, /health, and /api/health)
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

// Chat endpoint (delegates to the Vercel-native serverless handler in api/chat.js)
app.all('/api/chat', (req, res) => {
  return chatHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`[Gemini Server] Listening on http://localhost:${PORT}`);
  console.log(`[Gemini Server] Configured model: ${GEMINI_MODEL}`);
});
