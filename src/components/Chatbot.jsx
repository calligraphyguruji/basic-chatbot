import { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import Sidebar from './Sidebar';
import AuthModal from './AuthModal';
import MemoryModal from './MemoryModal';
import SettingsModal from './SettingsModal';
import { getLocalBotResponse } from '../utils/chatbotLogic';
import { speakText, stopSpeech } from '../utils/speechUtils';
import { useAuth } from '../context/useAuth';
import { AIService } from '../services/aiService';

const SUGGESTIONS = [
  'Explain a programming concept',
  'Analyze my PDF document',
  'Help me debug code',
  'Generate an image of a futuristic city',
  'Help me plan a full-stack project',
];

function Chatbot() {
  const { user } = useAuth();

  // App Theme: 'light' or 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Conversations & Search state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Messages state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Namaste! I am Bodhisakha (बोधिसखा), your personal AI assistant and intellectual companion. How can I help you today?',
    },
  ]);

  // Deep Thinking toggle
  const [reasoningMode, setReasoningMode] = useState(false);

  // Status & Speech
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const localTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clean up timers & speech
  useEffect(() => {
    return () => {
      stopSpeech();
      if (localTimerRef.current) clearTimeout(localTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Load conversations when user logs in or search changes
  const loadConversations = useCallback(async (query = '') => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const list = await AIService.getConversations(query);
      setConversations(list);
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [loadConversations, searchQuery]);

  // Select conversation and load its messages
  const handleSelectConversation = async (convId) => {
    if (!convId || convId === activeConversationId) return;
    setActiveConversationId(convId);
    setSidebarOpen(false); // Close drawer on mobile
    try {
      const data = await AIService.getConversation(convId);
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'bot',
            text: m.content,
            model: m.model,
            imageUrl: m.metadata?.imageUrl,
          }))
        );
      } else {
        setMessages([
          {
            id: Date.now(),
            sender: 'bot',
            text: `Conversation loaded: "${data.conversation?.title || 'Chat'}". How can I assist you?`,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  // New Chat
  const handleNewChat = async () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: 'How can I help you today?',
      },
    ]);
    setSidebarOpen(false);
  };

  // Rename Conversation
  const handleRenameConversation = async (id, title) => {
    try {
      await AIService.updateConversation(id, { title });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await AIService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete conversation failed:', err);
    }
  };

  // Pin / Unpin Conversation
  const handleTogglePin = async (id, pinned) => {
    try {
      await AIService.updateConversation(id, { pinned });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned } : c))
      );
    } catch (err) {
      console.error('Pin toggle failed:', err);
    }
  };

  // Toggle Speech
  const handleToggleSpeak = (id, text) => {
    if (speakingMessageId === id) {
      stopSpeech();
      setSpeakingMessageId(null);
    } else {
      speakText(text, {
        onStart: () => setSpeakingMessageId(id),
        onEnd: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    }
  };

  // File Upload helper
  const handleFileUpload = async ({ fileName, fileType, fileData }) => {
    return AIService.uploadFile({
      fileName,
      fileType,
      fileData,
      conversationId: activeConversationId || null,
    });
  };

  // Image Generation handler
  const handleGenerateImage = async (prompt) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    stopSpeech();
    setSpeakingMessageId(null);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: `Generate an image: "${prompt}"`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setStatusMessage('Creating image with AI...');

    try {
      let convId = activeConversationId;
      if (!convId) {
        const title = `Image: ${prompt.slice(0, 30)}`;
        const newConv = await AIService.createConversation(title);
        convId = newConv.id;
        setActiveConversationId(convId);
        loadConversations();
      }

      const res = await AIService.generateImage(prompt);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Here is your generated image: "${prompt}"`,
        imageUrl: res.imageUrl,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Image generation failed: ${err.message || 'Please try again later.'}`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setStatusMessage('');
    }
  };

  // Send Message handler
  const handleSendMessage = async (userText, attachments = []) => {
    stopSpeech();
    setSpeakingMessageId(null);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      attachments,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setIsTyping(true);
    setStatusMessage(reasoningMode ? 'Thinking deeply through the problem...' : 'Thinking...');

    // Auto-create persistent conversation on first turn if user is logged in
    let currentConvId = activeConversationId;
    if (user && !currentConvId) {
      try {
        const titleSnippet = userText.slice(0, 36) + (userText.length > 36 ? '...' : '');
        const createdConv = await AIService.createConversation(titleSnippet || 'New Chat');
        currentConvId = createdConv.id;
        setActiveConversationId(createdConv.id);
        loadConversations();
      } catch (e) {
        console.warn('Could not auto-create conversation:', e);
      }
    }

    // Local heuristic check for instant answers if no files attached
    if (attachments.length === 0) {
      const localResponse = getLocalBotResponse(userText);
      if (localResponse !== null) {
        localTimerRef.current = setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            sender: 'bot',
            text: localResponse,
          };
          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          setStatusMessage('');
        }, 600);
        return;
      }
    }

    // Prepare combined file context text if documents were attached
    const fileContextText = attachments
      .map((a) => (a.extractedText || a.fileName ? `[File: ${a.fileName}]\n${a.extractedText || ''}` : ''))
      .filter(Boolean)
      .join('\n\n');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await AIService.sendMessage({
        message: userText,
        history: nextHistory,
        conversationId: currentConvId,
        reasoningMode,
        fileContext: fileContextText,
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error('[Chat API Error Detail]:', {
          status: response.status,
          statusText: response.statusText,
          errorCode: data?.error?.code,
          errorMessage: data?.error?.message,
          errorDetails: data?.error?.details,
          fullData: data,
        });

        const serverErrorMessage =
          data?.error?.message ||
          data?.reply ||
          (typeof data?.error === 'string' ? data.error : null) ||
          "Sorry, I couldn't generate a response right now. Please try again.";

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: serverErrorMessage,
          },
        ]);
        return;
      }

      if (contentType.includes('text/plain') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const botMessageId = Date.now() + 1;
        let streamedText = '';

        setIsTyping(false);
        setStatusMessage('');
        setMessages((prev) => [
          ...prev,
          {
            id: botMessageId,
            sender: 'bot',
            text: '',
            reasoningMode,
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamedText += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === botMessageId ? { ...m, text: streamedText } : m))
          );
        }

        if (!streamedText.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId ? { ...m, text: "I didn't receive a response. Please try again." } : m
            )
          );
        }
      } else {
        const data = await response.json().catch(() => null);
        const botReply = data?.reply || "I didn't receive a response.";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: botReply,
            reasoningMode,
          },
        ]);
      }
    } catch (err) {
      console.error('Chat API error:', err);
      const fallbackText =
        err?.name === 'AbortError'
          ? 'The response took longer than 90 seconds to generate. Please try asking a more specific question.'
          : 'Unable to connect to the assistant server. Please check your network connection.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: fallbackText,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setIsTyping(false);
      setStatusMessage('');
      if (user) loadConversations();
    }
  };

  return (
    <div className="assistant-layout">
      {/* 1. Left Persistent / Drawer Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onTogglePin={handleTogglePin}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenMemory={() => setMemoryModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Main Chat Area */}
      <div className="assistant-main-panel">
        {/* Top Navbar */}
        <header className="assistant-top-navbar">
          <div className="navbar-left">
            <button
              type="button"
              className="navbar-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar menu"
            >
              ☰
            </button>
            <div className="assistant-brand-title">
              <span className="brand-badge-dot"></span>
              <h1>Bodhisakha</h1>
              <span className="brand-badge-tag">AI</span>
            </div>
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className="navbar-action-btn theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
              <button
                type="button"
                className="navbar-user-btn"
                onClick={() => setSettingsModalOpen(true)}
                title="Account Settings"
                aria-label="Account Settings"
              >
                <span className="nav-avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                className="primary-action-btn compact"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Message List */}
        <div className="messages-scroll-area">
          <div className="messages-list">
            {/* Empty state suggestions */}
            {messages.length <= 1 && (
              <div className="chat-empty-hero">
                <div className="empty-hero-icon">✨</div>
                <h2>How can I help you today?</h2>
                <p>Ask a question, upload a document, enable Deep Thinking, or generate creative images.</p>
                <div className="suggested-prompts-grid">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      className="suggested-prompt-card"
                      onClick={() => handleSendMessage(sug)}
                    >
                      <span>{sug}</span>
                      <span className="prompt-arrow">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isSpeaking={speakingMessageId === message.id}
                onToggleSpeak={handleToggleSpeak}
              />
            ))}

            {/* Typing Indicator with custom status message */}
            {isTyping && <TypingIndicator statusText={statusMessage} />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer Bar */}
        <div className="chat-bottom-bar">
          <ChatInput
            onSendMessage={handleSendMessage}
            onGenerateImage={handleGenerateImage}
            onFileUpload={handleFileUpload}
            disabled={isTyping}
            reasoningMode={reasoningMode}
            onToggleReasoning={() => setReasoningMode(!reasoningMode)}
          />
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <MemoryModal isOpen={memoryModalOpen} onClose={() => setMemoryModalOpen(false)} />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenMemory={() => setMemoryModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default Chatbot;
