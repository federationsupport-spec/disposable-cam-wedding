import { useState } from "react";
import { Heart, Send } from "lucide-react";
import { EVENT_CONFIG, THEME } from "../config";
import { PhotoGrid, FullscreenPhotoView } from "./PhotoGrid";
import { PhotoRecord } from "../utils/db";
import { useI18n } from "../i18n";

export default function DoneScreen() {
  const { t } = useI18n();
  const [selectedPhoto, setSelectedPhoto] = useState<(PhotoRecord & { url: string }) | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(() => localStorage.getItem('photos_submitted') === '1');

  const handleSubmitPhotos = () => {
    // This is where the real upload to the server will go in the production version.
    localStorage.setItem('photos_submitted', '1');
    setIsSubmitted(true);
  };

  return (
    <div className="h-[100dvh] flex flex-col pt-[max(2rem,env(safe-area-inset-top))] overflow-hidden" style={{ background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 55%, #23211E 100%)' }}>
      <div className="shrink-0 flex flex-col items-center justify-center px-6 text-center w-full max-w-md mx-auto pt-2 pb-4">
        <Heart className={`w-5 h-5 ${THEME.textInk} mb-2 ${THEME.fillInk}`} />
        
        <h1 className={`font-['Playfair_Display'] text-3xl ${THEME.textInk} font-semibold`}>
          {t('thank_you')}
        </h1>
      </div>

      <div className="w-full h-px bg-[#2A2A2A] shrink-0" />

      <div className="flex-1 overflow-y-auto overscroll-contain w-full">
        <div className="w-full px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col items-center min-h-full">
          <div className="w-full max-w-4xl pb-6">
            <PhotoGrid onPhotoClick={setSelectedPhoto} />
          </div>
          
          <div className="w-full max-w-md mx-auto shrink-0 mt-auto pt-4">
            {isSubmitted ? (
              <div className={`flex items-center justify-center gap-2 bg-black border-2 border-[#F7F4EF] text-[#F7F4EF] py-4 px-6 rounded-full font-medium shadow-sm`}>
                <Heart className="w-5 h-5 fill-[#F7F4EF]" />
                <span>{t('photos_sent' as any)}</span>
              </div>
            ) : (
              <button 
                onClick={handleSubmitPhotos}
                className={`w-full ${THEME.button} text-lg sm:text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-3 font-medium`}
              >
                <Send className="w-6 h-6" />
                {t('submit_photos' as any)}
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <FullscreenPhotoView 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
}
