import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useWeatherContext } from '../context/Wethercotext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon } from 'lucide-react';

// Fix for default marker icon in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map view updates
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 10);
  }, [center, map]);
  return null;
};

const Map = () => {
  const { weather } = useWeatherContext();
  const { language } = useLanguage();
  const t = translations[language];
  const [activeLayer, setActiveLayer] = React.useState("temp_new"); // temp_new, precipitation_new, wind_new, clouds_new

  if (!weather || !weather.coord) return null;

  const { lat, lon } = weather.coord;
  const position = [lat, lon];

  return (
    <div className="w-full bg-white/[0.08] backdrop-blur-md rounded-2xl shadow-xl border border-white/[0.15] p-5 animate-fade-in mt-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/30 rounded-md">
          <MapIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white font-['Inter'] tracking-wide">
          {t.interactive_map}
        </h3>
        <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10 ml-auto">
          {["temp_new", "precipitation_new", "wind_new"].map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-all ${
                activeLayer === layer 
                ? "bg-blue-500 text-white shadow-lg" 
                : "text-white/40 hover:text-white/70"
              }`}
            >
              {layer.split('_')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden shadow-inner border border-white/10 relative z-0">
        <MapContainer
          center={position}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
        >
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Weather Overlay Layer */}
          <TileLayer
            url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`}
            opacity={0.6}
            zIndex={10}
          />
          <Marker position={position}>
            <Popup>
              <div className="font-['Inter'] p-1">
                <p className="font-bold text-gray-800">{weather.name}</p>
                <p className="text-xs text-gray-600">{Math.round(weather.main.temp)}°C | {weather.weather[0].description}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
