import React, { useEffect } from "react";
import { WeatherProvider } from "./context/Wethercotext";
import Search from "./components/Search";
import Card from "./components/Card";
import SearchHistory from "./components/SearchHistory";
import Forecast from "./components/Forecast";
import Theme from "./components/Theme";
import Loading from "./components/Loading";
import Error from "./components/Error";
import AirQuality from "./components/AirQuality";
import { useWeatherContext } from "./context/Wethercotext";
import "./App.css";

function App() {
  useEffect(() => {
    const fontLinks = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap",
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
    ];

    const linkElements = fontLinks.map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      return link;
    });

    linkElements.forEach((link) => document.head.appendChild(link));

    return () => {
      linkElements.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);

  return (
    <WeatherProvider>
      <div className="relative min-h-screen overflow-hidden font-['Inter']">
        {/* 🎥 Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover -z-10"
          src="/assets/videos/waterdrop.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Overlay (optional for readability, already matches your design) */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        <div className="relative flex flex-col items-center py-12 px-4 min-h-screen">
          <div className="w-full max-w-6xl z-10 backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center gap-12 mb-10 p-4 bg-white/[0.12] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in">
              <h1
                className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-md
  hover:scale-105 transition-transform tracking-tight leading-none
  font-['Noto_Sans_Devanagari']"
              >
                तापमान विश्लेषक
                <span className="font-light opacity-90"></span>
              </h1>

              <div className="animate-bounce-subtle">
                <Theme />
              </div>
            </div>

            {/* Search */}
            <div className="mb-8 transform hover:-translate-y-1 transition-transform">
              <div className="p-4 bg-white/[0.10] rounded-xl backdrop-blur-md shadow-md border border-white/[0.15] animate-slide-up">
                <Search />
                <div className="mt-2 animate-fade-in">
                  <SearchHistory />
                </div>
              </div>
            </div>

            <DynamicContent />
          </div>
        </div>
      </div>
    </WeatherProvider>
  );
}

const DynamicContent = () => {
  const { weather, forecast, airQuality, loading, error } = useWeatherContext();

  if (loading) {
    return (
      <div className="p-6 bg-white/[0.10] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white/[0.10] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in">
        <Error message={error} onDismiss={() => { }} />
      </div>
    );
  }

  if (!weather || !forecast) {
    return (
      <div className="p-8 bg-white/[0.10] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in text-center">
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-white mb-4">
          Welcome to Weather Dashboard
        </h2>
        <p className="text-gray-300 font-['DM_Sans'] max-w-lg mx-auto">
          Search for a city above to see current weather conditions and the
          5-day forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: Weather Card + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card />
        </div>
        <div className="lg:col-span-7">
          <Forecast key={forecast.city.id} />
        </div>
      </div>

      {/* Bottom row: AQI — full width */}
      {airQuality && (
        <div className="w-full">
          <AirQuality />
        </div>
      )}
    </div>
  );
};

export default App;
