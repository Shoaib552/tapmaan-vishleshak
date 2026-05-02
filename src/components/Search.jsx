import React, { useState } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { Search as SearchIcon, MapPin, Loader } from "lucide-react";

const Search = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { getWeather, loading } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      getWeather(query.trim());
    }
  };

  // Get location weather function
  const handleGetLocationWeather = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${
              import.meta.env.VITE_OPENWEATHER_API_KEY
            }`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch weather data");
          }

          const data = await response.json();
          getWeather(data.name);

          // Set query to the city name for user feedback
          setQuery(data.name);

          setLocationLoading(false);
        } catch (err) {
          setLocationError(err.message);
          setLocationLoading(false);

          // Auto-hide error after 5 seconds
          setTimeout(() => setLocationError(null), 5000);
        }
      },
      (err) => {
        setLocationError("Location access denied");
        setLocationLoading(false);

        // Auto-hide error after 5 seconds
        setTimeout(() => setLocationError(null), 5000);
      }
    );
  };

  const isSearchDisabled = loading || locationLoading || !query.trim();

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className={`w-full transform transition-all duration-300 ${
          focused ? "scale-[1.01]" : ""
        }`}
      >
        <div
          className={`relative flex rounded-lg shadow-sm ${
            focused
              ? "shadow-md ring-2 ring-blue-400/30 dark:ring-blue-500/30"
              : ""
          } 
          transition-all duration-300 bg-white dark:bg-gray-800 animate-fade-in`}
        >
          {/* Search icon or loader */}
          <div
            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
              focused
                ? "text-blue-500 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            } 
            transition-colors duration-300`}
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <SearchIcon
                className={`h-5 w-5 transform transition-transform ${
                  focused ? "rotate-12" : ""
                }`}
              />
            )}
          </div>

          {/* Search input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder={t.search_placeholder}
            className="w-full px-4 py-3 pl-10 rounded-l-lg
    bg-white/[0.12]
    backdrop-blur-md
    border border-white/[0.15]
    font-['DM_Sans']
    text-white
    placeholder-white/70
    focus:outline-none
    focus:border-white/[0.25]
    transition-all duration-300"
            disabled={loading || locationLoading}
            aria-label="City search"
          />

          {/* Location button */}
          <button
            type="button"
            onClick={handleGetLocationWeather}
            disabled={loading || locationLoading}
            className={`px-4 py-3 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center
              ${
                locationLoading
                  ? "text-blue-400 dark:text-blue-500 animate-pulse"
                  : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              } 
              transition-all duration-300 bg-transparent`}
            aria-label="Use current location"
            title="Use current location"
          >
            {locationLoading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </button>

          {/* Search button */}
          <button
            type="submit"
            disabled={isSearchDisabled}
            className={`px-5 py-3 font-['Playfair_Display'] font-medium text-white 
              rounded-r-lg transition-all duration-300
              ${
                isSearchDisabled
                  ? "bg-blue-400/70 dark:bg-blue-600/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-700 hover:shadow-md hover:-translate-y-0.5"
              }`}
            aria-label="Search for city"
          >
            <span className="relative">
              {loading ? (language === 'hi' ? "खोज रहे हैं" : "Searching") : (language === 'hi' ? "खोजें" : "Search")}
              {loading && (
                <span className="absolute -right-5 top-0 flex space-x-1">
                  <span
                    className="h-1 w-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="h-1 w-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="h-1 w-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-white mt-2 ml-2 font-['Inter'] italic animate-fade-in opacity-60 hover:opacity-100 transition-opacity">
          Enter a city name to get the latest weather forecast or use your
          current location
        </p>
      </form>

      {/* Location error message */}
      {locationError && (
        <div
          className="absolute left-0 top-full mt-2 z-50 p-3 bg-red-50 dark:bg-red-900/70 
          rounded-md shadow-lg border border-red-100 dark:border-red-800/50 
          w-full animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
              <MapPin className="h-3 w-3 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-xs text-red-600 dark:text-red-200 font-['Inter']">
              {locationError} - please try searching manually
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
