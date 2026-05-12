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
const LANG_LABELS = { en: '🇬🇧 English', hi: '🇮🇳 Hindi', both: '🌐 Both' };

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
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://tapmaan-backend.onrender.com';

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

    //Build the question with language instruction for the AI
    const questionForAI = buildQuestionWithLangInstruction(rawQuestion, newLang);



    // ADD THIS
    console.log('[DEBUG] weather_context being sent:', JSON.stringify({
      temp: weather?.main?.temp,
      aqi: airQuality?.list?.[0]?.main?.aqi,
      full_air_quality: airQuality,
      full_weather: weather
    }));

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionForAI,
          weather_context: {
            current: weather || {},
            forecast: forecast || {},
            air_quality: airQuality || {},
            local_time: new Date().toLocaleTimeString(),
            local_date: new Date().toLocaleDateString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to assistant');

      const data = await response.json();

      //If it was a language-change command, also show a confirmation
      let assistantContent = data.answer;
      if (langCommand) {
        const confirmations = {
          en: '✅ Got it! I will now respond in English.',
          hi: '✅ ठीक है! अब मैं हिंदी में जवाब दूंगा।',
          both: '✅ Sure! I will now respond in both Hindi and English.'
        };
        // Prepend confirmation only if the answer doesn't already acknowledge it
        assistantContent = confirmations[langCommand] + '\n\n' + data.answer;
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
        className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95"
      >
        {isOpen ? <span className="text-2xl font-bold">×</span> : <span className="text-2xl">💬</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-20 right-0 w-80 md:w-96 h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border animate-slide-up ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>

          {/* Header */}
          <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
            <div className="flex flex-col">
              <span>Tapmaan Assistant</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">Powered by Local AI</span>
                {/* Current response language badge */}
                <span className="text-[9px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
                  {LANG_LABELS[responseLang]}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
                setResponseLang('en');
              }}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-500/20">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                  : darkMode
                    ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                    : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Thinking dots */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                </div>
                <span>Assistant is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Error Banner */}
          {voiceError && (
            <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border-t border-red-100">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Listening Indicator */}
          {isListening && (
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100">
              <div className="flex items-end gap-0.5 h-4">
                {[0, 100, 200, 100, 0].map((delay, i) => (
                  <span key={i} className="w-0.5 bg-blue-500 rounded animate-bounce" style={{ animationDelay: `${delay}ms` }}></span>
                ))}
              </div>
              <span>Listening in {voiceLang === 'hi-IN' ? 'Hindi 🇮🇳' : 'English 🇬🇧'}...</span>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className={`p-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex gap-1.5 items-center">

              {/* Voice Language Toggle (EN/HI) */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceLang}
                  title={`Voice input: ${voiceLang === 'en-US' ? 'English (click to switch to Hindi)' : 'Hindi (click to switch to English)'}`}
                  className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-1 rounded-md border transition-all ${voiceLang === 'hi-IN'
                    ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400'
                    : darkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
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
                className={`flex-1 p-2 rounded-lg text-sm outline-none border focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'
                  } ${isListening ? 'border-blue-400 ring-1 ring-blue-400' : ''}`}
              />

              {/* Mic Button */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? 'Stop listening' : `Speak in ${voiceLang === 'hi-IN' ? 'Hindi' : 'English'}`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                    : darkMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm flex-shrink-0"
              >
                Send
              </button>
            </div>

            {/* Helper hint */}
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              {isVoiceSupported
                ? `🎙️ ${voiceLang === 'hi-IN' ? 'Hindi' : 'English'} voice • Say "answer in Hindi/English/both" to change language`
                : 'Say "answer in Hindi/English/both" to change language'}
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
