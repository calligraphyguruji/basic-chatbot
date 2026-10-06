import { extractAuthUser } from './lib/auth.js';
import { db } from './lib/db.js';
import { writeCorsHeaders } from './lib/cors.js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

/**
 * Extracts plain text from various file formats
 */
async function parseFileContent(buffer, mimeType, filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  // 1. Plain text formats
  if (
    mimeType.startsWith('text/') ||
    ['txt', 'md', 'csv', 'json', 'js', 'py', 'ts', 'html'].includes(ext)
  ) {
    const text = buffer.toString('utf-8');
    if (ext === 'json') {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return text;
      }
    }
    return text;
  }

  // 2. PDF extraction
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      return (textResult?.text || textResult || '').trim();
    } catch (e) {
      console.warn('PDF parse error:', e.message);
      return '';
    }
  }

  // 3. Word Document DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (e) {
      console.warn('DOCX parse error:', e.message);
      return '';
    }
  }

  // 4. Images
  if (mimeType.startsWith('image/')) {
    return `[Image Attachment: ${filename} (${mimeType})]`;
  }

  return buffer.toString('utf-8').slice(0, 10000);
}

export default async function handler(req, res) {
  const isAllowedOrigin = writeCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(isAllowedOrigin ? 200 : 403).end();
  }

  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const user = extractAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to upload files.' });
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '');
  const idMatch = pathname.match(/\/api\/files\/([^/?]+)/);
  const fileId = idMatch ? idMatch[1] : url.searchParams.get('id');

  // DELETE FILE
  if (req.method === 'DELETE' && fileId) {
    await db.deleteFile(fileId, user.id);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { fileName, fileType, fileData, conversationId } = body || {};

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData (base64 string).' });
    }

    // Base64 decoding
    const base64Content = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File exceeds maximum upload limit of 15MB.' });
    }

    const mime = fileType || 'application/octet-stream';
    const extractedText = await parseFileContent(buffer, mime, fileName);

    const newFileId = 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const storageUrl = mime.startsWith('image/')
      ? `data:${mime};base64,${base64Content}`
      : null;

    const saved = await db.createUploadedFile({
      id: newFileId,
      user_id: user.id,
      conversation_id: conversationId || null,
      file_name: fileName,
      file_type: mime,
      file_size: buffer.length,
      storage_url: storageUrl,
      extracted_text: (extractedText || '').slice(0, 100000), // Cap for context safety
    });

    return res.status(201).json({
      file: {
        id: saved.id,
        fileName: saved.file_name,
        fileType: saved.file_type,
        fileSize: saved.file_size,
        hasText: Boolean(saved.extracted_text),
        storageUrl: saved.storage_url,
      },
    });
  } catch (err) {
    console.error('[File Upload Error]:', err);
    return res.status(500).json({ error: 'File upload failed. Please try again.' });
  }
}
