import React, { useState } from 'react';
import { X, Mail, Lock, User, MapPin, Loader, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register, error, setError } = useAuth();
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let success = false;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(email, fullName, location, phone, password);
    }
    
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/60 text-sm font-['DM_Sans']">
              {isLogin 
                ? 'Login to receive critical weather alerts' 
                : 'Sign up to keep your community safe'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 text-sm animate-shake">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    placeholder="Location (Optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">WA</div>
                  <input
                    type="text"
                    placeholder="WhatsApp Number (+91...)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Register'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={toggleMode}
              className="text-white/60 hover:text-white text-sm transition-colors font-['DM_Sans'] underline underline-offset-4"
            >
              {isLogin 
                ? "Don't have an account? Register" 
                : "Already have an account? Login"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
