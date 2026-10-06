import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

// Local fallback JSON file when DATABASE_URL is not set
// In serverless environments (e.g. AWS Lambda / Vercel), only /tmp is writable
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = IS_SERVERLESS
  ? path.resolve('/tmp', '.data')
  : path.resolve(process.cwd(), '.data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'db.json');

let pool = null;

function getPool() {
  if (pool) return pool;
  const connStr = process.env.DATABASE_URL;
  if (!connStr) return null;

  pool = new Pool({
    connectionString: connStr,
    ssl: connStr.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

function initLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const initial = {
        users: [],
        conversations: [],
        messages: [],
        user_memory: [],
        uploaded_files: [],
      };
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[Local Store Warning]: Could not initialize storage directory:', err.message);
  }
}

function readLocalStore() {
  initLocalStore();
  try {
    const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], conversations: [], messages: [], user_memory: [], uploaded_files: [] };
  }
}

function writeLocalStore(data) {
  initLocalStore();
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Local Store Warning]: Could not write storage file:', err.message);
  }
}

/**
 * Initializes database tables if using PostgreSQL
 */
export async function initDb() {
  const activePool = getPool();
  if (!activePool) {
    initLocalStore();
    return;
  }

  const client = await activePool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
        pinned BOOLEAN DEFAULT FALSE,
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        model VARCHAR(64),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_memory (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        memory_key VARCHAR(128) NOT NULL,
        memory_value TEXT NOT NULL,
        importance INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS uploaded_files (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(64) NOT NULL,
        file_size INT NOT NULL,
        storage_url TEXT,
        extracted_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_memory_user ON user_memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_user ON uploaded_files(user_id);
    `);
  } catch (err) {
    console.warn('[DB Init] Postgres init error (fallback to local if offline):', err.message);
  } finally {
    client.release();
  }
}

// Low-overhead storage queries
export const db = {
  isPostgres: () => Boolean(getPool()),

  // USERS
  async findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    const p = getPool();
    if (p) {
      const res = await p.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      return res.rows[0] || null;
    }
    const store = readLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findUserById(id) {
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query('SELECT id, name, email, avatar_url, created_at, updated_at FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const store = readLocalStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, created_at: user.created_at, updated_at: user.updated_at };
  },

  async createUser({ id, name, email, password_hash, avatar_url = null }) {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        `INSERT INTO users (id, name, email, password_hash, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, avatar_url, created_at`,
        [id, name, cleanEmail, password_hash, avatar_url, now, now]
      );
      return res.rows[0];
    }
    const store = readLocalStore();
    const user = { id, name, email: cleanEmail, password_hash, avatar_url, created_at: now, updated_at: now };
    store.users.push(user);
    writeLocalStore(store);
    return { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, created_at: user.created_at };
  },

  async updateUser(id, { name, avatar_url, password_hash }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const fields = [];
      const values = [];
      let idx = 1;
      if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
      if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(avatar_url); }
      if (password_hash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(password_hash); }
      fields.push(`updated_at = $${idx++}`); values.push(now);
      values.push(id);
      const res = await activePool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, avatar_url, updated_at`,
        values
      );
      return res.rows[0] || null;
    }
    const store = readLocalStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return null;
    if (name !== undefined) user.name = name;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (password_hash !== undefined) user.password_hash = password_hash;
    user.updated_at = now;
    writeLocalStore(store);
    return { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, updated_at: user.updated_at };
  },

  async deleteUser(id) {
    const activePool = getPool();
    if (activePool) {
      await activePool.query('DELETE FROM users WHERE id = $1', [id]);
      return true;
    }
    const store = readLocalStore();
    store.users = store.users.filter((u) => u.id !== id);
    store.conversations = store.conversations.filter((c) => c.user_id !== id);
    store.user_memory = store.user_memory.filter((m) => m.user_id !== id);
    store.uploaded_files = store.uploaded_files.filter((f) => f.user_id !== id);
    writeLocalStore(store);
    return true;
  },

  // CONVERSATIONS
  async getConversations(userId, { search = '', includeArchived = false } = {}) {
    const activePool = getPool();
    if (activePool) {
      let query = `
        SELECT c.*, 
          (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
        FROM conversations c
        WHERE c.user_id = $1
      `;
      const params = [userId];
      if (!includeArchived) {
        query += ` AND (c.archived = FALSE OR c.archived IS NULL)`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (c.title ILIKE $${params.length} OR EXISTS (
          SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.content ILIKE $${params.length}
        ))`;
      }
      query += ` ORDER BY c.pinned DESC NULLS LAST, c.updated_at DESC`;
      const res = await activePool.query(query, params);
      return res.rows;
    }

    const store = readLocalStore();
    let convs = store.conversations.filter((c) => c.user_id === userId);
    if (!includeArchived) {
      convs = convs.filter((c) => !c.archived);
    }
    if (search) {
      const q = search.toLowerCase();
      convs = convs.filter((c) => {
        if (c.title.toLowerCase().includes(q)) return true;
        const msgMatch = store.messages.some(
          (m) => m.conversation_id === c.id && m.content.toLowerCase().includes(q)
        );
        return msgMatch;
      });
    }
    convs.sort((a, b) => {
      if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    return convs;
  },

  async getConversation(id, userId) {
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
      return res.rows[0] || null;
    }
    const store = readLocalStore();
    return store.conversations.find((c) => c.id === id && c.user_id === userId) || null;
  },

  async createConversation({ id, user_id, title = 'New Chat' }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        `INSERT INTO conversations (id, user_id, title, pinned, archived, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, FALSE, $4, $5) RETURNING *`,
        [id, user_id, title, now, now]
      );
      return res.rows[0];
    }
    const store = readLocalStore();
    const conv = { id, user_id, title, pinned: false, archived: false, created_at: now, updated_at: now };
    store.conversations.unshift(conv);
    writeLocalStore(store);
    return conv;
  },

  async updateConversation(id, userId, { title, pinned, archived }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const fields = [];
      const values = [];
      let idx = 1;
      if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
      if (pinned !== undefined) { fields.push(`pinned = $${idx++}`); values.push(pinned); }
      if (archived !== undefined) { fields.push(`archived = $${idx++}`); values.push(archived); }
      fields.push(`updated_at = $${idx++}`); values.push(now);
      values.push(id, userId);
      const res = await activePool.query(
        `UPDATE conversations SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
        values
      );
      return res.rows[0] || null;
    }
    const store = readLocalStore();
    const conv = store.conversations.find((c) => c.id === id && c.user_id === userId);
    if (!conv) return null;
    if (title !== undefined) conv.title = title;
    if (pinned !== undefined) conv.pinned = pinned;
    if (archived !== undefined) conv.archived = archived;
    conv.updated_at = now;
    writeLocalStore(store);
    return conv;
  },

  async deleteConversation(id, userId) {
    const activePool = getPool();
    if (activePool) {
      await activePool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    }
    const store = readLocalStore();
    store.conversations = store.conversations.filter((c) => !(c.id === id && c.user_id === userId));
    store.messages = store.messages.filter((m) => m.conversation_id !== id);
    writeLocalStore(store);
    return true;
  },

  // MESSAGES
  async getMessages(conversationId) {
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      return res.rows;
    }
    const store = readLocalStore();
    return store.messages.filter((m) => m.conversation_id === conversationId);
  },

  async createMessage({ id, conversation_id, role, content, model = null, metadata = null }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        `INSERT INTO messages (id, conversation_id, role, content, model, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, conversation_id, role, content, model, metadata ? JSON.stringify(metadata) : null, now]
      );
      await activePool.query('UPDATE conversations SET updated_at = $1 WHERE id = $2', [now, conversation_id]);
      return res.rows[0];
    }
    const store = readLocalStore();
    const msg = { id, conversation_id, role, content, model, metadata, created_at: now };
    store.messages.push(msg);
    const conv = store.conversations.find((c) => c.id === conversation_id);
    if (conv) conv.updated_at = now;
    writeLocalStore(store);
    return msg;
  },

  // USER MEMORY
  async getUserMemory(userId) {
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        'SELECT * FROM user_memory WHERE user_id = $1 ORDER BY importance DESC, updated_at DESC',
        [userId]
      );
      return res.rows;
    }
    const store = readLocalStore();
    return store.user_memory.filter((m) => m.user_id === userId);
  },

  async setMemory({ id, user_id, memory_key, memory_value, importance = 1 }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        `INSERT INTO user_memory (id, user_id, memory_key, memory_value, importance, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, user_id, memory_key, memory_value, importance, now, now]
      );
      return res.rows[0];
    }
    const store = readLocalStore();
    const existing = store.user_memory.find((m) => m.user_id === user_id && m.memory_key === memory_key);
    if (existing) {
      existing.memory_value = memory_value;
      existing.importance = importance;
      existing.updated_at = now;
      writeLocalStore(store);
      return existing;
    }
    const mem = { id, user_id, memory_key, memory_value, importance, created_at: now, updated_at: now };
    store.user_memory.push(mem);
    writeLocalStore(store);
    return mem;
  },

  async deleteMemory(id, userId) {
    const activePool = getPool();
    if (activePool) {
      await activePool.query('DELETE FROM user_memory WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    }
    const store = readLocalStore();
    store.user_memory = store.user_memory.filter((m) => !(m.id === id && m.user_id === userId));
    writeLocalStore(store);
    return true;
  },

  async clearUserMemory(userId) {
    const activePool = getPool();
    if (activePool) {
      await activePool.query('DELETE FROM user_memory WHERE user_id = $1', [userId]);
      return true;
    }
    const store = readLocalStore();
    store.user_memory = store.user_memory.filter((m) => m.user_id !== userId);
    writeLocalStore(store);
    return true;
  },

  // UPLOADED FILES
  async createUploadedFile({ id, user_id, conversation_id = null, file_name, file_type, file_size, storage_url, extracted_text = '' }) {
    const now = new Date().toISOString();
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        `INSERT INTO uploaded_files (id, user_id, conversation_id, file_name, file_type, file_size, storage_url, extracted_text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [id, user_id, conversation_id, file_name, file_type, file_size, storage_url, extracted_text, now]
      );
      return res.rows[0];
    }
    const store = readLocalStore();
    const item = { id, user_id, conversation_id, file_name, file_type, file_size, storage_url, extracted_text, created_at: now };
    store.uploaded_files.push(item);
    writeLocalStore(store);
    return item;
  },

  async getConversationFiles(conversationId, userId) {
    const activePool = getPool();
    if (activePool) {
      const res = await activePool.query(
        'SELECT * FROM uploaded_files WHERE conversation_id = $1 AND user_id = $2 ORDER BY created_at ASC',
        [conversationId, userId]
      );
      return res.rows;
    }
    const store = readLocalStore();
    return store.uploaded_files.filter((f) => f.conversation_id === conversationId && f.user_id === userId);
  },

  async deleteFile(id, userId) {
    const activePool = getPool();
    if (activePool) {
      await activePool.query('DELETE FROM uploaded_files WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    }
    const store = readLocalStore();
    store.uploaded_files = store.uploaded_files.filter((f) => !(f.id === id && f.user_id === userId));
    writeLocalStore(store);
    return true;
  },
};
