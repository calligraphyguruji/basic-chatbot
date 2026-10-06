import { BotAvatar } from './Avatars';

/**
 * Enhanced TypingIndicator Component
 * Shows animated pulsing dots and optional contextual status text ("Thinking deeply...", "Creating image...")
 */
function TypingIndicator({ statusText = 'Thinking...' }) {
  return (
    <div
      className="chat-message-row bot-row typing-row"
      role="status"
      aria-label={statusText || 'AI Assistant is thinking'}
    >
      <BotAvatar />
      <div className="message-bubble bot-bubble typing-bubble-wrapper">
        <div className="typing-dots">
          <span className="dot" aria-hidden="true"></span>
          <span className="dot" aria-hidden="true"></span>
          <span className="dot" aria-hidden="true"></span>
        </div>
        {statusText && <span className="typing-status-label">{statusText}</span>}
      </div>
    </div>
  );
}

export default TypingIndicator;
