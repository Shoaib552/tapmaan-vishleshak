import React, { useState, useEffect } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import Details from "./Details";
import { Calendar, ChevronRight } from "lucide-react";

const Forecast = () => {
  const { forecast, weather } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedForecast, setSelectedForecast] = useState(null);

  useEffect(() => {
    setSelectedForecast(null);
  }, [forecast?.city?.id]); // Reset when city ID changes

  if (!forecast) return null;

  // Process forecast data to get one forecast per day
  const dailyForecasts = forecast.list
    .filter((item, index) => index % 8 === 0)
    .slice(0, 5); // ] 5 days

  // Handle click on a forecast day
  const handleForecastClick = (forecastItem) => {
    setSelectedForecast(
      forecastItem === selectedForecast ? null : forecastItem
    );
  };

  return (
    <div className="relative overflow-hidden w-full rounded-lg shadow-md p-5 h-full animate-fade-in backdrop-blur-sm border border-gray-100 dark:border-gray-700/50">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/icefall.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/30 rounded-md">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-['Playfair_Display'] font-bold text-gray-800 dark:text-white tracking-tight">
            {t.five_day_forecast}
          </h3>
        </div>

        {weather && (
          <div className="text-sm font-['DM_Sans'] text-gray-600 dark:text-gray-400 animate-fade-in">
            {weather.name}, {weather.sys.country}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        {dailyForecasts.map((item, index) => {
          const date = new Date(item.dt * 1000);
          const day = date.toLocaleDateString("en-US", { weekday: "short" });
          const dateNum = date.getDate();
          const { icon, description } = item.weather[0];
          const temp = Math.round(item.main.temp);
          const isSelected = selectedForecast === item;

          return (
            <div
              key={item.dt}
              onClick={() => handleForecastClick(item)}
              className={`${
                isSelected
                  ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/30 border-blue-400 dark:border-blue-500 shadow-md"
                  : "bg-white/70 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:shadow-sm"
              } p-3 rounded-xl cursor-pointer border transition-all duration-300 text-center animate-fade-in transform hover:-translate-y-1 group`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center">
                <p className="text-xs font-medium font-['Inter'] text-gray-500 dark:text-gray-400 mb-1">
                  {day}
                </p>
                <p className="text-[10px] font-['Inter'] text-gray-400 dark:text-gray-500 -mt-1">
                  {dateNum}
                </p>

                <div className="relative w-12 h-12 mx-auto my-1 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                    alt={description}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/20 rounded-full animate-pulse-slow"></div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  <p className="text-lg font-bold font-['DM_Sans'] text-gray-900 dark:text-white">
                    {temp}
                  </p>
                  <span className="text-xs font-light text-gray-600 dark:text-gray-300">
                    °C
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-['DM_Sans']">
                  {description}
                </p>

                {isSelected && (
                  <div className="mt-1.5 flex items-center justify-center text-blue-500 dark:text-blue-400 text-xs font-['Inter'] font-medium animate-pulse-slow">
                    <span>{t.details}</span>
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedForecast && (
        <div className="mt-4 animate-slide-up overflow-hidden">
          <Details
            forecastItem={selectedForecast}
            onClose={() => setSelectedForecast(null)}
          />
        </div>
      )}
      {!selectedForecast && (
        <div className="border border-dashed border-gray-200 dark:border-gray-700/50 rounded-lg p-4 text-center mt-4 animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-['Inter'] italic">
            {t.select_day}
          </p>
        </div>
      )}
    </div>
  );
};

export default Forecast;
