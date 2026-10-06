import authHandler from './endpoints/auth.js';
import chatHandler from './endpoints/chat.js';
import conversationsHandler from './endpoints/conversations.js';
import filesHandler from './endpoints/files.js';
import imagesHandler from './endpoints/images.js';
import memoryHandler from './endpoints/memory.js';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

/**
 * Single Vercel Serverless Function entry point
 * Dispatches all `/api/*` traffic to the appropriate domain handler.
 * Consolidates deployment to exactly 1 Serverless Function (well under Vercel Hobby plan limit of 12).
 */
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '');

  if (pathname === '/api/chat' || pathname.startsWith('/api/chat/')) {
    return chatHandler(req, res);
  }

  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return authHandler(req, res);
  }

  if (pathname === '/api/conversations' || pathname.startsWith('/api/conversations/')) {
    return conversationsHandler(req, res);
  }

  if (pathname === '/api/files' || pathname.startsWith('/api/files/')) {
    return filesHandler(req, res);
  }

  if (pathname === '/api/images' || pathname.startsWith('/api/images/')) {
    return imagesHandler(req, res);
  }

  if (pathname === '/api/memory' || pathname.startsWith('/api/memory/')) {
    return memoryHandler(req, res);
  }

  // Health check route
  if (pathname === '/api' || pathname === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      service: 'AI Assistant Unified Gateway',
      environment: process.env.NODE_ENV || 'production',
    });
  }

  return res.status(404).json({ error: `Route not found: ${pathname}` });
}
