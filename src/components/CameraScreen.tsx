import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SwitchCamera, Image as ImageIcon, Film } from 'lucide-react';
import { EVENT_CONFIG, THEME } from '../config';
import { savePhoto, getPhotos } from '../utils/db';
import { useI18n } from '../i18n';

function FlipDigit({ val }: { val: string }) {
  const [prev, setPrev] = useState(val);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (val !== prev) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setPrev(val);
        setFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [val, prev]);

  const clipTop = { clipPath: 'inset(0 0 50% 0)' };
  const clipBottom = { clipPath: 'inset(50% 0 0 0)' };

  return (
    <div className={`relative w-5 h-7 sm:w-6 sm:h-8 ${THEME.cameraDigitBg} rounded ${THEME.cameraDigitText} font-mono text-lg sm:text-xl font-bold flex items-center justify-center [perspective:300px] shadow-inner`}>
      {/* Seam line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 z-20" />

      {/* Base Top: NEW value */}
      <div className="absolute inset-0 flex items-center justify-center" style={clipTop}>
        {val}
      </div>

      {/* Base Bottom: OLD value */}
      <div className="absolute inset-0 flex items-center justify-center" style={clipBottom}>
        {prev}
      </div>

      {/* Flipping Top Flap: OLD value */}
      {flipping && (
        <div 
          className="absolute inset-0 flex items-center justify-center origin-bottom backface-hidden z-10 preserve-3d"
          style={{ ...clipTop, animation: 'flipTop 150ms ease-in forwards' }}
        >
          {prev}
        </div>
      )}

      {/* Flipping Bottom Flap: NEW value */}
      {flipping && (
        <div 
          className="absolute inset-0 flex items-center justify-center origin-top backface-hidden z-10 preserve-3d"
          style={{ ...clipBottom, transform: 'rotateX(90deg)', animation: 'flipBottom 150ms ease-out forwards 150ms' }}
        >
          {val}
        </div>
      )}
    </div>
  );
}

export default function CameraScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flash, setFlash] = useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);

  const [photosUsed, setPhotosUsed] = useState(() =>
    parseInt(localStorage.getItem('guest_photos_used') || '0', 10)
  );

  const remainingPhotos = Math.max(0, EVENT_CONFIG.maxPhotosPerGuest - photosUsed);
  const remainingStr = remainingPhotos.toString().padStart(2, '0');
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (remainingPhotos === 0 && photosUsed > 0) {
      setIsBlinking(true);
    }
  }, [remainingPhotos, photosUsed]);

  useEffect(() => {
    getPhotos().then(photos => {
      if (photos.length > 0) {
        setLastPhotoUrl(URL.createObjectURL(photos[0].blob));
      }
    });
  }, []);

  // Stop media tracks reliably
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Setup camera when component mounts or facingMode changes
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      stopCamera(); // Ensure any existing stream is stopped before requesting a new one
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });

        // If the effect was cleaned up while waiting for permissions, stop the newly acquired stream immediately
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setFallbackMode(false);
      } catch (err) {
        if (cancelled) return; // Ignore errors if already unmounted/cancelled
        console.error("Camera access denied or unavailable", err);
        setFallbackMode(true);
      }
    };

    startCamera();

    // Cleanup on unmount or facingMode change
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [facingMode]);

  // Navigate to done screen if limit reached
  useEffect(() => {
    if (remainingPhotos <= 0) {
      navigate('/done', { replace: true });
    }
  }, [remainingPhotos, navigate]);

  // Process and save photo blob
  const handlePhotoTaken = async (blob: Blob) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    try {
      await savePhoto(blob);
      const newUsed = photosUsed + 1;
      localStorage.setItem('guest_photos_used', newUsed.toString());
      setPhotosUsed(newUsed);

      if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl);
      setLastPhotoUrl(URL.createObjectURL(blob));

      // After updating state, if we hit the limit, routing happens via useEffect,
      // but let's give the user a moment to see the flash/badge update if desired.
      if (newUsed >= EVENT_CONFIG.maxPhotosPerGuest) {
        setTimeout(() => {
          navigate('/done', { replace: true });
        }, 800);
      }
    } catch (e) {
      console.error("Failed to save photo", e);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || remainingPhotos <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0);

    // Export as JPEG at 90% quality
    canvas.toBlob((blob) => {
      if (blob) handlePhotoTaken(blob);
    }, 'image/jpeg', 0.9);
  };

  const handleFallbackCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoTaken(file);
  };

  return (
    <div className={`h-[100dvh] ${THEME.cameraBg} text-white flex flex-col relative overflow-hidden overscroll-none`}>
      {/* Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${flash ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Video Viewfinder */}
      {!fallbackMode && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors rtl:rotate-180"
          >
            <ArrowLeft className="w-6 h-6 drop-shadow-md" />
          </button>
          <div className="text-center px-2 flex-1">
            <h2 className="font-['Playfair_Display'] font-medium text-sm text-white/90 drop-shadow-md truncate" dir="ltr">
              {EVENT_CONFIG.brideName} & {EVENT_CONFIG.groomName}
            </h2>
          </div>
          <div className={`flex items-center gap-1.5 ${THEME.cameraCounterBg} p-1.5 rounded-lg border-2 ${THEME.cameraCounterBorder} shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${isBlinking ? 'animate-[blink-twice_800ms_ease-in-out_forwards]' : ''}`}>
            <Film className={`w-4 h-4 ${THEME.cameraIconGrey} ml-1`} />
            <div className="flex gap-0.5" dir="ltr">
              <FlipDigit val={remainingStr[0]} />
              <FlipDigit val={remainingStr[1]} />
            </div>
            <span className={`${THEME.cameraIconGrey} text-xs font-semibold pr-1 uppercase tracking-wider`}>
              {t('left')}
            </span>
          </div>
        </div>
      </div>

      {/* Camera Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-[max(2rem,env(safe-area-inset-bottom))] flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        
        {/* Last Photo Thumbnail and Gallery */}
        <div className="flex items-center gap-2">
          <div 
            className="w-14 h-14 rounded-md overflow-hidden border-2 border-white/40 bg-black/50 shadow-lg cursor-pointer flex items-center justify-center"
            onClick={() => navigate('/gallery')}
          >
            {lastPhotoUrl ? (
              <img src={lastPhotoUrl} className="w-full h-full object-cover" alt="Last capture" />
            ) : (
              <ImageIcon className="w-6 h-6 text-white/50" />
            )}
          </div>
        </div>

        {/* Shutter Button */}
        {fallbackMode ? (
          <label className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer bg-white/20 shadow-lg">
            <div className="w-16 h-16 bg-white rounded-full"></div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFallbackCapture}
            />
          </label>
        ) : (
          <button
            onClick={takePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform bg-white/20 shadow-lg"
          >
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </button>
        )}

        {/* Flip Camera Button */}
        {!fallbackMode ? (
          <button
            onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
            className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20 shadow-lg"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-14 h-14" /> /* Spacer to maintain flex layout */
        )}
      </div>
    </div>
  );
}
