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

  (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .forEach(addOrigin);

  addOrigin(DEFAULT_CLIENT_ORIGIN);
  addOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  addOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ''
  );

  return origins;
}

export function getAllowedOrigin(requestOrigin) {
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin || '');
  if (!normalizedRequestOrigin) return '';

  const configuredOrigins = getConfiguredOrigins();
  if (configuredOrigins.has(normalizedRequestOrigin)) {
    return normalizedRequestOrigin;
  }

  if (
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedRequestOrigin)
  ) {
    return normalizedRequestOrigin;
  }

  return '';
}

export function writeCorsHeaders(req, res) {
  const requestOrigin = req.headers?.origin;
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );
  return !requestOrigin || Boolean(allowedOrigin);
}
