import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWeatherContext } from '../context/Wethercotext';

// ─── Language Detection ────────────────────────────────────────────────────────
// Detects if the user's message contains a language-change command.
// Returns 'en' | 'hi' | 'both' | null
const detectLanguageCommand = (text) => {
  const t = text.toLowerCase().trim();

  // English commands
  if (/\b(answer|reply|respond|speak|write|talk)\s+(in\s+)?english\b/.test(t) ||
    /\bswitch\s+to\s+english\b/.test(t) ||
    /\benglish\s+(mein|me|mai)\b/.test(t)) {
    return 'en';
  }

  // Hindi commands
  if (/\b(answer|reply|respond|speak|write|talk)\s+(in\s+)?hindi\b/.test(t) ||
    /\bswitch\s+to\s+hindi\b/.test(t) ||
    /\bhindi\s+(mein|me|mai)\b/.test(t) ||
    /\b(hindi|हिंदी)\s+(me|mein|mai)?\s*(jawab|bolo|batao|bata)?\b/.test(t)) {
    return 'hi';
  }

  // Both languages commands
  if (/\b(both|dono|दोनों)\s*(language|bhasha|bhashaon)?\b/.test(t) ||
    /\b(answer|reply)\s+in\s+both\b/.test(t)) {
    return 'both';
  }

  return null; // no language command detected
};

// ─── Build question with language instruction for the AI ──────────────────────
const buildQuestionWithLangInstruction = (question, lang) => {
  if (lang === 'hi') {
    return `Please respond ONLY in Hindi (Devanagari script). Do not use English at all.\n\nUser: ${question}`;
  }
  if (lang === 'both') {
    return `Please respond in BOTH Hindi (Devanagari script) and English. First give the Hindi answer, then the English answer.\n\nUser: ${question}`;
  }
  // Default: English
  return `Please respond in English only.\n\nUser: ${question}`;
};

// ─── Language display labels ───────────────────────────────────────────────────
const LANG_LABELS = { hi: '🇮🇳 Hindi', both: '🌐 Both' };

// ──────────────────────────────────────────────────────────────────────────────

const ChatAssistant = () => {
  const { weather, forecast, airQuality, darkMode } = useWeatherContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Tapmaan Assistant 🌤️\n\nI respond in English by default. You can change the language anytime:\n• "Answer in Hindi"\n• "Answer in English"\n• "Answer in both languages"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Response language preference (what language the AI uses to reply)
  // Default: English
  const [responseLang, setResponseLang] = useState('en');

  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  // Voice input language toggle (separate from AI response language)
  const [voiceLang, setVoiceLang] = useState('en-US'); // 'en-US' | 'hi-IN'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Dynamic API URL logic
  // FORCE LOCAL for debugging and parity fix
  const API_URL = 'http://127.0.0.1:8000';

  // Check if browser supports Web Speech API on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) setIsVoiceSupported(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isOpen]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // ─── Voice Input Handler ───────────────────────────────────────────────────
  const handleVoiceInput = useCallback(() => {
    setVoiceError('');

    // Toggle off if already listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Use the user's chosen voice language (EN or HI toggle)
    recognition.lang = voiceLang;
    recognition.interimResults = true;  // Live transcript as user speaks
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // KEEP LISTENING even if user pauses

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let fullTranscript = '';
      // Accumulate all results from the beginning to support continuous mode
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setInput(fullTranscript); // Live update the text box
    };

    recognition.onerror = (event) => {
      // Don't stop listening for "no-speech" errors in continuous mode
      if (event.error === 'no-speech') return;

      setIsListening(false);
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow it in browser settings.');
      } else {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isListening, voiceLang]);

  // ─── Toggle Voice Language (EN ↔ HI) ──────────────────────────────────────
  const toggleVoiceLang = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    setVoiceLang(prev => prev === 'en-US' ? 'hi-IN' : 'en-US');
  };

  // ─── Send Message Handler ──────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e) e.preventDefault();

    // Stop mic if still listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    if (!input.trim() || isLoading) return;

    const rawQuestion = input.trim();

    //Detect if user is giving a language command
    const langCommand = detectLanguageCommand(rawQuestion);
    let newLang = responseLang;
    if (langCommand) {
      newLang = langCommand;
      setResponseLang(langCommand);
    }

    //Show user's original message in chat (not the modified version)
    const userMessage = { role: 'user', content: rawQuestion };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setVoiceError('');

    // ── DIRECT TRANSPARENCY ──────────────────────────────────────────────
    // Send the raw question directly to the backend.
    const questionForAI = rawQuestion;

    // Compute local time from weather data (dt + timezone offset)
    let localTime = null;
    if (weather?.dt && weather?.timezone !== undefined) {
      const localTimestamp = (weather.dt + weather.timezone) * 1000;
      const d = new Date(localTimestamp);
      const h = d.getUTCHours();
      const m = d.getUTCMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      localTime = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm} (IST)`;
    }

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionForAI,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
          weather_context: {
            current: weather || {},
            air_quality: airQuality || {},
            city: weather?.name || "",
            local_time: localTime,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to assistant');

      const data = await response.json();

      // Prioritize the hardened 'formatted' response from the deterministic engine
      const baseAnswer = data.formatted || data.answer;

      //If it was a language-change command, also show a confirmation
      let assistantContent = baseAnswer;
      if (langCommand) {
        const confirmations = {
          en: '✅ Got it! I will now respond in English.',
          hi: '✅ ठीक है! अब मैं हिंदी में जवाब दूंगा।',
          both: '✅ Sure! I will now respond in both Hindi and English.'
        };
        // Prepend confirmation
        assistantContent = confirmations[langCommand] + '\n\n' + baseAnswer;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I am having trouble connecting to the AI engine. Please ensure Ollama is running.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Bubble Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md text-white shadow-xl flex items-center justify-center hover:bg-white/20 transition-all transform hover:scale-110 active:scale-95 border border-white/20 group"
      >
        {isOpen ? (
          <span className="text-3xl font-light group-hover:rotate-90 transition-transform duration-300">×</span>
        ) : (
          <span className="text-3xl filter drop-shadow-md">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-24 right-0 w-85 md:w-[400px] h-[550px] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border backdrop-blur-2xl animate-slide-up ${darkMode
          ? 'bg-black/40 border-white/10 text-white'
          : 'bg-white/[0.12] border-white/[0.15] text-white'
          }`}>

          {/* Header */}
          <div className="p-4 bg-white/10 text-white font-bold flex justify-between items-center backdrop-blur-md border-b border-white/10 shadow-sm">
            <div className="flex flex-col">
              <span className="tracking-tight">Tapmaan Assistant</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-normal opacity-70 uppercase tracking-wider">Climate AI</span>
                <span className="text-[9px] font-semibold bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10">
                  {LANG_LABELS[responseLang]}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
                setResponseLang('en');
              }}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 transition-all active:scale-95"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-sm shadow-sm border ${msg.role === 'user'
                  ? 'bg-blue-500/30 text-white rounded-tr-none border-blue-400/30'
                  : 'bg-white/5 text-white/90 rounded-tl-none border-white/10'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Thinking dots */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-white/60 animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce delay-150"></span>
                </div>
                <span>Assistant is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Error Banner */}
          {voiceError && (
            <div className="px-4 py-2 text-xs text-red-400 bg-red-900/20 border-t border-white/10 backdrop-blur-sm">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Listening Indicator */}
          {isListening && (
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 border-t border-white/10 backdrop-blur-sm">
              <div className="flex items-end gap-0.5 h-4">
                {[0, 100, 200, 100, 0].map((delay, i) => (
                  <span key={i} className="w-0.5 bg-blue-400 rounded animate-bounce" style={{ animationDelay: `${delay}ms` }}></span>
                ))}
              </div>
              <span>Listening in {voiceLang === 'hi-IN' ? 'Hindi 🇮🇳' : 'English 🇬🇧'}...</span>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-lg">
            <div className="flex gap-2 items-center">

              {/* Voice Language Toggle (EN/HI) */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceLang}
                  title={`Voice input: ${voiceLang === 'en-US' ? 'English (click to switch to Hindi)' : 'Hindi (click to switch to English)'}`}
                  className={`flex-shrink-0 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${voiceLang === 'hi-IN'
                    ? 'bg-orange-500/20 border-orange-400/30 text-orange-300'
                    : 'bg-white/10 border-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  {voiceLang === 'hi-IN' ? 'HI' : 'EN'}
                </button>
              )}

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask in any language...'}
                className={`flex-1 p-2.5 rounded-xl text-sm outline-none border transition-all bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20 ${isListening ? 'border-blue-400/50 ring-2 ring-blue-400/20' : ''}`}
              />

              {/* Mic Button */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? 'Stop listening' : `Speak in ${voiceLang === 'hi-IN' ? 'Hindi' : 'English'}`}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isListening
                    ? 'bg-red-500/30 text-red-200 border border-red-400/30 animate-pulse'
                    : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                    <path d="M6.5 11a5.5 5.5 0 0 0 11 0h-1.5a4 4 0 0 1-8 0H6.5z" />
                    <path d="M11 19.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
                  </svg>
                </button>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-500/40 hover:bg-blue-500/60 text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-20 transition-all border border-blue-400/30 shadow-lg active:scale-95"
              >
                Send
              </button>
            </div>

            {/* Helper hint */}
            {/* <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              {isVoiceSupported
                ? `🎙️ ${voiceLang === 'hi-IN' ? 'Hindi' : 'English'} voice • Say "answer in Hindi/English/both" to change language`
                : 'Say "answer in Hindi/English/both" to change language'}
            </p> */}
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
