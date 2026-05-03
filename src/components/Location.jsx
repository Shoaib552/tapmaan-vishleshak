import React from 'react';
import { MapPin, Loader, AlertTriangle } from 'lucide-react';
import { useWeatherContext } from '../context/Wethercotext';

const Loctaion = () => {
  const { getWeatherByLocation, locationLoading: isLoading, locationError: error } = useWeatherContext();

  return (
    <div className="relative">
      <button
        onClick={getWeatherByLocation}
        disabled={isLoading}
        className={`px-3 py-3 rounded-r-lg flex items-center justify-center transition-all duration-300
          ${isLoading ? 
            'bg-gray-200 dark:bg-gray-700 cursor-wait' : 
            'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-700 hover:shadow-md hover:-translate-y-0.5'
          }
          text-white font-['DM_Sans'] font-medium`}
        title="Use current location"
        aria-label="Get weather for your current location"
      >
        {isLoading ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <MapPin className="h-5 w-5" />
        )}
      </button>
      
      {error && (
        <div className="absolute right-0 top-full mt-2 z-50 p-3 bg-red-50 dark:bg-red-900/70 
          rounded-md shadow-lg border border-red-100 dark:border-red-800/50 
          w-52 animate-fade-in transform origin-top-right">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-200 font-['Inter']">
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loctaion;