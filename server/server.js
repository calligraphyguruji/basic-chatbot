import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './endpoints/chat.js';
import authHandler from './endpoints/auth.js';
import conversationsHandler from './endpoints/conversations.js';
import memoryHandler from './endpoints/memory.js';
import filesHandler from './endpoints/files.js';
import imagesHandler from './endpoints/images.js';
import { initDb } from './endpoints/lib/db.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '20mb'; // Allow up to 20mb for base64 file uploads
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

      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
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
    message: 'AI Assistant Backend API is running',
    hasApiKey: hasKey,
    configuredModel: GEMINI_MODEL,
  });
});

// Auth endpoints
app.use('/api/auth', (req, res) => {
  return authHandler(req, res);
});

// Conversations endpoints
app.use('/api/conversations', (req, res) => {
  return conversationsHandler(req, res);
});

// Memory endpoints
app.use('/api/memory', (req, res) => {
  return memoryHandler(req, res);
});

// File upload endpoints
app.use('/api/files', (req, res) => {
  return filesHandler(req, res);
});

// Image generation endpoints
app.use('/api/images', (req, res) => {
  return imagesHandler(req, res);
});

// Chat endpoint
app.use('/api/chat', (req, res) => {
  return chatHandler(req, res);
});

// Initialize database schema
initDb().catch((err) => console.error('[DB Init Error]:', err));

app.listen(PORT, () => {
  console.log(`[AI Assistant Server] Listening on http://localhost:${PORT}`);
  console.log(`[AI Assistant Server] Configured model: ${GEMINI_MODEL}`);
});
