import React from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { AlertCircle, ShieldAlert, Thermometer, Wind, CloudLightning } from "lucide-react";

const Alerts = () => {
  const { weather, airQuality } = useWeatherContext();

  if (!weather) return null;

  const condition = weather?.weather?.[0]?.main;
  const temp = weather?.main?.temp;
  const cityName = weather?.name || "your location";
  const aqi = airQuality?.list?.[0]?.main?.aqi;

  // Build a list of active alerts based on current weather data
  const alerts = [];

  // Extreme heat (real threshold)
  if (temp > 37) {
    alerts.push({
      type: "Extreme Heat Alert",
      message: `Intense heat detected in ${cityName} (${temp?.toFixed(1)}°C). Stay hydrated and avoid going outdoors.`,
      severity: "danger",
      Icon: Thermometer,
    });
  }

  // Heatwave (moderately high)
  else if (temp > 32) {
    alerts.push({
      type: "Heatwave Warning",
      message: `High temperatures in ${cityName} (${temp?.toFixed(1)}°C). Limit outdoor exposure and stay hydrated.`,
      severity: "warning",
      Icon: Thermometer,
    });
  }

  // Freezing
  if (temp < 0) {
    alerts.push({
      type: "Freeze Warning",
      message: `Freezing temperatures in ${cityName} (${temp?.toFixed(1)}°C). Protect pipes, plants, and stay warm.`,
      severity: "info",
      Icon: AlertCircle,
    });
  }

  // Severe weather
  if (condition === "Thunderstorm") {
    alerts.push({
      type: "Severe Thunderstorm Warning",
      message: `Active thunderstorm detected in ${cityName}. Stay indoors and avoid electrical equipment.`,
      severity: "danger",
      Icon: CloudLightning,
    });
  }

  if (condition === "Tornado" || condition === "Squall") {
    alerts.push({
      type: "Extreme Weather Alert",
      message: `${condition} detected near ${cityName}. Take immediate cover!`,
      severity: "danger",
      Icon: Wind,
    });
  }

  // Poor air quality (AQI 4 = Poor, 5 = Very Poor)
  if (aqi >= 4) {
    alerts.push({
      type: "Air Quality Warning",
      message: `Dangerous air quality in ${cityName} (AQI Level ${aqi}/5). Wear a mask and stay indoors.`,
      severity: aqi === 5 ? "danger" : "warning",
      Icon: ShieldAlert,
    });
  }

  // OpenWeatherMap native alerts (if API returns any)
  if (weather?.alerts?.length > 0) {
    alerts.push({
      type: weather.alerts[0].event,
      message: weather.alerts[0].description,
      severity: "warning",
      Icon: AlertCircle,
    });
  }

  if (alerts.length === 0) return null;

  const bgColors = {
    info: "bg-blue-500/20 border-blue-500/50 text-blue-200",
    warning: "bg-amber-500/20 border-amber-500/50 text-amber-200",
    danger: "bg-red-500/20 border-red-500/50 text-red-200",
  };

  const iconBg = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className="flex flex-col gap-3 w-full mb-6">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`w-full p-4 rounded-xl border backdrop-blur-md animate-pulse flex items-center gap-4 ${bgColors[alert.severity]}`}
        >
          <div className={`p-2 rounded-full flex-shrink-0 ${iconBg[alert.severity]}`}>
            <alert.Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">
              Environmental Alert System
            </p>
            <p className="text-sm font-semibold">{alert.type}: {alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;
