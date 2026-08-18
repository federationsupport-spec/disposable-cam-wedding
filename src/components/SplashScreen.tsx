import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EVENT_CONFIG, THEME } from "../config";
import { Camera, Globe } from "lucide-react";
import { deleteDB } from "../utils/db";
import { useI18n } from "../i18n";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const tapTimes = useRef<number[]>([]);

  const handleDateTap = () => {
    const now = Date.now();
    tapTimes.current = tapTimes.current.filter(t => now - t < 3000);
    tapTimes.current.push(now);
    
    if (tapTimes.current.length >= 7) {
      tapTimes.current = [];
      localStorage.removeItem('guest_photos_used');
      deleteDB().then(() => {
        window.location.reload();
      });
    }
  };

  const handleStart = () => {
    const used = parseInt(localStorage.getItem('guest_photos_used') || '0', 10);
    if (used >= EVENT_CONFIG.maxPhotosPerGuest) {
      navigate('/done');
    } else {
      navigate('/camera');
    }
  };

  const cycleLanguage = () => {
    const langs: ('ckb' | 'ar' | 'en')[] = ['ckb', 'ar', 'en'];
    const nextIdx = (langs.indexOf(lang) + 1) % langs.length;
    setLang(langs[nextIdx]);
  };

  return (
    <div className={`h-[100dvh] overflow-hidden ${THEME.bg} flex flex-col relative`}>
      
      {/* Language Switcher */}
      <button 
        onClick={cycleLanguage}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors z-10 flex items-center gap-2 rtl:left-4 rtl:right-auto"
      >
        <Globe className="w-6 h-6" />
        <span className="text-sm font-semibold uppercase">{lang}</span>
      </button>

      {/* Cover Photo */}
      <div className="relative w-full flex-1 min-h-0">
        <img
          src={EVENT_CONFIG.coverPhoto}
          alt={`${EVENT_CONFIG.brideName} and ${EVENT_CONFIG.groomName}`}
          className="w-full h-full object-cover grayscale"
          onError={(e) => {
            // Fallback if image not found
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop";
          }}
        />
        <div className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent ${THEME.gradientToBg}`} />
      </div>

      <div className="shrink-0 flex flex-col items-center justify-center w-full max-w-md mx-auto text-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-4 mt-2">
        
        {/* Text Content */}
        <div className="space-y-3">
          <h1 className={`font-['Playfair_Display'] text-3xl sm:text-4xl ${THEME.textInk} leading-tight`} dir="ltr">
            {EVENT_CONFIG.brideName} <br /> 
            <span className={`text-2xl sm:text-3xl italic ${THEME.ampersand}`}>&amp;</span> <br /> 
            {EVENT_CONFIG.groomName}
          </h1>
          
          <div className="space-y-2" dir="ltr">
            <p 
              className={`text-lg ${THEME.textInk} tracking-widest uppercase cursor-pointer select-none`}
              onClick={handleDateTap}
            >
              {new Date(EVENT_CONFIG.eventDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className={`text-base ${THEME.textGrey} tracking-wider uppercase`}>
              {EVENT_CONFIG.venue}
            </p>
          </div>

          <p className={`text-xl sm:text-2xl ${THEME.textInk} pt-1 font-semibold`}>
            {t('welcome')}
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-md mx-auto mt-auto pt-4">
          <button 
            onClick={handleStart}
            className={`w-full ${THEME.button} text-lg sm:text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-3 font-medium`}
          >
            <Camera className="w-6 h-6" />
            {t('start_taking')}
          </button>
        </div>
      </div>
    </div>
  );
}
