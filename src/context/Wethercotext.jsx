import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { addToHistoryHelper } from './weatherHelpers';

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const { language } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  const toggleDarkMode = () => setDarkMode(!darkMode);
  
  const addToHistory = (city) => {
    setSearchHistory(prev => addToHistoryHelper(prev, city));
  };
  
  const removeFromHistory = (city) => {
    setSearchHistory(prev => prev.filter(c => c !== city));
  };

  const getWeather = async (city) => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=${language}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`);
      
      if (!weatherRes.ok) {
        throw new Error('City not found or weather data unavailable');
      }
      
      const weatherData = await weatherRes.json();
      setWeather(weatherData);
      addToHistory(city);
      
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=${language}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`);
      
      if (!forecastRes.ok) {
        throw new Error('Forecast data unavailable');
      }
      
      const forecastData = await forecastRes.json();
      setForecast(forecastData);
      
      if (weatherData.coord) {
        const { lat, lon } = weatherData.coord;
        const airQualityRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`);
        
        if (airQualityRes.ok) {
          const airQualityData = await airQualityRes.json();
          setAirQuality(airQualityData);
        }
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <WeatherContext.Provider value={{
      weather,
      forecast,
      airQuality,
      loading,
      error,
      darkMode,
      toggleDarkMode,
      getWeather,
      searchHistory,
      removeFromHistory
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeatherContext = () => useContext(WeatherContext);
