import React from 'react';
import { useWeatherContext } from '../context/Wethercotext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { Clock, X } from 'lucide-react';

const SearchHistory = () => {
  const { searchHistory, getWeather, removeFromHistory } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];

  if (!searchHistory.length) return null;

  return (
    <div className="mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 group">
          <div className="bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <span className="text-sm font-['Inter'] font-medium tracking-tight">{t.search_history}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        {searchHistory.map((city, index) => (
          <button
            key={city}
            onClick={() => getWeather(city)}
            className="group px-3 py-1.5 bg-white/70 dark:bg-gray-800/70 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 
              rounded-full text-sm border border-gray-200/80 dark:border-gray-700/80 
              hover:border-blue-200 dark:hover:border-blue-800/50
              text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400
              transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-sm backdrop-blur-sm
              font-['DM_Sans'] flex items-center gap-1.5"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <span>{city}</span>
            {removeFromHistory && (
              <span 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(city);
                }}
              >
                <X className="h-3 w-3 text-gray-400 hover:text-red-500 transition-colors" />
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent mt-4 opacity-50"></div>
    </div>
  );
};

export default SearchHistory;