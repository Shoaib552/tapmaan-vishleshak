import React from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50">
        <p className="text-gray-600 dark:text-gray-300 text-xs mb-1 font-['Inter']">{label}</p>
        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-['DM_Sans']">
          {payload[0].value}°C
        </p>
        <p className="text-xs text-gray-500 capitalize">{payload[0].payload.description}</p>
      </div>
    );
  }
  return null;
};

const HourlyChart = () => {
  const { forecast } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];

  if (!forecast || !forecast.list) return null;

  // Get the next 24 hours (8 items, since each is 3 hours)
  const hourlyData = forecast.list.slice(0, 8).map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      temp: Math.round(item.main.temp),
      description: item.weather[0].description,
    };
  });

  return (
    <div className="w-full bg-white/[0.08] backdrop-blur-md rounded-2xl shadow-xl border border-white/[0.15] p-5 animate-fade-in mt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/30 rounded-md">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white font-['Inter'] tracking-wide">
          {t.hourly_trend}
        </h3>
      </div>

      <div className="w-full h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontFamily: "Inter" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontFamily: "Inter" }}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#tempGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyChart;
