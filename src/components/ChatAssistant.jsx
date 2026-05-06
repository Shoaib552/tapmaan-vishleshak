import React, { useState, useRef, useEffect } from 'react';
import { useWeatherContext } from '../context/Wethercotext';

const ChatAssistant = () => {
  const { weather, forecast, airQuality, darkMode } = useWeatherContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Tapmaan Assistant. How can I help you with the weather today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dynamic API URL logic (same as WeatherContext)
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://tapmaan-backend.onrender.com';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus the input when opened
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          weather_context: {
            current: weather || {},
            forecast: forecast || {},
            air_quality: airQuality || {}
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to assistant');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I am having trouble connecting to my local AI engine. Please ensure Ollama is running.' }]);
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
        {isOpen ? (
          <span className="text-2xl font-bold">×</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-20 right-0 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border animate-slide-up ${
          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
            <div className="flex flex-col">
              <span>Tapmaan Assistant</span>
              <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">Powered by Local AI</span>
            </div>
            <button onClick={() => setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }])} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded">Clear</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-500/20">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                    : darkMode ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
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

          {/* Input */}
          <form onSubmit={handleSend} className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the weather..."
                className={`flex-1 p-2 rounded-lg text-sm outline-none border focus:border-blue-500 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
