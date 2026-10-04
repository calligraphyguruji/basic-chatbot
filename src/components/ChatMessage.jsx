import { BotAvatar, UserAvatar } from './Avatars';

/**
 * ChatMessage Component
 * Conditionally displays either a user message aligned to the right
 * or a bot message aligned to the left with their respective avatars.
 *
 * @param {Object} props
 * @param {Object} props.message - { id, sender: 'user' | 'bot', text }
 */
function ChatMessage({ message }) {
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
      <div className="message-bubble bot-bubble">
        {message.text}
      </div>
    </div>
  );
}

export default ChatMessage;
