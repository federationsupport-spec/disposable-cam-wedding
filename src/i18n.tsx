import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'ckb' | 'ar' | 'en';

const translations = {
  ckb: {
    welcome: 'بەخێربێن بۆ ئاهەنگەکەمان',
    start_taking: 'دەستپێکردنی وێنەگرتن',
    thank_you: 'سوپاس!',
    photos_taken: 'تەواوی {max} وێنەکەت گرتووە.',
    photos_saved: 'وێنەکان لە ئەلبوومی هاوسەران پاشەکەوت کران.',
    cant_wait: 'بە پەرۆشەوە چاوەڕێین بیرەوەرییەکان ببینین.',
    left: 'ماوە',
    share: 'هاوبەشکردن',
    download: 'داگرتن',
    gallery_empty: 'هیچ وێنەیەک نییە',
    camera_error: 'نەتوانرا کامێرا بکرێتەوە',
    camera_permission: 'تکایە ڕێگە بە بەکارهێنانی کامێرا بدە',
    gallery: 'گالەری',
    submit_photos: 'ناردنی وێنەکان',
    photos_sent: 'وێنەکان نێردران بۆ هاوسەران',
  },
  ar: {
    welcome: 'أهلاً بكم في زفافنا',
    start_taking: 'ابدأ بالتقاط الصور',
    thank_you: 'شكراً لك!',
    photos_taken: 'لقد التقطت جميع صورك الـ {max}.',
    photos_saved: 'تم حفظ الصور في ألبوم الزوجين.',
    cant_wait: 'لا يسعنا الانتظار لرؤية هذه الذكريات.',
    left: 'باقي',
    share: 'مشاركة',
    download: 'تنزيل',
    gallery_empty: 'لا توجد صور',
    camera_error: 'تعذر فتح الكاميرا',
    camera_permission: 'يرجى السماح باستخدام الكاميرا',
    gallery: 'معرض',
    submit_photos: 'إرسال الصور',
    photos_sent: 'تم إرسال الصور إلى الزوجين',
  },
  en: {
    welcome: 'Welcome to our wedding',
    start_taking: 'Start taking photos',
    thank_you: 'Thank you!',
    photos_taken: 'You\'ve taken all {max} of your photos.',
    photos_saved: 'The photos are saved to the couple\'s album.',
    cant_wait: 'We can\'t wait to look back at these memories.',
    left: 'Left',
    share: 'Share',
    download: 'Download',
    gallery_empty: 'No photos yet',
    camera_error: 'Could not access camera',
    camera_permission: 'Please allow camera access',
    gallery: 'Gallery',
    submit_photos: 'Send the photos',
    photos_sent: 'Photos sent to the couple',
  }
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('guest_lang') as Lang) || 'ckb';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('guest_lang', newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  const t = (key: keyof typeof translations['en'], params?: Record<string, string | number>) => {
    let str = translations[lang][key] || translations['en'][key];
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
