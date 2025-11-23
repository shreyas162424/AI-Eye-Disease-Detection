import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ja';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  upload_image: {
    en: 'Upload Image',
    hi: 'छवि अपलोड करें',
    kn: 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    ta: 'படத்தைப் பதிவேற்றவும்',
    te: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    ja: '画像をアップロード'
  },
  results: {
    en: 'Results',
    hi: 'परिणाम',
    kn: 'ಫಲಿತಾಂಶಗಳು',
    ta: 'முடிவுகள்',
    te: 'ఫలితాలు',
    ja: '結果'
  },
  doctors_nearby: {
    en: 'Doctors Nearby',
    hi: 'पास के डॉक्टर',
    kn: 'ಹತ್ತಿರದ ವೈದ್ಯರು',
    ta: 'அருகிலுள்ள மருத்துவர்கள்',
    te: 'సమీప వైద్యులు',
    ja: '近くの医師'
  },
  history: {
    en: 'History',
    hi: 'इतिहास',
    kn: 'ಇತಿಹಾಸ',
    ta: 'வரலாறு',
    te: 'చరిత్ర',
    ja: '履歴'
  },
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    kn: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    ta: 'அமைப்புகள்',
    te: 'సెట్టింగులు',
    ja: '設定'
  },
  
  // Disease names
  normal: {
    en: 'Normal',
    hi: 'सामान्य',
    kn: 'ಸಾಮಾನ್ಯ',
    ta: 'சாதாரண',
    te: 'సాధారణ',
    ja: '正常'
  },
  cataract: {
    en: 'Cataract',
    hi: 'मोतियाबिंद',
    kn: 'ಕಣ್ಣಿನ ಪೊರೆ',
    ta: 'கண்புரை',
    te: 'కంటిశుక్లం',
    ja: '白内障'
  },
  glaucoma: {
    en: 'Glaucoma',
    hi: 'काला मोतिया',
    kn: 'ಗ್ಲುಕೋಮಾ',
    ta: 'கண்ணீர் அழுत்தம்',
    te: 'గ్లూకోమా',
    ja: '緑内障'
  },
  diabetic_retinopathy: {
    en: 'Diabetic Retinopathy',
    hi: 'मधुमेह रेटिनोपैथी',
    kn: 'ಮಧುಮೇಹದ ರೆಟಿನೋಪತಿ',
    ta: 'நீரிழிவு விழித்திரை நோய்',
    te: 'మధుమేహ రెటినోపతి',
    ja: '糖尿病網膜症'
  },
  
  // Messages
  no_disease_detected: {
    en: 'No disease detected. Your eyes appear healthy!',
    hi: 'कोई बीमारी नहीं मिली। आपकी आंखें स्वस्थ दिखती हैं!',
    kn: 'ಯಾವುದೇ ರೋಗ ಪತ್ತೆಯಾಗಿಲ್ಲ. ನಿಮ್ಮ ಕಣ್ಣುಗಳು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತವೆ!',
    ta: 'நோய் எதுவும் கண்டறியப்படவில்லை. உங்கள் கண்கள் ஆரோக்கியமாக உள்ளன!',
    te: 'ఏ వ్యాధి గుర్తించబడలేదు. మీ కళ్ళు ఆరోగ్యంగా కనిపిస్తున్నాయి!',
    ja: '病気は検出されませんでした。あなたの目は健康に見えます！'
  },
  consult_specialist: {
    en: 'Please consult an eye specialist soon.',
    hi: 'कृपया जल्द ही नेत्र विशेषज्ञ से सलाह लें।',
    kn: 'ದಯವಿಟ್ಟು ಶೀಘ್ರದಲ್ಲೇ ನೇತ್ರ ವಿಶೇಷಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    ta: 'தயவுசெய்து விரைவில் கண் மருத்துவரை அணுகவும்.',
    te: 'దయచేసి త్వరలో కంటి వైద్యుడిని సంప్రదించండి.',
    ja: 'すぐに眼科専門医にご相談ください。'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[currentLanguage] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const getLanguageOptions = () => [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'ja', label: '日本語' }
];