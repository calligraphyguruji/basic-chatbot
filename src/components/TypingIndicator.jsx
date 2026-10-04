import { BotAvatar } from './Avatars';

/**
 * TypingIndicator Component
 * Renders the bot avatar on the left along with three animated pulsing dots.
 */
function TypingIndicator() {
  return (
    <div
      className="chat-message-row bot-row typing-row"
      role="status"
      aria-label="Chatbot is thinking"
    >
      <BotAvatar />
      <div className="message-bubble bot-bubble typing-bubble">
        <span className="dot" aria-hidden="true"></span>
        <span className="dot" aria-hidden="true"></span>
        <span className="dot" aria-hidden="true"></span>
      </div>
    </div>
  );
}

export default TypingIndicator;
