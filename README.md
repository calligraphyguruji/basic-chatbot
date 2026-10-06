# Bodhisakha (बोधिसखा) — Production AI Assistant

A full-stack, production-grade conversational AI assistant built with **React 19**, **Vite**, **Express**, and **Google Gemini AI**. Designed with authentic Sanskrit identity (*Bodhisakha* — "Companion of Wisdom"), a warm **Saffron (`#FF9933`)** aesthetic, multi-turn dialogue persistence, multi-user authentication, long-term personal memory, document understanding, AI image generation, deep reasoning, and optimized for **Vercel Serverless Function** deployment.

Created and owned by **Mr. Aman Mishra**.

---

## 🌟 Live Demo

- **Production URL**: [https://basic-chatbot-kappa.vercel.app/](https://basic-chatbot-kappa.vercel.app/)
- **Repository**: [https://github.com/calligraphyguruji/basic-chatbot](https://github.com/calligraphyguruji/basic-chatbot)

---

## 🚀 Key Features

### 1. Persistent Multi-User Architecture & Authentication
- Secure **Register / Sign In** modal with client and server validation.
- Passwords securely hashed with `bcryptjs` and session tokens signed via JWT (`jsonwebtoken`).
- Complete user data isolation: users can never access or inspect another user's conversations, files, or memories (full IDOR prevention).
- Support for unauthenticated guest conversations as well as permanent user accounts.

### 2. Modern ChatGPT-Style Responsive Sidebar & Chat History
- Persistent left sidebar with mobile slide-over drawer and overlay.
- Chronologically grouped conversations: **Today**, **Yesterday**, **Previous 7 Days**, and **Older**.
- Instant conversation search with debounced filtering across titles and message content.
- Conversation management actions: **Rename**, **Pin to top**, and **Delete** with confirmation.
- Auto-generates conversation title from the user's initial message.

### 3. Long-Term Personal Memory & Settings
- Extract key user preferences, background, and learning goals automatically without ballooning context tokens.
- Settings → **Manage Memories**: view stored user facts, delete individual memory items, or wipe all memories.
- Seamlessly injects relevant user facts into the system prompt for tailored, contextual explanations.
- Dark mode & Light mode toggle with persistent local preference.

### 4. File Upload & Multi-Format Document Understanding
- Supports **PDF**, **DOCX**, **TXT**, **CSV**, **JSON**, **PNG**, **JPG**, and **WEBP** attachments up to 15MB.
- Server-side text extraction using `pdf-parse` and `mammoth`.
- Uploaded file chips appear above the composer and in message bubbles.
- Document text is indexed and provided directly to the AI model for deep document Q&A.

### 5. Deep Thinking / Reasoning Mode
- Toggle button (`🧠 Deep Thinking`) in the chat composer.
- Routes prompts to reasoning-capable models (`gemini-2.5-pro` / `gemini-1.5-pro`) with higher reasoning depth.
- Displays a dedicated reasoning badge (`Reasoned with Deep Thinking`) on completed responses without exposing raw internal draft tokens.

### 6. AI Image Generation
- Dedicated image generation toggle (`✨ Image`) in the chat composer.
- Generates high-resolution images with prompt attribution.
- Supports instant downloading and high-resolution lightbox preview.

### 7. Core Chatbot Capabilities Preserved
- Real-time live weather lookup via `wttr.in`.
- Voice input with speech-to-text recognition and text-to-speech voice playback.
- Educational intent detection (formula sheets, MCQs, study plans).
- Full Markdown and LaTeX formula rendering with KaTeX.

---

## 🛠️ Stack & Dependencies

- **Frontend**: React 19, Vite 8, React Markdown, Rehype-KaTeX, Remark-GFM, Remark-Math.
- **Backend / Serverless**: Express 5, Vercel Serverless Functions (`/api/*`), Node.js.
- **Database / Storage**: PostgreSQL (`pg`) with automatic zero-overhead local JSON storage fallback (`.data/db.json`) when `DATABASE_URL` is omitted.
- **AI Models**: Google Gemini (`@google/generative-ai`, `gemini-2.5-flash`, `gemini-2.5-pro`, `imagen-3.0-generate-002`, `pollinations`).

---

## ⚙️ Environment Variables

Create `.env` (or configure in Vercel Project Settings) based on `.env.example`:

```bash
# Backend / Vercel Serverless
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5001
CLIENT_ORIGIN=https://basic-chatbot-kappa.vercel.app

# Database (PostgreSQL / Supabase / Neon)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Image Generation
IMAGE_API_KEY=your_image_api_key_here
```

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Backend Server**:
   ```bash
   npm run server
   ```

3. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```

4. **Run Tests & Linting**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

---

## 🔒 Security Architecture

- **Zero Client Keys**: Secrets and API keys are strictly kept server-side in Vercel functions or backend Express routes.
- **IDOR Protection**: Database queries strictly filter and verify user ownership (`user_id = $authId`) before reading, modifying, or deleting conversations, memories, or files.
- **Input Sanitization**: Request bodies, message lengths, and file sizes are strictly validated.
- **CORS & CSP**: Restricts API calls to authorized origins and enforces hardened Content Security Policies.

---

## 📄 License

MIT © [Mr. Aman Mishra](https://github.com/calligraphyguruji)
