# React Chatbot

A clean, beginner-friendly chatbot interface built with **React.js (React 19)**, **JavaScript**, and **Vite**, styled with modern, minimalist plain CSS.

![React Chatbot Preview](public/favicon.svg)

---

## Features

- **Clean Minimalist UI**: Matches the modern layout with rounded light-gray message bubbles, emerald green Send button, and centered container.
- **Top Input Field**: Responsive input bar positioned at the top with placeholder `"Send a message to Chatbot"` and Enter-key submission support.
- **Visual Avatar Badges**:
  - **Bot Avatar**: Circular green badge with an inline SVG robot head.
  - **User Avatar**: Circular green badge with an inline SVG user silhouette.
- **Dynamic Messaging via `.map()`**: Renders all messages dynamically from React state without hardcoded JSX entries.
- **Animated Typing Indicator**: Displays smooth animated pulsing dots (`• • •`) for 800–1200ms when the chatbot is thinking.
- **Local Bot Intelligence**:
  - `hello` / `hi` / `hello chatbot` &rarr; `"Hello! How can I help you?"`
  - `today` / `date` &rarr; Returns current dynamic date using JavaScript `Date` API.
  - `time` &rarr; Returns current dynamic time formatted via JavaScript `Date` API.
  - `how are you` &rarr; `"I'm doing great! How can I help you?"`
  - `what is your name` &rarr; `"I'm your React chatbot."`
  - Unrecognized messages &rarr; `"Sorry, I don't understand that yet."`
- **Initial Greeting**: Automatically greets the user with `"Hello! How can I help you?"` on initial mount.
- **Responsive & Accessible**: Keyboard accessible, form submission handling, disabled states during typing, and mobile-friendly fluid styling.

---

## File Structure

```
basic-chatbot/
├── src/
│   ├── components/
│   │   ├── Avatars.jsx         # Custom SVG Bot & User avatars
│   │   ├── Chatbot.jsx         # Main chatbot container & state management
│   │   ├── ChatInput.jsx       # Controlled text input and Send button form
│   │   ├── ChatMessage.jsx     # Individual user/bot message bubble renderer
│   │   └── TypingIndicator.jsx # Animated 3-dot typing bubble
│   ├── utils/
│   │   └── chatbotLogic.js     # Bot reply generator & Date API integration
│   ├── App.jsx                 # App root component
│   ├── App.css                 # Chat layout, bubble, and animation styles
│   ├── index.css               # Global CSS reset and typography
│   └── main.jsx                # React DOM entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## Key React Concepts for Beginners

### 1. Why `useState` is Needed
In regular JavaScript, updating a variable (like `let messages = []`) does not notify the browser or trigger an interface update.
`useState` tells React to keep track of this data across renders. Whenever `setMessages` is called, React automatically re-renders the component to show the latest messages on the screen.

### 2. Controlled Components
In `ChatInput.jsx`, the text input's value is linked to React state (`inputText`). This ensures that React is the single source of truth for user input, making it easy to validate, clear after submission, and disable when necessary.

### 3. Rendering Lists with `.map()`
Instead of writing duplicate JSX for each message, `.map()` iterates through the `messages` array and generates a `<ChatMessage />` for every item with a unique `key={message.id}`.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```
