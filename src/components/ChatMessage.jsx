import { BotAvatar, UserAvatar } from './Avatars';

/**
 * ChatMessage Component
 * Displays user message or bot message with avatar and text-to-speech speaker button.
 *
 * @param {Object} props
 * @param {Object} props.message - { id, sender: 'user' | 'bot', text }
 * @param {boolean} [props.isSpeaking] - Whether this specific message is actively playing audio
 * @param {Function} [props.onToggleSpeak] - Callback to toggle speech playback
 */
function ChatMessage({ message, isSpeaking = false, onToggleSpeak }) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="chat-message-row user-row">
        <div className="message-bubble user-bubble">
          {message.text}
        </div>
        <UserAvatar />
      </div>
    );
  }

  return (
    <div className="chat-message-row bot-row">
      <BotAvatar />
      <div className="bot-bubble-wrapper">
        <div className="message-bubble bot-bubble">
          {message.text}
        </div>
        {onToggleSpeak && (
          <button
            type="button"
            className={`speaker-button ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => onToggleSpeak(message.id, message.text)}
            title={isSpeaking ? 'Stop speaking' : 'Listen to message'}
            aria-label={isSpeaking ? 'Stop speaking' : 'Listen to message'}
          >
            {isSpeaking ? (
              // Stop / Mute Icon
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Speaker Icon
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
