import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PhotoGrid, FullscreenPhotoView } from './PhotoGrid';
import { EVENT_CONFIG, THEME } from '../config';
import { PhotoRecord } from '../utils/db';
import { useI18n } from '../i18n';

export default function GalleryScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedPhoto, setSelectedPhoto] = useState<(PhotoRecord & { url: string }) | null>(null);
  
  const used = parseInt(localStorage.getItem('guest_photos_used') || '0', 10);
  const canGoBackToCamera = used < EVENT_CONFIG.maxPhotosPerGuest;

  return (
    <div className={`min-h-[100dvh] ${THEME.bg} flex flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]`}>
      <div className="px-4 py-4 flex items-center mb-4 sticky top-0 bg-[#0F0F0F]/90 backdrop-blur-md z-10">
        <button 
          onClick={() => navigate(canGoBackToCamera ? '/camera' : '/done')}
          className={`p-2 -ml-2 rounded-full hover:bg-white/10 ${THEME.textInk} transition-colors rtl:rotate-180`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`font-['Playfair_Display'] text-2xl ${THEME.textInk} ml-4 font-semibold flex-1`}>
          {t('gallery')}
        </h1>
      </div>
      
      <div className="flex-1 px-4 sm:px-8">
        <PhotoGrid onPhotoClick={setSelectedPhoto} />
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
