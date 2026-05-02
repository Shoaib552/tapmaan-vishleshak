import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { Github, Linkedin, Mail, ExternalLink, User, X } from "lucide-react";

const About = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language];

  if (!isOpen) return null;

  const socialLinks = [
    {
      name: "GitHub",
      url: "https://github.com/Shoaib552",
      icon: Github,
      color: "hover:text-gray-400",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/shoaib-khan-4b441a23a/",
      icon: Linkedin,
      color: "hover:text-blue-400",
    },
    {
      name: "Email",
      url: "mailto:smohdshoaib208@gmail.com",
      icon: Mail,
      color: "hover:text-red-400",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#121212] border border-white/20 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative overflow-hidden">
          {/* Decorative background blobs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            {/* Profile Image Container */}
            <div className="relative flex-shrink-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500 group">
                <img
                  src="/shoaib.jpg"
                  alt="Shoaib"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  onError={(e) => {
                    e.target.src = "https://ui-avatars.com/api/?name=Shoaib&background=0D8ABC&color=fff&size=200";
                  }}
                />
              </div>
              {/* Status dot */}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-[#1a1a1a] rounded-full animate-pulse"></div>
            </div>

            {/* Content Container */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <User className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  {language === "hi" ? "डेवलपर के बारे में" : "About the Developer"}
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-white mb-4 tracking-tight">
                Shoaib
              </h2>

              <p className="text-lg text-gray-300 font-['DM_Sans'] leading-relaxed mb-8 max-w-xl">
                {language === "hi"
                  ? "नमस्ते! मैं शोएब हूँ, एक पैशनेट Full Stack Web डेवलपर। मैंने इस मौसम डैशबोर्ड को आधुनिक डिजाइन और सटीक डेटा के साथ बनाया है ताकि आपको मौसम की बेहतरीन जानकारी मिल सके।"
                  : "Hi! I'm Shoaib, a passionate Full Stack Web developer. I built this weather dashboard with modern design and accurate data to provide you with the best weather insights."
                }
              </p>

              {/* Social Links Grid */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg ${link.color} group`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{link.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Footer info line */}
          <div className="border-t border-white/10 p-4 bg-black/20 text-center">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
              Tapmaan Vishleshak v2.0 • Designed & Built by Shoaib
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
