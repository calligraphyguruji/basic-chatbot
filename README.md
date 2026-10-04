# React Chatbot with Google Gemini AI

A modern, beginner-friendly chatbot interface built with **React.js (React 19)**, **JavaScript**, **Vite**, and **Google Gemini AI**, styled with a warm **Saffron (`#FF9933`)** theme and minimalist plain CSS.

---

## Features

- **Bottom Composer Layout**: Sticky/fixed input bar at the bottom with a subtle top border and shadow; scrollable conversation history above.
- **Saffron Visual Theme**: Consistent `#FF9933` saffron accent applied to the Send button, hover state (`#E68A00`), and circular Bot/User avatars with white icons.
- **Hybrid Intelligence**:
  - **Local Responses**: Instant responses for greetings (`hello`, `hi`), date (`today's date`), time (`current time`), identity (`what is your name`), and status (`how are you`).
  - **Google Gemini Integration**: Complex questions are securely processed via server-side API (`POST /api/chat`) running the official Google Gen AI SDK.
- **Vercel & Node.js Ready**: Supports direct deployment to **Vercel** via serverless functions (`api/chat.js`) as well as local Express server (`server/server.js`).
- **Secure Backend Layer**: The `GEMINI_API_KEY` is kept strictly server-side and never exposed to client-side code or browser bundles.
- **Dynamic Messaging via `.map()`**: Renders all messages dynamically from React state.
- **Animated Typing Indicator**: Displays smooth animated pulsing dots (`• • •`) while answers are generating.
- **Robust Error Handling**: Handles network, server, and API key errors gracefully with friendly fallback messages.
- **Responsive & Accessible**: Seamless fluid layout for mobile, tablet, and desktop viewports.

---

## File Structure

```
basic-chatbot/
├── api/
│   └── chat.js             # Vercel serverless function (POST /api/chat)
├── server/
│   └── server.js           # Local Express server delegating to api/chat.js
├── src/
│   ├── components/
│   │   ├── Avatars.jsx         # Saffron circular SVG Bot & User avatars
│   │   ├── Chatbot.jsx         # Main chat container, scrolling & API orchestration
│   │   ├── ChatInput.jsx       # Controlled text input and Send button form
│   │   ├── ChatMessage.jsx     # Individual user/bot message bubble renderer
│   │   └── TypingIndicator.jsx # Animated 3-dot typing bubble
│   ├── utils/
│   │   └── chatbotLogic.js     # Local rule matcher and fallback delegation
│   ├── App.jsx                 # App root component
│   ├── App.css                 # Fixed bottom layout and saffron styling
│   ├── index.css               # Global reset and theme variables
│   └── main.jsx                # React DOM entry point
├── vercel.json             # Vercel SPA and API routing configuration
├── .env.example            # Environment variables template
├── index.html
├── package.json
└── vite.config.js          # Vite config with backend proxy (/api)
```

---

## Environment Variables

### For Vercel Deployment
Add this in **Vercel Dashboard > Project Settings > Environment Variables**:
- `GEMINI_API_KEY`: Your Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- `GEMINI_MODEL`: `gemini-2.0-flash` (or `gemini-2.5-flash`, optional)

### For Local Development (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5001
```

> **Security Note:** `.env` is included in `.gitignore` and is never committed to Git or exposed in browser bundles.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Servers
In terminal 1 (Backend):
```bash
npm run server
```

In terminal 2 (Frontend):
```bash
npm run dev
```

---

## Deploying to Vercel (All-In-One)

1. Push your repository to GitHub.
2. Import the repository in **Vercel**.
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Gemini API key
4. Click **Deploy**. Both the React frontend and `/api/chat` serverless function deploy together automatically.
