import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { getLocalBotResponse } from '../utils/chatbotLogic';
import { speakText, stopSpeech } from '../utils/speechUtils';

/**
 * Chatbot Component
 *
 * Handles:
 * - Conversation message state
 * - Typing indicator during local & Gemini API thinking
 * - Automatic smooth scrolling to the latest message
 * - Text-to-speech playback and stop controls
 * - Seamless fallback from local answers to backend Google Gemini API
 */
function Chatbot() {
  // Initial message: bot welcomes user
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! How can I help you?',
    },
  ]);

  // isTyping disables the input and displays the animated dots
  const [isTyping, setIsTyping] = useState(false);

  // Tracks which bot message is actively playing speech
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Ref attached to the bottom anchor element inside the scrollable message area
  const messagesEndRef = useRef(null);

  // Auto-scroll whenever messages change or typing indicator is toggled
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  /**
   * Toggles speech playback for a specific bot message
   */
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

  /**
   * Handles user sending a message.
   * 1. Appends the user's message immediately.
   * 2. Stops any playing speech.
   * 3. Shows the typing indicator.
   * 4. Checks for a local response (greetings, date, time, etc.).
   * 5. If unrecognized, delegates to the secure Gemini backend endpoint (/api/chat).
   */
  const handleSendMessage = async (userText) => {
    // Stop ongoing speech when a new message is submitted
    stopSpeech();
    setSpeakingMessageId(null);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setIsTyping(true);

    const localResponse = getLocalBotResponse(userText);

    if (localResponse !== null) {
      // Local predefined response (simulate brief 800ms bot reply time)
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: localResponse,
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 800);
    } else {
      // Delegate complex question to backend Gemini API with bounded timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userText,
            history: nextHistory,
          }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          console.error('Gemini API response:', data);
          const serverErrorMessage =
            data?.reply ||
            data?.details ||
            data?.error ||
            "Sorry, I couldn't get a response right now. Please try again.";

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

        const botReply = data?.reply || "I didn't receive a response.";

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: botReply,
          },
        ]);
      } catch (err) {
        console.error('Chat API error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "Sorry, I couldn't connect to the chat server. Please check your network or try again.",
          },
        ]);
      } finally {
        clearTimeout(timeoutId);
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="chatbot-container">
      {/* 1. Scrollable messages area taking available vertical space */}
      <div className="messages-scroll-area">
        <div className="messages-list">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isSpeaking={speakingMessageId === message.id}
              onToggleSpeak={handleToggleSpeak}
            />
          ))}

          {/* Typing indicator bubble */}
          {isTyping && <TypingIndicator />}

          {/* Anchor to scroll smoothly to newest message */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 2. Fixed/sticky bottom input bar with subtle top border and shadow */}
      <div className="chat-bottom-bar">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}

export default Chatbot;
