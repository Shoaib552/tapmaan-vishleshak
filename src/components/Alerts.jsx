import React from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { AlertCircle, X } from "lucide-react";

const Alerts = () => {
  const { weather } = useWeatherContext();
  
  // OpenWeatherMap 'alerts' field is only available in OneCall API or specific plans.
  // We can simulate an alert banner if there's a severe weather condition like Thunderstorm, Extreme heat, etc.
  const condition = weather?.weather?.[0]?.main;
  const description = weather?.weather?.[0]?.description;
  const temp = weather?.main?.temp;
  
  let alertMessage = null;
  let severity = "info"; // info, warning, danger
  
  if (condition === "Thunderstorm") {
    alertMessage = "Severe Thunderstorm Warning: Stay indoors and avoid using electrical equipment.";
    severity = "danger";
  } else if (condition === "Tornado" || condition === "Squall") {
    alertMessage = `Extreme Weather Alert: ${condition} detected. Take immediate cover!`;
    severity = "danger";
  } else if (temp > 40) {
    alertMessage = "Heatwave Warning: Extreme temperatures detected. Stay hydrated and avoid direct sunlight.";
    severity = "warning";
  } else if (temp < 0) {
    alertMessage = "Freeze Warning: Temperatures below freezing. Protect pipes and plants.";
    severity = "info";
  }
  
  // If actual API alerts exist, use them instead
  if (weather?.alerts && weather.alerts.length > 0) {
    alertMessage = weather.alerts[0].event + ": " + weather.alerts[0].description;
    severity = "warning";
  }

  if (!alertMessage) return null;

  const bgColors = {
    info: "bg-blue-500/20 border-blue-500/50 text-blue-200",
    warning: "bg-amber-500/20 border-amber-500/50 text-amber-200",
    danger: "bg-red-500/20 border-red-500/50 text-red-200",
  };

  return (
    <div className={`w-full mb-6 p-4 rounded-xl border backdrop-blur-md animate-bounce-soft flex items-center gap-4 ${bgColors[severity]}`}>
      <div className={`p-2 rounded-full ${severity === 'danger' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}>
        <AlertCircle className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-0.5">Weather Alert</p>
        <p className="text-sm font-medium">{alertMessage}</p>
      </div>
    </div>
  );
};

export default Alerts;
