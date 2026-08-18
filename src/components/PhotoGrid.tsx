import { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';
import { getPhotos, PhotoRecord } from '../utils/db';
import { THEME } from '../config';
import { useI18n } from '../i18n';

interface PhotoGridProps {
  onPhotoClick?: (photo: PhotoRecord & { url: string }) => void;
}

export function PhotoGrid({ onPhotoClick }: PhotoGridProps) {
  const [photos, setPhotos] = useState<(PhotoRecord & { url: string })[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    let active = true;
    let loadedPhotos: (PhotoRecord & { url: string })[] = [];

    getPhotos().then(records => {
      if (!active) return;
      loadedPhotos = records.map(record => ({
        ...record,
        url: URL.createObjectURL(record.blob)
      }));
      setPhotos(loadedPhotos);
    });

    return () => {
      active = false;
      loadedPhotos.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, []);

  if (photos.length === 0) {
    return (
      <div className={`py-12 text-center ${THEME.textGrey}`}>
        {t('gallery_empty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-5xl mx-auto">
      {photos.map(photo => (
        <div 
          key={photo.timestamp}
          className="aspect-square bg-[#2A2A2A] overflow-hidden cursor-pointer rounded-md"
          onClick={() => onPhotoClick?.(photo)}
        >
          <img src={photo.url} alt="Guest photo" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}

export function FullscreenPhotoView({ 
  photo, 
  onClose 
}: { 
  photo: PhotoRecord & { url: string }; 
  onClose: () => void;
}) {
  const { t } = useI18n();

  const handleShare = async () => {
    const file = new File([photo.blob], `wedding-photo-${photo.timestamp}.jpg`, { type: photo.blob.type || 'image/jpeg' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
        });
      } catch (err) {
        // user cancelled or share failed, fallback to download maybe? Or just ignore cancel.
        if ((err as Error).name !== 'AbortError') {
           downloadFallback(file);
        }
      }
    } else {
      downloadFallback(file);
    }
  };

  const downloadFallback = (file: File) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`fixed inset-0 z-50 ${THEME.bg} flex flex-col`}>
      <div className="absolute top-0 inset-x-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center bg-gradient-to-b from-[#0F0F0F]/90 to-transparent z-10">
        <button onClick={onClose} className={`p-2 rounded-full ${THEME.textInk} hover:bg-white/10 backdrop-blur-md transition-colors`}>
          <X className="w-6 h-6" />
        </button>
        <button onClick={handleShare} className={`py-2 px-4 rounded-full ${THEME.button} backdrop-blur-md transition-colors flex items-center gap-2`}>
          <Share className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">{t('share')}</span>
        </button>
      </div>
      <div className="flex-1 w-full h-full flex items-center justify-center p-4">
        <img src={photo.url} alt="Fullscreen guest photo" className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  );
}
