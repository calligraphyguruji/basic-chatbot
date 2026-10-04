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

/**
 * Finds the highest quality female voice available in the current browser/OS
 * @param {string} [text=''] - Text to be spoken, used to detect script/language
 * @returns {SpeechSynthesisVoice|null}
 */
export function getPreferredFemaleVoice(text = '') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isDevanagari = /[\u0900-\u097F]/.test(text || '');

  // 1. If text is Devanagari Hindi, target Hindi female voices
  if (isDevanagari) {
    const hindiFemalePatterns = [
      /lekha/i,
      /swara/i,
      /kalpana/i,
      /geeta/i,
      /veena/i,
      /google.*(हिन्दी|hindi)/i,
      /microsoft.*(swara|kalpana)/i,
    ];
    for (const regex of hindiFemalePatterns) {
      const match = voices.find((v) => regex.test(v.name));
      if (match) return match;
    }

    // Any Hindi voice not flagged male
    const anyHindiFemale = voices.find(
      (v) => v.lang.startsWith('hi') && !/male|david|mark|george/i.test(v.name)
    );
    if (anyHindiFemale) return anyHindiFemale;

    const fallbackHindi = voices.find((v) => v.lang.startsWith('hi'));
    if (fallbackHindi) return fallbackHindi;
  }

  // 2. For Hinglish (Hindi in Latin script) or Indian English, prioritize Indian female voices
  // (e.g. Veena, Heera, Neerja, Google en-IN) as they have natural Indian phonetics for Hinglish
  const indianFemalePatterns = [
    /veena/i,
    /heera/i,
    /neerja/i,
    /google.*(india|in\b)/i,
    /microsoft.*(heera|neerja)/i,
  ];
  for (const regex of indianFemalePatterns) {
    const match = voices.find((v) => regex.test(v.name));
    if (match) return match;
  }

  // 3. Ranked global high-quality female voices across macOS, iOS, Chrome, Edge, and Windows
  const preferredFemaleNames = [
    /samantha/i,
    /google us english/i,
    /google uk english female/i,
    /microsoft aria/i,
    /microsoft jenny/i,
    /microsoft zira/i,
    /karen/i,
    /victoria/i,
    /fiona/i,
    /tessa/i,
    /moira/i,
  ];

  for (const regex of preferredFemaleNames) {
    const match = voices.find((v) => regex.test(v.name));
    if (match) return match;
  }

  // Any English voice with "female" in its name
  const taggedFemale = voices.find(
    (v) => (v.lang.startsWith('en') || v.lang.startsWith('hi')) && /female/i.test(v.name)
  );
  if (taggedFemale) return taggedFemale;

  // Fallback to en-IN, en-US or default English
  return (
    voices.find((v) => v.lang.startsWith('en-IN') || v.lang.startsWith('en-US') || v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
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

  // Apply preferred female voice
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
