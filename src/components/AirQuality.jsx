import React, { memo } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { Wind, AlertTriangle, CheckCircle, Info, XCircle, AlertCircle } from "lucide-react";

// AQI level config: OpenWeatherMap returns 1-5
// Colors follow the project's blue/teal/indigo/purple palette — no yellow/orange
const AQI_CONFIG = [
  {
    level: 1,
    label: "Good",
    color: "from-emerald-400 to-teal-500",
    bgLight: "bg-teal-100/80",
    bgDark: "dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-400/40",
    glow: "shadow-teal-500/30",
    ring: "#14b8a6",
    health: "Air quality is excellent. Enjoy outdoor activities freely!",
    Icon: CheckCircle,
  },
  {
    level: 2,
    label: "Fair",
    color: "from-cyan-400 to-sky-500",
    bgLight: "bg-cyan-100/80",
    bgDark: "dark:bg-cyan-900/30",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-400/40",
    glow: "shadow-cyan-500/30",
    ring: "#06b6d4",
    health: "Air quality is acceptable. Unusually sensitive individuals may experience minor effects.",
    Icon: Info,
  },
  {
    level: 3,
    label: "Moderate",
    color: "from-blue-400 to-indigo-500",
    bgLight: "bg-blue-100/80",
    bgDark: "dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-400/40",
    glow: "shadow-blue-500/30",
    ring: "#3b82f6",
    health: "Members of sensitive groups may experience health effects. General public is less likely to be affected.",
    Icon: AlertCircle,
  },
  {
    level: 4,
    label: "Poor",
    color: "from-indigo-500 to-violet-600",
    bgLight: "bg-indigo-100/80",
    bgDark: "dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-400/40",
    glow: "shadow-indigo-500/30",
    ring: "#6366f1",
    health: "Health warnings for sensitive groups. Everyone may begin to experience health effects.",
    Icon: AlertTriangle,
  },
  {
    level: 5,
    label: "Very Poor",
    color: "from-violet-600 to-purple-700",
    bgLight: "bg-violet-100/80",
    bgDark: "dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/40",
    glow: "shadow-violet-500/30",
    ring: "#7c3aed",
    health: "Health alert! Everyone may experience serious health effects. Avoid prolonged outdoor exertion.",
    Icon: XCircle,
  },
];

// Pollutant display config
const POLLUTANTS = [
  { 
    key: "pm2_5", 
    label: "PM2.5", 
    unit: "µg/m³", 
    safeLimit: 25, 
    color: "#8b5cf6", 
    desc: {
      en: "Fine particles that can enter the bloodstream.",
      hi: "महीन कण जो रक्तप्रवाह में प्रवेश कर सकते हैं।"
    }
  },
  { 
    key: "pm10", 
    label: "PM10", 
    unit: "µg/m³", 
    safeLimit: 50, 
    color: "#3b82f6", 
    desc: {
      en: "Coarse dust particles that irritate airways.",
      hi: "धूल के मोटे कण जो वायुमार्ग में जलन पैदा करते हैं।"
    }
  },
  { 
    key: "no2", 
    label: "NO₂", 
    unit: "µg/m³", 
    safeLimit: 40, 
    color: "#06b6d4", 
    desc: {
      en: "Traffic exhaust gas that exacerbates asthma.",
      hi: "ट्रैफिक निकास गैस जो अस्थमा को बढ़ाती है।"
    }
  },
  { 
    key: "o3", 
    label: "O₃", 
    unit: "µg/m³", 
    safeLimit: 100, 
    color: "#10b981", 
    desc: {
      en: "Ground-level ozone causing respiratory issues.",
      hi: "ज़मीनी स्तर का ओज़ोन जो सांस की समस्या पैदा करता है।"
    }
  },
  { 
    key: "co", 
    label: "CO", 
    unit: "µg/m³", 
    safeLimit: 10000, 
    color: "#f59e0b", 
    desc: {
      en: "Gas that reduces oxygen delivery in the body.",
      hi: "गैस जो शरीर में ऑक्सीजन की आपूर्ति कम करती है।"
    }
  },
  { 
    key: "so2", 
    label: "SO₂", 
    unit: "µg/m³", 
    safeLimit: 20, 
    color: "#ef4444", 
    desc: {
      en: "Gas from fossil fuels that irritates the lungs.",
      hi: "जीवाश्म ईंधन से निकलने वाली गैस जो फेफड़ों को परेशान करती है।"
    }
  },
];

// US EPA AQI calculation for PM2.5 and PM10
const calculateAQI = (c, breakpoints) => {
  for (let i = 0; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (c >= bp.cLow && c <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow);
    }
  }
  const last = breakpoints[breakpoints.length - 1];
  if (c > last.cHigh) {
    return Math.round(((last.iHigh - last.iLow) / (last.cHigh - last.cLow)) * (c - last.cLow) + last.iLow);
  }
  return 0;
};

const getUSAQI = (pm25, pm10) => {
  const pm25BPs = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];
  const pm10BPs = [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
  ];
  const aqi25 = calculateAQI(pm25, pm25BPs);
  const aqi10 = calculateAQI(pm10, pm10BPs);
  return Math.max(aqi25, aqi10);
};

// Mini circular SVG gauge
const AQIGauge = ({ aqi, ringColor, usAqi }) => {
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Map AQI 1–5 to 0–100%
  const pct = ((aqi - 1) / 4) * 100;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      {/* AQI number in center */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white leading-none">{usAqi !== undefined ? usAqi : aqi}</span>
        <span className="text-xs text-white/70 mt-0.5">{translations[useLanguage().language].aqi}</span>
      </div>
    </div>
  );
};

// Single pollutant row
const PollutantRow = ({ label, value, unit, safeLimit, color, desc }) => {
  const pct = Math.min((value / safeLimit) * 100, 100);
  const barStyle = pct > 80 ? "bg-indigo-400" : pct > 50 ? "bg-sky-400" : "bg-teal-400";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-white/90">{label}</span>
        <span className="text-white/60">
          {value !== undefined ? value.toFixed(1) : "—"} {unit}
        </span>
      </div>
      <p className="text-[10px] text-white/50 leading-tight -mt-0.5 mb-0.5 font-['DM_Sans']">
        {desc[useLanguage().language]}
      </p>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barStyle}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const AirQuality = memo(() => {
  const { airQuality } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];

  if (!airQuality || !airQuality.list || airQuality.list.length === 0) return null;

  const aqiData = airQuality.list[0];
  const aqiIndex = aqiData.main.aqi; // 1–5
  const components = aqiData.components;
  const usAqi = getUSAQI(components.pm2_5 || 0, components.pm10 || 0);
  const config = { ...AQI_CONFIG[aqiIndex - 1] };
  
  // Translate dynamic content
  const aqiKeys = ["good", "fair", "moderate", "poor", "very_poor"];
  const currentKey = aqiKeys[aqiIndex - 1];
  config.label = t[`aqi_${currentKey}`];
  config.health = t[`aqi_health_${currentKey}`];
  
  const { Icon } = config;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl border ${config.border} ${config.glow} 
        bg-white/[0.08] backdrop-blur-md animate-fade-in transition-all duration-500`}
      style={{ animationDuration: "0.9s", animationDelay: "0.2s" }}
    >
      {/* Gradient glow blob */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${config.color}`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${config.color}`}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className={`p-1.5 rounded-lg ${config.bgLight} ${config.bgDark}`}>
            <Wind className={`h-4 w-4 ${config.text}`} />
          </div>
          <h3 className="text-white font-bold text-base font-['Inter'] tracking-wide">
            {t.air_quality}
          </h3>
          <span
            className={`ml-auto px-3 py-1 rounded-full text-xs font-bold text-white
              bg-gradient-to-r ${config.color} shadow-md`}
          >
            {config.label}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Left: Gauge */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <AQIGauge aqi={aqiIndex} ringColor={config.ring} usAqi={usAqi} />

            {/* Health tip */}
            <div
              className={`flex items-start gap-2 rounded-xl p-3 ${config.bgLight} ${config.bgDark} 
                border ${config.border} max-w-[200px] sm:max-w-[220px]`}
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`} />
              <p className={`text-xs leading-relaxed ${config.text} font-['DM_Sans']`}>
                {config.health}
              </p>
            </div>
          </div>

          {/* Right: Pollutant breakdown */}
          <div className="flex-1 w-full grid grid-cols-1 gap-2">
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">
              {t.pollutant_breakdown}
            </p>
            {POLLUTANTS.map(({ key, label, unit, safeLimit, color, desc }) => (
              <PollutantRow
                key={key}
                label={label}
                value={components[key]}
                unit={unit}
                safeLimit={safeLimit}
                color={color}
                desc={desc}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AirQuality;
