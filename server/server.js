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
const DEFAULT_CLIENT_ORIGIN = 'https://basic-chatbot-kappa.vercel.app';

function normalizeOrigin(origin) {
  return origin ? origin.trim().replace(/\/+$/, '') : '';
}

function getConfiguredOrigins() {
  const origins = new Set();
  const addOrigin = (origin) => {
    const normalized = normalizeOrigin(origin);
    if (normalized && normalized !== '*') origins.add(normalized);
  };

  (process.env.CLIENT_ORIGIN || '').split(',').forEach(addOrigin);
  addOrigin(DEFAULT_CLIENT_ORIGIN);
  addOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  addOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ''
  );

  return origins;
}

const allowedOrigins = getConfiguredOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.has(normalized)) {
        return callback(null, true);
      }

      if (
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)
      ) {
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
