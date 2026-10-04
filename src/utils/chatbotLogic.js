/**
 * Generates a local response based on the user's message.
 * Supports date, time, greetings, bot identity, condition, and a fallback response.
 *
 * @param {string} userInput - The text sent by the user
 * @returns {string} - The simulated chatbot response
 */
export function getBotResponse(userInput) {
  const query = userInput.trim().toLowerCase();

  // 1. Bot identity check
  if (
    query.includes('what is your name') ||
    query.includes("what's your name") ||
    query.includes('who are you')
  ) {
    return "I'm your React chatbot.";
  }

  // 2. Bot condition / status check
  if (query.includes('how are you')) {
    return "I'm doing great! How can I help you?";
  }

  // 3. Dynamic date using word boundary check (\bdate\b, \btoday\b)
  if (/\b(date|today)\b/i.test(query)) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `Today is ${formattedDate}.`;
  }

  // 4. Dynamic time using word boundary check (\btime\b, \bclock\b)
  if (/\b(time|clock)\b/i.test(query)) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `The current time is ${formattedTime}.`;
  }

  // 5. Greetings using word boundary check (\bhello\b, \bhi\b, \bhey\b)
  if (/\b(hello|hi|hey)\b/i.test(query)) {
    return 'Hello! How can I help you?';
  }

  // 6. Fallback for unrecognized messages
  return "Sorry, I don't understand that yet.";
}
