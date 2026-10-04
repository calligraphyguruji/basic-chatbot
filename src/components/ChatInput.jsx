import { useState, useEffect, useRef } from 'react';
import { isSpeechRecognitionSupported, initSpeechRecognizer } from '../utils/speechUtils';

/**
 * ChatInput Component
 *
 * Provides a text input, microphone voice input button, and a saffron Send button.
 * Pressing Enter or clicking Send dispatches the message.
 * Clicking the mic button triggers real-time speech-to-text.
 *
 * @param {Object} props
 * @param {Function} props.onSendMessage - Callback triggered when sending
 * @param {boolean} props.disabled - Whether input/button should be temporarily disabled
 */
function ChatInput({ onSendMessage, disabled = false }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Clean up recognition instance when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (disabled) return;

    if (!isSpeechRecognitionSupported()) {
      alert(
        'Voice input is not supported in this browser. Please use Chrome, Safari, or Edge for microphone speech recognition.'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const recognizer = initSpeechRecognizer({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript) => {
        if (transcript) {
          setInputText(transcript);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
    });

    recognitionRef.current = recognizer;
    try {
      recognizer?.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
      setIsListening(false);
    }
  };

  const textareaRef = useRef(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 46), 140)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const trimmed = inputText.trim();
    if (!trimmed || disabled) {
      return;
    }

    onSendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        rows={1}
        className="chat-input"
        placeholder={isListening ? 'Listening... Speak into your mic' : 'Send a message (Shift+Enter for newline)...'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Send a message to Chatbot"
      />
      <button
        type="button"
        className={`mic-button ${isListening ? 'listening' : ''}`}
        onClick={handleToggleVoiceInput}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Speak into microphone'}
        aria-label={isListening ? 'Stop listening' : 'Voice input'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </button>
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
