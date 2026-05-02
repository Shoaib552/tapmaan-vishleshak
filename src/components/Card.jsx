import React, { useState, memo } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import Loading from "./Loading";
import Error from "./Error";
import Day from "./Day";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Droplets,
  Wind,
  MapPin,
  Loader,
} from "lucide-react";
import Recommendations from "./Recommendations";

const Card = memo(() => {
  const { weather, loading, error, getWeather } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const getCurrentLocationWeather = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
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
          setLocationLoading(false);
        } catch (err) {
          setLocationError("Error fetching location data");
          setLocationLoading(false);
          setTimeout(() => setLocationError(null), 5000);
        }
      },
      (err) => {
        setLocationError("Location access denied");
        setLocationLoading(false);
        setTimeout(() => setLocationError(null), 5000);
      }
    );
  };

  if (loading || locationLoading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!weather) return null;

  const {
    name,
    main: { temp, humidity },
    weather: [{ description, icon }],
    wind: { speed },
    sys: { country, sunrise, sunset },
    timezone,
  } = weather;

  const formatTimeWithTimezone = (timestamp) => {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const sunriseTime = formatTimeWithTimezone(sunrise);
  const sunsetTime = formatTimeWithTimezone(sunset);

  // Check if it's day or night
  const now = Math.floor(Date.now() / 1000);
  const isDay = now > sunrise && now < sunset;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Weather condition checks for special effects
  const isRainy = description.toLowerCase().includes("rain");
  const isSnowy = description.toLowerCase().includes("snow");
  const isThunderstorm = description.toLowerCase().includes("thunderstorm");
  const isHot = temp > 30;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500 hover-lift card-3d spotlight">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/waterdrop.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
      {isRainy && (
        <div className="rain-animation absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${0.8 + Math.random()}s`,
              }}
            ></span>
          ))}
        </div>
      )}

      {isSnowy && (
        <div className="snow-animation absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <span
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                top: `-${Math.random() * 10}px`,
              }}
            ></span>
          ))}
        </div>
      )}

      {isThunderstorm && (
        <div
          className="lightning-flash"
          style={{ "--delay": Math.random() * 5 }}
        ></div>
      )}

      {isHot && (
        <div className="heat-wave absolute inset-0 pointer-events-none"></div>
      )}

      {locationError && (
        <div
          className="absolute top-2 right-2 left-2 z-50 bg-red-50 dark:bg-red-900/70 
          text-red-600 dark:text-red-200 p-2 rounded-md text-xs font-medium animate-fade-in"
        >
          {locationError}
        </div>
      )}

      <div className="relative z-10 p-6 border-b border-gray-200/70 dark:border-gray-700/70">
        <div className="flex justify-between items-center">
          <div
            className="animate-fade-in"
            style={{ animationDuration: "0.8s" }}
          >
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
              {name},{" "}
              <span className="text-gray-600 dark:text-gray-300">
                {country}
              </span>
            </h2>
            <p className="text-sm font-['DM_Sans'] text-gray-500 dark:text-gray-400 mt-1">
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={getCurrentLocationWeather}
              disabled={locationLoading}
              className="p-2.5 bg-white/40 dark:bg-gray-800/40 rounded-lg shadow-sm hover:bg-white/70 
                dark:hover:bg-gray-700/70 transition-all transform hover:scale-110
                text-blue-600 dark:text-blue-400 flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 magnetic-glow"
              aria-label="Use current location"
              title="Use current location"
            >
              {locationLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start mt-6 justify-between">
          <div
            className="animate-fade-in"
            style={{ animationDuration: "1.2s" }}
          >
            <div className="flex items-end">
              <div className="text-6xl font-bold text-gray-900 dark:text-white font-['Inter'] tracking-tighter">
                {Math.round(temp)}
              </div>
              <div className="text-2xl font-light text-gray-700 dark:text-gray-300 mb-2 ml-1">
                °C
              </div>
            </div>
            <p className="mt-1 text-lg capitalize text-gray-600 dark:text-gray-300 font-medium font-['DM_Sans']">
              {description}
            </p>
          </div>

          <div
            className="transform hover:scale-110 transition-transform duration-300 animate-bounce-soft parallax-weather-2"
            style={{ animationDuration: "3s" }}
          >
            <img
              src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
              alt={description}
              className="w-24 h-24 drop-shadow-md"
            />
          </div>
        </div>

        <div className="mt-4">
          <Day timezone={timezone} sunrise={sunrise} sunset={sunset} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div
          className="bg-white/40 dark:bg-gray-700/40 p-3 rounded-xl shadow-sm hover:bg-white/60 
          dark:hover:bg-gray-700/60 transition-all group animate-fade-in spotlight"
          style={{ animationDuration: "1s", animationDelay: "0.3s" }}
        >
          <div className="flex items-center">
            <div
              className="p-2 bg-blue-100/80 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 
              dark:group-hover:bg-blue-800/50 transition-colors"
            >
              <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-['DM_Sans']">
                {t.humidity}
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {humidity}%
              </p>
            </div>
          </div>
        </div>

        {/* Wind speed */}
        <div
          className="bg-white/40 dark:bg-gray-700/40 p-3 rounded-xl shadow-sm hover:bg-white/60 
          dark:hover:bg-gray-700/60 transition-all group animate-fade-in spotlight"
          style={{ animationDuration: "1s", animationDelay: "0.4s" }}
        >
          <div className="flex items-center">
            <div
              className="p-2 bg-teal-100/80 dark:bg-teal-900/30 rounded-lg group-hover:bg-teal-200 
              dark:group-hover:bg-teal-800/50 transition-colors"
            >
              <Wind className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-['DM_Sans']">
                {t.wind_speed}
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {speed} m/s
              </p>
            </div>
          </div>
        </div>

        {/* Sunrise */}
        <div
          className="bg-white/40 dark:bg-gray-700/40 p-3 rounded-xl shadow-sm hover:bg-white/60 
          dark:hover:bg-gray-700/60 transition-all group animate-fade-in spotlight"
          style={{ animationDuration: "1s", animationDelay: "0.5s" }}
        >
          <div className="flex items-center">
            <div
              className="p-2 bg-yellow-100/80 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 
              dark:group-hover:bg-yellow-800/50 transition-colors"
            >
              <Sunrise className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-['DM_Sans']">
                {t.sunrise}
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {sunriseTime}
              </p>
            </div>
          </div>
        </div>

        {/* Sunset */}
        <div
          className="bg-white/40 dark:bg-gray-700/40 p-3 rounded-xl shadow-sm hover:bg-white/60 
          dark:hover:bg-gray-700/60 transition-all group animate-fade-in spotlight"
          style={{ animationDuration: "1s", animationDelay: "0.6s" }}
        >
          <div className="flex items-center">
            <div
              className="p-2 bg-orange-100/80 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 
              dark:group-hover:bg-orange-800/50 transition-colors"
            >
              <Sunset className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-['DM_Sans']">
                {t.sunset}
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {sunsetTime}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 pt-0">
        <Recommendations />
      </div>
    </div>
  );
});

export default Card;
