import React, { useEffect, useState } from "react";
import { WeatherProvider } from "./context/Wethercotext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { translations } from "./utils/translations";
import Search from "./components/Search";
import Card from "./components/Card";
import SearchHistory from "./components/SearchHistory";
import Forecast from "./components/Forecast";
import Theme from "./components/Theme";
import Loading from "./components/Loading";
import Error from "./components/Error";
import AirQuality from "./components/AirQuality";
import WeatherStats from "./components/WeatherStats";
import HourlyChart from "./components/HourlyChart";
import Map from "./components/Map";
import About from "./components/About";
import Alerts from "./components/Alerts";
import { useWeatherContext } from "./context/Wethercotext";
import { User } from "lucide-react";
import "./App.css";

const BACKGROUNDS = {
  Clear: "https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1920&auto=format&fit=crop",
  Clouds: "https://images.unsplash.com/photo-1536244636800-a3f74db0f3cf?q=80&w=1920&auto=format&fit=crop",
  Rain: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1920&auto=format&fit=crop",
  Snow: "https://images.unsplash.com/photo-1516820208784-270b250306e3?q=80&w=1920&auto=format&fit=crop",
  Thunderstorm: "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?q=80&w=1920&auto=format&fit=crop",
  Drizzle: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1920&auto=format&fit=crop",
  Mist: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Haze: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Smoke: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Dust: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Fog: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Sand: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Ash: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?q=80&w=1920&auto=format&fit=crop",
  Squall: "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?q=80&w=1920&auto=format&fit=crop",
  Tornado: "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?q=80&w=1920&auto=format&fit=crop",
  Default: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop"
};

const UNIQUE_BACKGROUNDS = Array.from(new Set(Object.values(BACKGROUNDS)));

const Background = () => {
  const { weather } = useWeatherContext();
  const condition = weather?.weather?.[0]?.main || "Default";
  const bgImage = BACKGROUNDS[condition] || BACKGROUNDS.Default;

  return (
    <>
      <div className="absolute inset-0 bg-gray-900 z-0"></div>
      {UNIQUE_BACKGROUNDS.map((url) => (
        <img
          key={url}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${
            bgImage === url ? "opacity-100" : "opacity-0"
          }`}
          src={url}
          alt="Weather background"
        />
      ))}
    </>
  );
};

function App() {
  // Removed audio states

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

    // Removed audio playback

    return () => {
      linkElements.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
      // Removed audio cleanup
    };
  }, []);

  // Removed toggleMute function

  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const toggleAbout = () => {
    setIsAboutOpen(!isAboutOpen);
  };

  return (
    <WeatherProvider>
      <div className="relative min-h-screen overflow-hidden font-['Inter']">
        {/* Dynamic Background Image */}
        <Background />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

        <div className="relative flex flex-col items-center py-12 px-4 min-h-screen z-10">
          <div className="w-full max-w-6xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center gap-4 sm:gap-12 mb-10 p-4 bg-white/[0.12] rounded-xl backdrop-blur-md shadow-lg border border-white/[0.15] animate-fade-in">
              <h1
                className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-md
                hover:scale-105 transition-transform tracking-tight leading-none
                font-['Noto_Sans_Devanagari']"
              >
                {t.title}
              </h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAbout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all border border-white/10 backdrop-blur-sm group"
                >
                  <User className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'डेवलपर' : 'About'}</span>
                </button>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all border border-white/10 backdrop-blur-sm"
                >
                  {language === 'en' ? 'हिन्दी' : 'English'}
                </button>
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

            <Alerts />
            <DynamicContent />
            
            {/* Modal Overlay */}
            <About isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
          </div>
        </div>

        {/* Audio Button Removed */}

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
              {t.made_with_love}{" "}
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
  const { language } = useLanguage();
  const t = translations[language];

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
          {t.welcome_message}
        </h2>
        <p className="text-gray-300 font-['DM_Sans'] max-w-lg mx-auto">
          {t.welcome_sub}
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

      {/* Hourly Chart */}
      <HourlyChart />

      {/* Interactive Map */}
      <Map />

      {/* Weather Details panel */}
      <div className="w-full">
        <WeatherStats />
      </div>
    </div>
  );
};

export default App;
