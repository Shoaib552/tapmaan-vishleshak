import React, { useState, useEffect } from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { AlertCircle, X, ShieldAlert } from "lucide-react";
import axios from 'axios';

const Alerts = () => {
  const { weather } = useWeatherContext();
  const [backendAlerts, setBackendAlerts] = useState([]);
  
  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/alerts?limit=1');
        if (response.data && response.data.length > 0) {
          setBackendAlerts(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch backend alerts:", err);
      }
    };
    
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 300000);
    return () => clearInterval(interval);
  }, []);
  
  // Local weather-based alerts
  const condition = weather?.weather?.[0]?.main;
  const temp = weather?.main?.temp;
  
  let alertMessage = null;
  let severity = "info"; 
  let source = "Weather Alert";
  
  // Prefer backend alerts if available
  if (backendAlerts.length > 0) {
    const latest = backendAlerts[0];
    alertMessage = `${latest.type}: ${latest.message}`;
    severity = latest.severity === "critical" ? "danger" : "warning";
    source = "Environmental Alert System";
  } else {
    // Fallback to weather-based rules
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
    
    if (weather?.alerts && weather.alerts.length > 0) {
      alertMessage = weather.alerts[0].event + ": " + weather.alerts[0].description;
      severity = "warning";
    }
  }

  if (!alertMessage) return null;

  const bgColors = {
    info: "bg-blue-500/20 border-blue-500/50 text-blue-200",
    warning: "bg-amber-500/20 border-amber-500/50 text-amber-200",
    danger: "bg-red-500/20 border-red-500/50 text-red-200",
  };

  return (
    <div className={`w-full mb-6 p-4 rounded-xl border backdrop-blur-md animate-pulse flex items-center gap-4 ${bgColors[severity]}`}>
      <div className={`p-2 rounded-full ${severity === 'danger' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}>
        {source.includes("Environmental") ? <ShieldAlert className="h-5 w-5 text-white" /> : <AlertCircle className="h-5 w-5 text-white" />}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">{source}</p>
        <p className="text-sm font-semibold">{alertMessage}</p>
      </div>
    </div>
  );
};

export default Alerts;
