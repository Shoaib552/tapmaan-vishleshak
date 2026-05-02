import React from 'react';
import { Sun, Sunrise, Sunset, Moon, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const Day = ({ timezone = 0, sunrise, sunset }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const locationTime = new Date(utcTime + (timezone * 1000));
  
  const hours = locationTime.getHours();
  const sunriseTime = new Date(sunrise * 1000);
  const sunsetTime = new Date(sunset * 1000);
  
  const getTimeOfDay = () => {
    // Early morning
    if (hours >= 5 && hours < 8) {
      return {
        name: "Early Morning",
        icon: <Sunrise className="h-5 w-5 text-orange-400" />,
        color: "from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30",
        textColor: "text-orange-700 dark:text-orange-300",
        iconBg: "bg-orange-100 dark:bg-orange-900/30"
      };
    }
    // Morning 
    else if (hours >= 8 && hours < 12) {
      return {
        name: "Morning",
        icon: <Sun className="h-5 w-5 text-yellow-500" />,
        color: "from-yellow-100 to-blue-100 dark:from-yellow-900/30 dark:to-blue-900/30",
        textColor: "text-yellow-700 dark:text-yellow-300", 
        iconBg: "bg-yellow-100 dark:bg-yellow-900/30"
      };
    }
    // Afternoon 
    else if (hours >= 12 && hours < 17) {
      return {
        name: "Afternoon",
        icon: <Sun className="h-5 w-5 text-blue-500" />,
        color: "from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30",
        textColor: "text-blue-700 dark:text-blue-300",
        iconBg: "bg-blue-100 dark:bg-blue-900/30"
      };
    }
    // Evening 
    else if (hours >= 17 && hours < 20) {
      return {
        name: "Evening",
        icon: <Sunset className="h-5 w-5 text-purple-500" />,
        color: "from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30",
        textColor: "text-purple-700 dark:text-purple-300",
        iconBg: "bg-purple-100 dark:bg-purple-900/30" 
      };
    }
    // Night 
    else if (hours >= 20 && hours < 24) {
      return {
        name: "Night",
        icon: <Moon className="h-5 w-5 text-indigo-500" />,
        color: "from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30",
        textColor: "text-indigo-700 dark:text-indigo-300",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/30"
      };
    }
    // Midnight
    else {
      return {
        name: "Late Night",
        icon: <Clock className="h-5 w-5 text-gray-500" />,
        color: "from-gray-100 to-indigo-100 dark:from-gray-900/50 dark:to-indigo-900/30",
        textColor: "text-gray-700 dark:text-gray-300",
        iconBg: "bg-gray-100 dark:bg-gray-800/50"
      };
    }
  };

  const timeOfDay = getTimeOfDay();
  const localTime = locationTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  // Calculate sun position percentage (0 to 100)
  const totalDayMs = (sunset - sunrise) * 1000;
  const currentMs = locationTime.getTime() - (sunrise * 1000);
  const sunPos = Math.max(0, Math.min(100, (currentMs / totalDayMs) * 100));
  const isDay = locationTime.getTime() > (sunrise * 1000) && locationTime.getTime() < (sunset * 1000);

  const timeNames = {
    en: {
      "Early Morning": "Early Morning",
      "Morning": "Morning",
      "Afternoon": "Afternoon",
      "Evening": "Evening",
      "Night": "Night",
      "Late Night": "Late Night",
      "Local Time": "Local Time"
    },
    hi: {
      "Early Morning": "तड़के सुबह",
      "Morning": "सुबह",
      "Afternoon": "दोपहर",
      "Evening": "शाम",
      "Night": "रात",
      "Late Night": "देर रात",
      "Local Time": "स्थानीय समय"
    }
  };

  return (
    <div className={`p-4 bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/20 animate-fade-in group`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${timeOfDay.iconBg} rounded-full group-hover:rotate-12 transition-transform duration-500`}>
              {timeOfDay.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">
                {timeNames[language]["Local Time"]}
              </p>
              <p className="text-lg font-bold text-white font-['DM_Sans']">
                {localTime}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-white/80 border border-white/10`}>
            {timeNames[language][timeOfDay.name]}
          </div>
        </div>

        {/* Sun Path Visualization */}
        {isDay && (
          <div className="relative pt-4 pb-2">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 transition-all duration-1000"
                style={{ width: `${sunPos}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 px-1">
              <Sunrise className="h-3 w-3 text-orange-400" />
              <Sunset className="h-3 w-3 text-purple-400" />
            </div>
            {/* Moving Sun Icon */}
            <div 
              className="absolute top-0 transition-all duration-1000 ease-in-out pointer-events-none"
              style={{ left: `calc(${sunPos}% - 8px)` }}
            >
              <Sun className="h-4 w-4 text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day;