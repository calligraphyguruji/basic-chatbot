/**
 * Generates a local response based on the user's message.
 * Supports date, time, greetings, bot identity, condition, and a fallback response.
 *
 * @param {string} userInput - The text sent by the user
 * @returns {string} - The simulated chatbot response
 */
export function getBotResponse(userInput) {
  const query = userInput.trim().toLowerCase();

  // 1. Dynamic date using JavaScript's Date object
  if (query.includes('date') || query.includes('today')) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `Today is ${formattedDate}.`;
  }

  // 2. Dynamic time using JavaScript's Date object
  if (query.includes('time') || query.includes('clock')) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `The current time is ${formattedTime}.`;
  }

  // 3. Bot identity
  if (
    query.includes('what is your name') ||
    query.includes("what's your name") ||
    query.includes('who are you')
  ) {
    return "I'm your React chatbot.";
  }

  // 4. Bot condition / status
  if (query.includes('how are you')) {
    return "I'm doing great! How can I help you?";
  }

  // 5. Greetings
  if (
    query.startsWith('hello') ||
    query.startsWith('hi') ||
    query.startsWith('hey') ||
    query === 'hello' ||
    query === 'hi' ||
    query === 'hey' ||
    query.includes('hello chatbot') ||
    query.includes('hi chatbot')
  ) {
    return 'Hello! How can I help you?';
  }

  // 6. Fallback for unrecognized messages
  return "Sorry, I don't understand that yet.";
}
