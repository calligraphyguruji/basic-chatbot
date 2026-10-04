/**
 * Checks if the user's message matches any local predefined answers.
 * Returns the canned answer string if matched, or null if it should be delegated to Gemini.
 *
 * @param {string} userInput - The text sent by the user
 * @returns {string|null} - The local bot reply, or null if unrecognized
 */
export function getLocalBotResponse(userInput) {
  const query = userInput.trim().toLowerCase();

  // 1. Bot identity check
  if (
    query === 'what is your name' ||
    query === "what's your name" ||
    query === 'who are you' ||
    /^(what('?s| is) your name|who are you)\??$/i.test(query)
  ) {
    return "I'm your React chatbot.";
  }

  // 2. Creator and Owner check
  if (
    /^(who\s+(builds|built|made|created)\s+you|who\s+is\s+your\s+(creator|builder|developer))\??$/i.test(query) ||
    /^(who\s+owns\s+you|who\s+is\s+your\s+owner)\??$/i.test(query)
  ) {
    return 'Mr. Aman Mishra';
  }

  // 3. Bot condition / status check
  if (
    query === 'how are you' ||
    query === 'how are you doing' ||
    /^how are you( doing)?\??$/i.test(query)
  ) {
    return "I'm doing great! How can I help you?";
  }

  // 3. Dynamic date intent check (e.g. "date", "today's date", "can you get me today's date?")
  // Anchored regexes prevent false matches on unrelated queries mentioning dates
  const isDateIntent =
    /^(please\s+)?(can\s+you\s+)?(tell\s+me\s+|get\s+me\s+|give\s+me\s+|show\s+me\s+)?(what('?s|\s+is)\s+)?(the\s+|today'?s\s+|current\s+)?date([?.! ]*)$/i.test(query) ||
    /^(today'?s\s+date|current\s+date|date)([?.! ]*)$/i.test(query);

  // Location-qualified requests (e.g. "what time is it in Tokyo", "date in London")
  // must delegate to Gemini instead of returning the browser's local timezone.
  const hasLocationModifier = /\bin\s+[a-z]/i.test(query);

  if (!hasLocationModifier && isDateIntent) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `Today is ${formattedDate}.`;
  }

  // 4. Dynamic time intent check (e.g. "time", "what time is it?", "what is the time?")
  // Anchored regexes prevent false matches on complex questions like "time complexity of quicksort"
  const isTimeIntent =
    !hasLocationModifier &&
    (/^(please\s+)?(can\s+you\s+)?(tell\s+me\s+|get\s+me\s+|give\s+me\s+|show\s+me\s+)?(what('?s|\s+is)\s+)?(the\s+|current\s+)?time([?.! ]*)$/i.test(query) ||
      /^(please\s+)?(what\s+time\s+is\s+it|what'?s\s+the\s+time)([?.! ]*)$/i.test(query) ||
      /^(current\s+time|time)([?.! ]*)$/i.test(query));

  if (isTimeIntent) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `The current time is ${formattedTime}.`;
  }

  // 5. Greetings (only when greeting is the primary intent, not a preamble to a complex question)
  const isGreetingOnly =
    /^(hello|hi|hey)(\s+(there|chatbot|bot|friend))?[!?.]*$/i.test(query);

  if (isGreetingOnly) {
    return 'Hello! How can I help you?';
  }

  // Unrecognized locally -> delegate to Gemini
  return null;
}

/**
 * Fallback response helper
 */
export function getBotResponse(userInput) {
  const local = getLocalBotResponse(userInput);
  return local || "Sorry, I don't understand that yet.";
}
