import React, { memo } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import {
  Eye,
  Gauge,
  Thermometer,
  Cloud,
  Navigation,
  Droplets,
} from "lucide-react";

// Wind direction label from degrees
const getWindDirection = (deg) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
};

// ── Wind Compass ────────────────────────────────────────────────────────────
const WindCompass = ({ deg, speed }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          {/* Cardinal labels */}
          <text x="32" y="8" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter">N</text>
          <text x="58" y="35" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter">E</text>
          <text x="32" y="60" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter">S</text>
          <text x="6" y="35" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter">W</text>
          {/* Compass needle — rotated by wind degree */}
          <g transform={`rotate(${deg}, 32, 32)`}>
            {/* North tip (blue — wind FROM direction) */}
            <polygon points="32,10 29,32 32,28 35,32" fill="#60a5fa" />
            {/* South tip (gray) */}
            <polygon points="32,54 29,32 32,36 35,32" fill="rgba(255,255,255,0.3)" />
          </g>
          {/* Center dot */}
          <circle cx="32" cy="32" r="3" fill="#93c5fd" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm">{speed} m/s</p>
        <p className="text-white/50 text-xs">{getWindDirection(deg)}</p>
      </div>
    </div>
  );
};

// ── Rain Probability mini bars ──────────────────────────────────────────────
const RainProb = ({ forecast }) => {
  if (!forecast?.list) return null;
  // Get next 8 entries (24 hours) from forecast (3-hour steps)
  const slots = forecast.list.slice(0, 8);

  return (
    <div className="flex flex-col gap-1 w-full">
      <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">{translations[useLanguage().language].next_24h_precip}</p>
      <div className="flex items-end gap-1 h-10">
        {slots.map((item, i) => {
          const pop = item.pop ?? 0; // 0–1
          const pct = Math.round(pop * 100);
          const barH = Math.max(pct * 0.36, 2); // max ~36px
          const color = pct > 70 ? "bg-indigo-400" : pct > 40 ? "bg-sky-400" : "bg-blue-300/60";
          const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: "2-digit", hour12: false });
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1 group" title={`${time}: ${pct}%`}>
              <span className="text-[9px] text-white/40 group-hover:text-white/70 transition-colors hidden sm:block">
                {pct}%
              </span>
              <div className="w-full flex items-end justify-center">
                <div
                  className={`w-full rounded-t-sm transition-all duration-700 ${color}`}
                  style={{ height: `${barH}px` }}
                />
              </div>
              <span className="text-[8px] text-white/30">{time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Stat pill ───────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, accent }) => (
  <div
    className="flex items-center gap-3 bg-white/[0.07] hover:bg-white/[0.12] 
      rounded-xl p-3 transition-all duration-300 border border-white/10"
  >
    <div className={`p-2 rounded-lg ${accent}`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <p className="text-white/50 text-[10px] uppercase tracking-widest">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
const WeatherStats = memo(() => {
  const { weather, forecast } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];
  if (!weather) return null;

  const { main, visibility, wind, clouds } = weather;
  const visKm = visibility ? (visibility / 1000).toFixed(1) : "—";
  const feelsDiff = (main.feels_like - main.temp).toFixed(1);
  const feelsLabel =
    parseFloat(feelsDiff) > 0
      ? `${Math.abs(feelsDiff)}°C ${t.warmer}`
      : `${Math.abs(feelsDiff)}°C ${t.cooler}`;

  const stats = [
    {
      icon: Thermometer,
      label: t.feels_like,
      value: `${Math.round(main.feels_like)}°C (${feelsLabel})`,
      accent: "bg-blue-500/40",
    },
    {
      icon: Eye,
      label: t.visibility,
      value: `${visKm} km`,
      accent: "bg-indigo-500/40",
    },
    {
      icon: Gauge,
      label: t.pressure,
      value: `${main.pressure} hPa`,
      accent: "bg-violet-500/40",
    },
    {
      icon: Cloud,
      label: t.cloud_cover,
      value: `${clouds?.all ?? 0}%`,
      accent: "bg-sky-500/40",
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-xl border border-white/[0.12]
        bg-white/[0.08] backdrop-blur-md animate-fade-in"
      style={{ animationDelay: "0.3s" }}
    >
      {/* Glow accents */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-blue-400 to-indigo-600" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-cyan-400 to-blue-600" />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/30">
            <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-base font-['Inter'] tracking-wide">
            {t.weather_details}
          </h3>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: stat pills grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {stats.map((s) => (
              <StatPill key={s.label} {...s} />
            ))}
          </div>

          {/* Right column: compass + rain chart */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-6 lg:gap-4 lg:w-56 items-center">
            {/* Wind compass */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">{t.wind_direction}</p>
              <WindCompass deg={wind?.deg ?? 0} speed={wind?.speed ?? 0} />
            </div>

            {/* Rain probability bars */}
            {forecast && (
              <div className="flex-1 w-full min-w-[160px]">
                <RainProb forecast={forecast} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WeatherStats;
