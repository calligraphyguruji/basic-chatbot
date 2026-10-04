/**
 * Utility functions for Web Speech API (TTS & STT)
 */

/**
 * Strips markdown characters and symbols for natural text-to-speech pronunciation
 * @param {string} text - Raw markdown message text
 * @returns {string} - Clean plain text for speech synthesis
 */
export function stripMarkdownForSpeech(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links: [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headers: # Header -> Header
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic markers: **text**, *text*, __text__, _text_
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove bullet characters
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Normalize extra whitespace and newlines
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Voice cache to eliminate asynchronous getVoices() delay on macOS, iOS & Chrome
let cachedVoices = [];

function refreshVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  }
  return cachedVoices;
}

// Immediately attempt voice load & attach listener for async browser population
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

// Explicit male voice blacklist to prevent accidental male voice fallbacks
const MALE_VOICE_REGEX =
  /\b(aman|rishi|alex|fred|daniel|david|george|mark|oliver|ralph|tom|junior|jester|albert|bruce|reed|rocko|grandpa)\b/i;

/**
 * Finds the highest quality female voice available in the current browser/OS
 * @param {string} [text=''] - Text to be spoken, used to detect script/language
 * @returns {SpeechSynthesisVoice|null}
 */
export function getPreferredFemaleVoice(text = '') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = refreshVoices();
  if (!voices || voices.length === 0) return null;

  const isDevanagari = /[\u0900-\u097F]/.test(text || '');

  // 1. If text is Devanagari Hindi, target Hindi female voices
  if (isDevanagari) {
    const hindiFemalePatterns = [
      /lekha/i, // macOS built-in Hindi female
      /tara/i, // macOS Indian female
      /swara/i, // Windows Hindi female
      /kalpana/i, // Windows Hindi female
      /geeta/i,
      /veena/i, // macOS Indian English / Hindi voice
      /google.*(हिन्दी|hindi)/i, // Chrome Hindi female
      /microsoft.*(swara|kalpana)/i,
    ];
    for (const regex of hindiFemalePatterns) {
      const match = voices.find((v) => regex.test(v.name));
      if (match) return match;
    }

    // Any Hindi voice not flagged male
    const anyHindiFemale = voices.find(
      (v) => v.lang.startsWith('hi') && !MALE_VOICE_REGEX.test(v.name)
    );
    if (anyHindiFemale) return anyHindiFemale;

    const fallbackHindi = voices.find((v) => v.lang.startsWith('hi'));
    if (fallbackHindi) return fallbackHindi;
  }

  // 2. For Hinglish or Indian English, prioritize Indian female voices
  // (macOS Tara/Veena, Windows Heera/Neerja, Google en-IN)
  const indianFemalePatterns = [
    /tara/i, // macOS primary Indian English female
    /veena/i, // macOS Indian English female
    /heera/i,
    /neerja/i,
    /google.*(india|in\b)/i,
    /microsoft.*(heera|neerja)/i,
  ];
  for (const regex of indianFemalePatterns) {
    const match = voices.find((v) => regex.test(v.name) && !MALE_VOICE_REGEX.test(v.name));
    if (match) return match;
  }

  // 3. Ranked macOS, iOS, Windows, and Chrome global female voices
  // (macOS: Samantha, Tara, Victoria, Karen, Shelley, Sandy, Kathy)
  const preferredFemaleNames = [
    /tara/i, // macOS Indian English female
    /samantha/i, // Primary macOS/iOS female voice
    /victoria/i, // macOS US female voice
    /karen/i, // macOS Australian female voice
    /shelley/i, // macOS US/UK female voice
    /sandy/i, // macOS US female voice
    /kathy/i, // macOS US female voice
    /tessa/i, // macOS South African female voice
    /moira/i, // macOS Irish female voice
    /fiona/i, // macOS Scottish female voice
    /google us english/i, // Chrome female voice
    /google uk english female/i,
    /microsoft aria/i,
    /microsoft jenny/i,
    /microsoft zira/i,
  ];

  for (const regex of preferredFemaleNames) {
    const match = voices.find((v) => regex.test(v.name) && !MALE_VOICE_REGEX.test(v.name));
    if (match) return match;
  }

  // Siri female voices on macOS
  const siriFemale = voices.find(
    (v) => /siri/i.test(v.name) && !/male|voice 1|voice 3/i.test(v.name) && !MALE_VOICE_REGEX.test(v.name)
  );
  if (siriFemale) return siriFemale;

  // Any voice explicitly tagged "female"
  const taggedFemale = voices.find(
    (v) =>
      (v.lang.startsWith('en') || v.lang.startsWith('hi')) &&
      /female/i.test(v.name) &&
      !MALE_VOICE_REGEX.test(v.name)
  );
  if (taggedFemale) return taggedFemale;

  // Safe fallback: First non-male English or Indian voice
  const safeNonMale = voices.find(
    (v) => (v.lang.startsWith('en') || v.lang.startsWith('hi')) && !MALE_VOICE_REGEX.test(v.name)
  );
  if (safeNonMale) return safeNonMale;

  return voices[0] || null;
}

/**
 * Speaks text using the browser's native SpeechSynthesis API
 * @param {string} text - Text to speak
 * @param {Object} callbacks
 * @param {Function} [callbacks.onStart] - Triggered when speech begins
 * @param {Function} [callbacks.onEnd] - Triggered when speech finishes
 * @param {Function} [callbacks.onError] - Triggered on error
 * @returns {SpeechSynthesisUtterance|null}
 */
export function speakText(text, { onStart, onEnd, onError } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    onError?.('SpeechSynthesis not supported');
    return null;
  }

  // Stop any ongoing speech first
  window.speechSynthesis.cancel();

  const cleanText = stripMarkdownForSpeech(text);
  if (!cleanText) {
    onEnd?.();
    return null;
  }

  const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.08; // Warm, natural feminine pitch
  utterance.lang = isDevanagari ? 'hi-IN' : 'en-IN';

  // Apply preferred female voice (pre-cached or retrieved)
  const femaleVoice = getPreferredFemaleVoice(cleanText);
  if (femaleVoice) {
    utterance.voice = femaleVoice;
    if (femaleVoice.lang) {
      utterance.lang = femaleVoice.lang;
    }
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    // Ignore canceled/interrupted events triggered by user stopping speech
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('Speech synthesis error:', e);
      onError?.(e);
    } else {
      onEnd?.();
    }
  };

  // If voices are still loading asynchronously, hook once to assign female voice before speech
  if (!femaleVoice && cachedVoices.length === 0) {
    const origHandler = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = () => {
      refreshVoices();
      const loadedFemale = getPreferredFemaleVoice(cleanText);
      if (loadedFemale) {
        utterance.voice = loadedFemale;
        if (loadedFemale.lang) utterance.lang = loadedFemale.lang;
      }
      window.speechSynthesis.speak(utterance);
      if (typeof origHandler === 'function') origHandler();
    };
    return utterance;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stops any active speech synthesis
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Checks if SpeechRecognition (STT) is supported
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Initializes browser SpeechRecognition instance
 */
export function initSpeechRecognizer({ onResult, onEnd, onError, onStart, lang = 'en-IN' }) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = false;
  recognition.interimResults = true;
  // en-IN accurately recognizes Indian English, Hinglish, and Hindi names
  recognition.lang = lang || 'en-IN';

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult?.(transcript);
  };

  recognition.onerror = (event) => {
    console.warn('SpeechRecognition error:', event.error);
    onError?.(event.error);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  return recognition;
}
