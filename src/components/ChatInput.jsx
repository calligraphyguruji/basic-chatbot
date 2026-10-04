import { useState } from 'react';

/**
 * ChatInput Component
 *
 * Provides a text input and a green Send button.
 * Pressing Enter or clicking the Send button sends the message.
 * Employs useState to track what the user is currently typing.
 *
 * @param {Object} props
 * @param {Function} props.onSendMessage - Callback triggered when sending
 * @param {boolean} props.disabled - Whether input/button should be temporarily disabled
 */
function ChatInput({ onSendMessage, disabled = false }) {
  // useState holds the live text inside the input field.
  // In React, inputs are commonly controlled components where React state
  // is the single source of truth for the input's current value.
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = inputText.trim();
    if (!trimmed || disabled) {
      return;
    }

    onSendMessage(trimmed);
    setInputText(''); // Clear the input field after sending
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input"
        placeholder="Send a message to Chatbot"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={disabled}
        aria-label="Send a message to Chatbot"
      />
      <button
        type="submit"
        className="send-button"
        disabled={disabled || !inputText.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
}

export default ChatInput;
