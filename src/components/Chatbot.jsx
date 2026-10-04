import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { getBotResponse } from '../utils/chatbotLogic';

/**
 * Chatbot Component
 *
 * Why useState is needed here:
 * 1. Plain JavaScript variables (like `let messages = []`) do not cause React
 *    to re-render the screen when they change.
 * 2. `useState` allows our component to store conversation history and typing status
 *    in React's internal memory. When we call `setMessages(...)` or `setIsTyping(...)`,
 *    React automatically updates the DOM to display the latest messages and animations.
 */
function Chatbot() {
  // Initial state: starts with the bot greeting message
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! How can I help you?',
    },
  ]);

  // isTyping tracks whether the bot is currently "thinking" and displaying animated dots
  const [isTyping, setIsTyping] = useState(false);

  // Reference to the bottom of the chat list for smooth scrolling
  const messagesEndRef = useRef(null);

  // Auto-scroll whenever messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Handles user sending a message.
   * 1. Appends the user's message to state.
   * 2. Shows the typing indicator.
   * 3. Computes the bot's answer and reveals it after ~1000ms.
   */
  const handleSendMessage = (userText) => {
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText,
    };

    // Append user message immediately
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Activate typing indicator
    setIsTyping(true);

    // Simulate response delay between 800ms - 1200ms (1000ms average)
    setTimeout(() => {
      const botReplyText = getBotResponse(userText);
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReplyText,
      };

      // Add bot message and dismiss the typing indicator
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="chatbot-container">
      {/* 1. Input section fixed at top of the chatbot */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />

      {/* 2. Chat messages rendered dynamically using .map() */}
      <div className="messages-list">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* 3. Conditional rendering of the typing dots indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default Chatbot;
