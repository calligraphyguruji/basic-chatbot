# React Chatbot with Google Gemini AI

A modern, beginner-friendly chatbot interface built with **React.js (React 19)**, **JavaScript**, **Vite**, and an **Express + Google Gemini API** backend, styled with a warm **Saffron (`#FF9933`)** theme and minimalist plain CSS.

---

## Features

- **Bottom Composer Layout**: Sticky/fixed input bar at the bottom with a subtle top border and shadow; scrollable conversation history above.
- **Saffron Visual Theme**: Consistent `#FF9933` saffron accent applied to the Send button, hover state (`#E68A00`), and circular Bot/User avatars with white icons.
- **Hybrid Intelligence**:
  - **Local Responses**: Instant responses for greetings (`hello`, `hi`), date (`today's date`), time (`current time`), identity (`what is your name`), and status (`how are you`).
  - **Google Gemini Integration**: Complex programming or general questions are securely forwarded to the backend (`POST /api/chat`) running the official Google Gen AI SDK.
- **Secure Backend Layer**: The `GEMINI_API_KEY` is kept strictly on the Node.js backend (`server/server.js`) and never exposed to client-side code or browser bundles.
- **Dynamic Messaging via `.map()`**: Renders all messages dynamically from React state.
- **Animated Typing Indicator**: Displays smooth animated pulsing dots (`• • •`) while local or Gemini responses are generating.
- **Robust Error Handling**: Handles network, server, and API key errors gracefully with friendly fallback messages.
- **Initial Greeting**: Greets the user with `"Hello! How can I help you?"` on first load.
- **Responsive & Accessible**: Seamless fluid layout for mobile, tablet, and desktop viewports.

---

## File Structure

```
basic-chatbot/
├── server/
│   └── server.js           # Express backend connecting to Google Gemini API
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
├── .env.example            # Environment variables template
├── index.html
├── package.json
└── vite.config.js          # Vite config with backend proxy (/api)
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5001
```

> **Security Note:** `.env` is included in `.gitignore` and is never committed to Git or exposed in browser bundles.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and insert your Gemini API key
```

### 3. Start Backend Server
```bash
npm run server
```
Runs Express server at `http://localhost:5001`.

### 4. Start Frontend
```bash
npm run dev
```
Runs Vite dev server at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

### 6. Run Linter
```bash
npm run lint
```
