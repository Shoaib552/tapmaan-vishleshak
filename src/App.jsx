import React, { useEffect, useState } from "react";
import { WeatherProvider } from "./context/Wethercotext";
import Search from "./components/Search";
import Card from "./components/Card";
import SearchHistory from "./components/SearchHistory";
import Forecast from "./components/Forecast";
import Theme from "./components/Theme";
import Loading from "./components/Loading";
import Error from "./components/Error";
import AirQuality from "./components/AirQuality";
import WeatherStats from "./components/WeatherStats";
import { useWeatherContext } from "./context/Wethercotext";
import "./App.css";

function App() {
  const [audio, setAudio] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fontLinks = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap",
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap",
    ];

    const linkElements = fontLinks.map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      return link;
    });

    linkElements.forEach((link) => document.head.appendChild(link));

    const newAudio = new Audio("/sounds/tapmaan.mp3");
    newAudio.play().catch((err) => {
      console.log("Audio playback failed:", err);
    });
    setAudio(newAudio);

    return () => {
      linkElements.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
      if (newAudio) {
        newAudio.pause();
        newAudio.currentTime = 0;
      }
    };
  }, []);

  const toggleMute = () => {
    if (!audio) return;
    if (isMuted) {
      audio.play();
    } else {
      audio.pause();
    }
    setIsMuted(!isMuted);
  };

  return (
    <WeatherProvider>
      <div className="relative min-h-screen overflow-hidden font-['Inter']">
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/videos/waterdrop.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

        <div className="relative flex flex-col items-center py-12 px-4 min-h-screen z-10">
          <div className="w-full max-w-6xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center gap-12 mb-10 p-4 bg-white/[0.12] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in">
              <h1
                className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-md
                hover:scale-105 transition-transform tracking-tight leading-none
                font-['Noto_Sans_Devanagari']"
              >
                तापमान विश्लेषक
              </h1>
              <Theme />
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

        {/* Simple Audio Button Top-Right */}
        <button
          onClick={toggleMute}
          className="fixed top-4 right-4 z-50 text-white text-2xl"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        {/* Stylish Horizontal Footer */}
        <footer className="relative z-10 mt-20 mb-4">
          <div
            className="
      mx-auto max-w-4xl
      flex flex-col sm:flex-row items-center justify-between
      gap-4 px-6 py-4
      bg-white/[0.12] backdrop-blur-md
      border border-white/[0.15]
      rounded-2xl shadow-lg
      text-white/90
    "
          >
            {/* Left: Made with Love */}
            <p className="text-sm tracking-wide">
              Made with <span className="text-red-400">❤️</span> by{" "}
              <span className="font-semibold">Shoaib</span>
            </p>

            {/* Right: Social Links */}
            <div className="flex items-center gap-6 text-sm">
              <a
                href="https://github.com/Shoaib552"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all hover:scale-105"
              >
                GitHub
              </a>

              <span className="text-white/40">|</span>

              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all hover:scale-105"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
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

      {/* Weather Details panel */}
      <div className="w-full">
        <WeatherStats />
      </div>
    </div>
  );
};

export default App;
