import { sendChatCompletion } from './llm.js';

/**
 * Extracts key personal facts or preferences from recent dialogue
 */
export async function extractMemoriesFromConversation(userMessage, botResponse) {
  // Quick heuristic filter to save LLM tokens if user message lacks self-referential words
  const triggerWords = /\b(my|i am|i'm|i live|i prefer|i like|i love|i hate|i learn|i'm learning|call me|i work as|my name is|mera naam|mujhe|seekh raha)\b/i;
  if (!triggerWords.test(userMessage)) {
    return [];
  }

  const prompt = `You are a memory extraction component for an AI assistant.
Analyze this user-assistant interaction and extract long-term preferences, identity, skills, goals, or facts about the user.
Ignore temporary ephemeral instructions (like "write in bullet points for this reply").

User: "${userMessage.replace(/"/g, '\\"')}"
Assistant: "${(botResponse || '').slice(0, 300).replace(/"/g, '\\"')}"

Output JSON array only of items in this exact format:
[
  { "key": "name", "value": "Aman", "importance": 3 },
  { "key": "learning_topic", "value": "C++", "importance": 2 }
]
If nothing long-term should be remembered, return: []
Do not wrap in markdown quotes. Valid JSON only.`;

  try {
    const text = await sendChatCompletion({
      messages: [
        { role: 'system', content: 'You extract user memory in valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      maxTokens: 256,
    });
    const cleaned = text.trim().replace(/^```json|```$/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((m) => m.key && m.value).slice(0, 5);
    }
  } catch (err) {
    console.warn('[Memory extraction warning]:', err.message);
  }
  return [];
}

/**
 * Formats user memories for inclusion in system prompt / context
 */
export function formatMemoriesForPrompt(memories) {
  if (!Array.isArray(memories) || memories.length === 0) return '';
  const lines = memories.map((m) => `- ${m.memory_key}: ${m.memory_value}`);
  return `[USER LONG-TERM MEMORY & PREFERENCES]:\n${lines.join('\n')}\nUse these preferences naturally to personalize your answers without explicitly saying "According to my memory".`;
}
