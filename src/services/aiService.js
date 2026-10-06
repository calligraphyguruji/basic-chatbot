/**
 * Centralized AI & Backend API Service
 * Encapsulates all backend HTTP communications.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const AIService = {
  // --- AUTHENTICATION ---
  async register(name, email, password, confirmPassword) {
    const res = await fetch(`${BASE_URL}/api/auth?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/api/auth?action=me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  },

  // --- CONVERSATIONS ---
  async getConversations(search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${BASE_URL}/api/conversations${q}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    const data = await res.json();
    return data.conversations || [];
  },

  async getConversation(id) {
    const res = await fetch(`${BASE_URL}/api/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversation');
    return res.json();
  },

  async createConversation(title = 'New Chat') {
    const res = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const data = await res.json();
    return data.conversation;
  },

  async updateConversation(id, updates) {
    const res = await fetch(`${BASE_URL}/api/conversations/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id) {
    const res = await fetch(`${BASE_URL}/api/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  // --- CHAT STREAMING & MESSAGES ---
  async sendMessage({ message, history, conversationId, reasoningMode = false, fileContext = '', signal }) {
    return fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        history,
        conversationId,
        reasoningMode,
        fileContext,
        stream: true,
      }),
      signal,
    });
  },

  // --- FILE UPLOAD ---
  async uploadFile({ fileName, fileType, fileData, conversationId }) {
    const res = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileName, fileType, fileData, conversationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.file;
  },

  // --- IMAGE GENERATION ---
  async generateImage(prompt) {
    const res = await fetch(`${BASE_URL}/api/images`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate image');
    return data;
  },

  // --- USER MEMORY ---
  async getMemories() {
    const res = await fetch(`${BASE_URL}/api/memory`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch memories');
    const data = await res.json();
    return data.memories || [];
  },

  async addMemory(memory_key, memory_value, importance = 1) {
    const res = await fetch(`${BASE_URL}/api/memory`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ memory_key, memory_value, importance }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add memory');
    return data.memory;
  },

  async deleteMemory(id) {
    const res = await fetch(`${BASE_URL}/api/memory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete memory');
    return res.json();
  },

  async clearAllMemories() {
    const res = await fetch(`${BASE_URL}/api/memory?clearAll=true`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear memories');
    return res.json();
  },
};
