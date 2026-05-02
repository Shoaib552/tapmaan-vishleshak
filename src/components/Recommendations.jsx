import React from "react";
import { useWeatherContext } from "../context/Wethercotext";
import { useLanguage } from "../context/LanguageContext";
import { Sparkles, Shirt, Footprints, Umbrella } from "lucide-react";

const Recommendations = () => {
  const { weather } = useWeatherContext();
  const { language } = useLanguage();
  
  if (!weather) return null;
  
  const temp = weather.main.temp;
  const condition = weather.weather[0].main;
  const isRainy = condition.includes("Rain") || condition.includes("Drizzle");
  
  const getRecommendations = () => {
    let recs = {
      clothing: "",
      activity: "",
      icon: Shirt
    };
    
    if (language === 'hi') {
      if (temp > 30) {
        recs.clothing = "हल्के सूती कपड़े पहनें। धूप का चश्मा और सनस्क्रीन न भूलें।";
        recs.activity = "दोपहर के समय बाहर जाने से बचें। खूब पानी पिएं।";
      } else if (temp > 20) {
        recs.clothing = "टी-शर्ट और आरामदायक ट्राउजर ठीक रहेंगे।";
        recs.activity = "बाहरी गतिविधियों जैसे पार्क में टहलने के लिए अच्छा समय है।";
      } else if (temp > 10) {
        recs.clothing = "एक हल्की जैकेट या स्वेटर साथ रखें।";
        recs.activity = "बाहरी खेलों के लिए सुखद मौसम।";
      } else {
        recs.clothing = "भारी ऊनी कपड़े, टोपी और दस्ताने पहनें।";
        recs.activity = "घर के अंदर रहें और गर्म पेय का आनंद लें।";
      }
      
      if (isRainy) {
        recs.clothing = "वॉटरप्रूफ जैकेट पहनें और छतरी साथ रखें।";
        recs.activity = "बाहरी योजनाओं से बचें, घर के अंदर की गतिविधियों को चुनें।";
        recs.icon = Umbrella;
      }
    } else {
      if (temp > 30) {
        recs.clothing = "Wear light cotton clothes. Don't forget sunglasses and sunscreen.";
        recs.activity = "Avoid going out during peak afternoon. Stay hydrated.";
      } else if (temp > 20) {
        recs.clothing = "T-shirts and comfortable trousers will be perfect.";
        recs.activity = "Great time for outdoor activities like a walk in the park.";
      } else if (temp > 10) {
        recs.clothing = "Keep a light jacket or sweater handy.";
        recs.activity = "Pleasant weather for outdoor sports.";
      } else {
        recs.clothing = "Wear heavy woolens, a cap, and gloves.";
        recs.activity = "Stay cozy indoors and enjoy warm drinks.";
      }
      
      if (isRainy) {
        recs.clothing = "Wear a waterproof jacket and carry an umbrella.";
        recs.activity = "Avoid outdoor plans, opt for indoor activities.";
        recs.icon = Umbrella;
      }
    }
    
    return recs;
  };
  
  const { clothing, activity, icon: RecIcon } = getRecommendations();

  return (
    <div className="mt-6 p-4 bg-white/[0.12] rounded-xl border border-white/20 backdrop-blur-md animate-fade-in shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
        <h4 className="text-xs font-bold text-white uppercase tracking-widest opacity-80">
          {language === 'hi' ? "स्मार्ट सुझाव" : "Smart Recommendations"}
        </h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <RecIcon className="h-4 w-4 text-blue-300" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase font-bold mb-1">
              {language === 'hi' ? "क्या पहनें" : "What to wear"}
            </p>
            <p className="text-xs text-white/90 leading-relaxed font-medium">{clothing}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Footprints className="h-4 w-4 text-indigo-300" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase font-bold mb-1">
              {language === 'hi' ? "गतिविधि" : "Activity"}
            </p>
            <p className="text-xs text-white/90 leading-relaxed font-medium">{activity}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
