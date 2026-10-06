/**
 * Query Intent and Task Classification Engine
 * Identifies user task type, knowledge requirements, and formatting instructions.
 */

export const TASK_TYPES = {
  FORMULA_SHEET: 'FORMULA_SHEET',
  NOTES: 'NOTES',
  SUMMARY: 'SUMMARY',
  EXPLANATION: 'EXPLANATION',
  COMPARISON: 'COMPARISON',
  MCQ: 'MCQ',
  QUIZ: 'QUIZ',
  STEP_BY_STEP: 'STEP_BY_STEP',
  STUDY_PLAN: 'STUDY_PLAN',
  CODE: 'CODE',
  TABLE: 'TABLE',
  CONVERSATIONAL: 'CONVERSATIONAL',
};

const TASK_PATTERNS = [
  {
    type: TASK_TYPES.FORMULA_SHEET,
    pattern: /\b(formula(\s+sheet|\s+list|s)?|important\s+formulas?|all\s+formulas?|सूत्र)\b/i,
    instructions:
      'Generate a comprehensive, well-organized formula sheet. Group formulas logically under clear markdown headings. Include symbol definitions, SI units, and important physical/chemical/mathematical constants where applicable. Use LaTeX formatting ($...$ and $$...$$).',
  },
  {
    type: TASK_TYPES.MCQ,
    pattern: /\b(\d+\s*mcqs?|mcqs?|multiple\s+choice\s+questions?|quiz\s+questions?|objective\s+questions?)\b/i,
    instructions:
      'Generate the requested number of high-quality multiple choice questions (MCQs). Format each question clearly with options (A, B, C, D). Always provide a separate Answer Key with brief explanations at the end.',
  },
  {
    type: TASK_TYPES.QUIZ,
    pattern: /\b(quiz|test\s+me|practice\s+questions?|mock\s+questions?)\b/i,
    instructions:
      'Create an engaging practice quiz. Provide numbered questions with options or prompts, followed by an Answer Key and conceptual explanations at the end.',
  },
  {
    type: TASK_TYPES.NOTES,
    pattern: /\b(notes|chapter\s+notes|revision\s+notes|handwritten\s+notes|short\s+notes|quick\s+revision|study\s+notes)\b/i,
    instructions:
      'Generate structured, high-yield chapter/revision notes. Use hierarchical markdown headers, bullet points, key definitions, core mechanisms/principles, and highlighted takeaways.',
  },
  {
    type: TASK_TYPES.SUMMARY,
    pattern: /\b(summarize|summary|summarise|brief\s+overview|nutshell|key\s+points|tldr|tl;dr)\b/i,
    instructions:
      'Provide a clear, high-density executive summary highlighting core takeaways, key facts, and essential conclusions without unnecessary fluff.',
  },
  {
    type: TASK_TYPES.COMPARISON,
    pattern: /\b(compare|comparison|difference\s+between|differences\s+between|vs\.?|versus)\b/i,
    instructions:
      'Provide a structured comparison. Include a clear Markdown comparison table highlighting key parameters/dimensions, followed by nuanced bulleted distinctions.',
  },
  {
    type: TASK_TYPES.TABLE,
    pattern: /\b(table|tabular\s+format|in\s+a\s+table|tabulate)\b/i,
    instructions:
      'Format the requested information into a well-structured GitHub-flavored Markdown table with clear column headers and aligned data.',
  },
  {
    type: TASK_TYPES.STEP_BY_STEP,
    pattern: /\b(step\s*by\s*step|derivation|derive|solve|solution|how\s+to\s+solve|workflow)\b/i,
    instructions:
      'Provide a clear step-by-step solution or derivation. Number each step logically, state assumptions explicitly, and show intermediate steps clearly with LaTeX math notation where relevant.',
  },
  {
    type: TASK_TYPES.STUDY_PLAN,
    pattern: /\b(study\s+plan|preparation\s+strategy|roadmap|schedule|revision\s+plan|how\s+to\s+prepare)\b/i,
    instructions:
      'Create a pragmatic, realistic study roadmap or schedule broken down by milestones/days/weeks, prioritizing high-yield topics and active recall.',
  },
  {
    type: TASK_TYPES.CODE,
    pattern: /\b(write\s+(a\s+)?(code|program|script|function)|implement|debug|syntax|algorithm|python|javascript|typescript|c\+\+|java|react)\b/i,
    instructions:
      'Provide clean, production-ready, idiomatic code with syntax-highlighted code fences (```language). Add concise explanatory comments and mention edge cases or complexity.',
  },
  {
    type: TASK_TYPES.EXPLANATION,
    pattern: /\b(explain|what\s+is|how\s+does|how\s+do|why\s+is|why\s+does|describe|overview|concept\s+of)\b/i,
    instructions:
      'Provide an accurate, lucid, and well-structured explanation. Start with an intuitive definition, then delve into core concepts and practical examples.',
  },
];

const TIME_SENSITIVE_PATTERNS = [
  /\b(today('?s)?|tonight|yesterday|tomorrow|now|currently|current|latest|recent|this\s+week|this\s+month|this\s+year)\b/i,
  /\b(who\s+won|score|scores|match|cricket|ipl|football|fifa|world\s+cup|election|results|news|weather)\b/i,
  /\b(stock\s+price|crypto|bitcoin|btc|eth|market\s+price|gold\s+rate|flight\s+status)\b/i,
  /\b(release\s+date|version\s+\d+|iphone\s+1[5-9]|newest|update|breaking)\b/i,
  /\b(aaj|kal|taza|samachar|khabar|bhav|daam|kya\s+hua)\b/i,
];

const ACADEMIC_SUBJECT_PATTERNS = [
  /\b(atomic\s+structure|thermodynamics|organic\s+chemistry|chemical\s+bonding|periodic\s+table|equilibrium)\b/i,
  /\b(photosynthesis|respiration|genetics|dna|rna|mitosis|meiosis|ecology|evolution|cell\s+biology)\b/i,
  /\b(kinematics|gravitation|electromagnetism|optics|quantum|bohr|newton|relativity|fluid\s+mechanics)\b/i,
  /\b(calculus|integration|differentiation|matrices|probability|trigonometry|algebra|geometry)\b/i,
  /\b(data\s+structures|algorithms|operating\s+systems|dbms|normalization|computer\s+networks|oops|sql)\b/i,
];

/**
 * Classifies a user message to determine intent, tasks, and context needs.
 * @param {string} message - Raw user input
 * @returns {Object} Classified intent metadata
 */
export function classifyIntent(message) {
  const query = (message || '').trim();
  if (!query) {
    return {
      primaryTask: TASK_TYPES.CONVERSATIONAL,
      isMultiTask: false,
      subTasks: [],
      needsCurrentInfo: false,
      needsKnowledgeBase: false,
      formatInstructions: 'Provide a brief, natural response.',
    };
  }

  // Identify matching tasks
  const matchedTasks = [];
  const instructionsList = [];

  for (const { type, pattern, instructions } of TASK_PATTERNS) {
    if (pattern.test(query)) {
      matchedTasks.push(type);
      instructionsList.push(instructions);
    }
  }

  // Default to CONVERSATIONAL if no specific task matched
  const primaryTask = matchedTasks[0] || TASK_TYPES.CONVERSATIONAL;
  const isMultiTask = matchedTasks.length > 1;

  // Check if query is time-sensitive (needs web search)
  const explicitSearch = /\b(search\s+(the\s+)?web|google\s+it|browse\s+online|look\s+up\s+online)\b/i.test(query);
  const isTimeSensitive = TIME_SENSITIVE_PATTERNS.some((p) => p.test(query));
  const needsCurrentInfo = explicitSearch || isTimeSensitive;

  // Check if query is educational/subject knowledge (candidate for RAG)
  const isAcademicTopic = ACADEMIC_SUBJECT_PATTERNS.some((p) => p.test(query));
  const needsKnowledgeBase =
    isAcademicTopic ||
    [TASK_TYPES.FORMULA_SHEET, TASK_TYPES.NOTES, TASK_TYPES.MCQ, TASK_TYPES.STEP_BY_STEP].includes(primaryTask);

  // Combine task instructions
  let formatInstructions = instructionsList.join('\n\n');
  if (!formatInstructions) {
    formatInstructions =
      'Answer clearly, accurately, and thoroughly according to the user request. Use Markdown formatting and LaTeX math syntax where appropriate.';
  }

  return {
    primaryTask,
    isMultiTask,
    subTasks: matchedTasks,
    needsCurrentInfo,
    needsKnowledgeBase,
    formatInstructions,
  };
}
