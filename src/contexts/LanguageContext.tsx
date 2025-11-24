import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ja';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // --- APP SHELL ---
  app_name: {
    en: 'Clarity Scan Aid',
    hi: 'क्लेरिटी स्कैन एड',
    kn: 'ಕ್ಲಾರಿಟಿ ಸ್ಕ್ಯಾನ್ ಏಡ್',
    ta: 'கிளாரிட்டி ஸ்கேன் எய்ட்',
    te: 'క్లారిటీ స్కాన్ ఎయిడ్',
    ja: 'クラリティスキャンエイド'
  },
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    ta: 'முகப்பு',
    te: 'డాష్‌బోర్డ్',
    ja: 'ダッシュボード'
  },
  sign_in: {
    en: 'Sign In',
    hi: 'साइन इन',
    kn: 'ಸೈನ್ ಇನ್',
    ta: 'உள்நுழைக',
    te: 'సైన్ ఇన్',
    ja: 'サインイン'
  },
  guest_mode: {
    en: 'Try as Guest',
    hi: 'अतिथि के रूप में',
    kn: 'ಅತಿಥಿಯಾಗಿ ಪ್ರಯತ್ನಿಸಿ',
    ta: 'விருந்தினராக முயற்சிக்கவும்',
    te: 'గెస్ట్‌గా ప్రయత్నించండి',
    ja: 'ゲストとして試す'
  },

  // --- UPLOAD PAGE ---
  upload_title: {
    en: 'Upload Retinal Scan',
    hi: 'रेटिनल स्कैन अपलोड करें',
    kn: 'ರೆಟಿನಲ್ ಸ್ಕ್ಯಾನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    ta: 'விழித்திரை ஸ்கேன் பதிவேற்றவும்',
    te: 'రెటీనా స్కాన్ అప్‌లోడ్ చేయండి',
    ja: '網膜スキャンをアップロード'
  },
  upload_desc: {
    en: 'Upload a fundus image for AI analysis.',
    hi: 'AI विश्लेषण के लिए एक फंडस छवि अपलोड करें।',
    kn: 'AI ವಿಶ್ಲೇಷಣೆಗಾಗಿ ಕಣ್ಣಿನ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    ta: 'AI பகுப்பாய்விற்காக விழித்திரை படத்தை பதிவேற்றவும்.',
    te: 'AI విశ్లేషణ కోసం రెటీనా చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    ja: 'AI分析のために眼底画像をアップロードしてください。'
  },
  analyze_btn: {
    en: 'Analyze Image',
    hi: 'छवि का विश्लेषण करें',
    kn: 'ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಿ',
    ta: 'பகுப்பாய்வு செய்',
    te: 'విశ్లేషించండి',
    ja: '画像を分析'
  },
  analyzing: {
    en: 'Analyzing...',
    hi: 'विश्लेषण हो रहा है...',
    kn: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    ta: 'பகுப்பாய்வு...',
    te: 'విశ్లేషించబడుతోంది...',
    ja: '分析中...'
  },
  upload_guidelines: {
    en: 'Upload Guidelines',
    hi: 'अपलोड दिशानिर्देश',
    kn: 'ಮಾರ್ಗಸೂಚಿಗಳು',
    ta: 'வழிகாட்டுதல்கள்',
    te: 'మార్గదర్శకాలు',
    ja: 'ガイドライン'
  },

  // --- RESULTS PAGE ---
  analysis_results: {
    en: 'Analysis Results',
    hi: 'विश्लेषण परिणाम',
    kn: 'ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶಗಳು',
    ta: 'பகுப்பாய்வு முடிவுகள்',
    te: 'విశ్లేషణ ఫలితాలు',
    ja: '分析結果'
  },
  confidence: {
    en: 'Confidence',
    hi: 'विश्वास',
    kn: 'ನಂಬಿಕೆ',
    ta: 'நம்பிக்கை',
    te: 'నమ్మకం',
    ja: '信頼度'
  },
  severity: {
    en: 'Severity',
    hi: 'गंभीरता',
    kn: 'ತೀವ್ರತೆ',
    ta: 'தீவிரத்தன்மை',
    te: 'తీవ్రత',
    ja: '重症度'
  },
  urgency: {
    en: 'Urgency',
    hi: 'तात्कालिकता',
    kn: 'ತುರ್ತು',
    ta: 'அவசரம்',
    te: 'అత్యవసర',
    ja: '緊急度'
  },
  lesion_map: {
    en: 'Lesion Detection',
    hi: 'घाव का पता लगाना',
    kn: 'ಗಾಯ ಪತ್ತೆ',
    ta: 'காயம் கண்டறிதல்',
    te: 'గాయం గుర్తింపు',
    ja: '病変検出'
  },
  prob_distribution: {
    en: 'Probability Distribution',
    hi: 'संभावना वितरण',
    kn: 'ಸಂಭವನೀಯತೆ ಹಂಚಿಕೆ',
    ta: 'நிகழ்தகவு விநியோகம்',
    te: 'సంభావ్యత పంపిణీ',
    ja: '確率分布'
  },
  recommendations: {
    en: 'Recommendations',
    hi: 'सिफारिशें',
    kn: 'ಶಿಫಾರಸುಗಳು',
    ta: 'பரிந்துரைகள்',
    te: 'సిఫార్సులు',
    ja: '推奨事項'
  },
  find_doctor: {
    en: 'Find Specialists',
    hi: 'विशेषज्ञ खोजें',
    kn: 'ತಜ್ಞರನ್ನು ಹುಡುಕಿ',
    ta: 'நிபுணர்களைக் கண்டறி',
    te: 'నిపుణులను కనుగొనండి',
    ja: '専門医を探す'
  },
  book_appt: {
    en: 'Book Appointment',
    hi: 'अपॉइंटमेंट बुक करें',
    kn: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್',
    ta: 'முன்பதிவு',
    te: 'అపాయింట్‌మెంట్',
    ja: '予約する'
  },
  download_report: {
    en: 'Download Report',
    hi: 'रिपोर्ट डाउनलोड करें',
    kn: 'ವರದಿ ಡೌನ್‌ಲೋಡ್',
    ta: 'அறிக்கை பதிவிறக்கம்',
    te: 'నివేదిక డౌన్‌లోడ్',
    ja: 'レポートをダウンロード'
  },

  // --- HISTORY PAGE ---
  scan_history: {
    en: 'Scan History',
    hi: 'स्कैन इतिहास',
    kn: 'ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ',
    ta: 'ஸ்கேன் வரலாறு',
    te: 'స్కాన్ చరిత్ర',
    ja: 'スキャン履歴'
  },
  clear_history: {
    en: 'Clear History',
    hi: 'इतिहास साफ़ करें',
    kn: 'ಇತಿಹಾಸ ಅಳಿಸಿ',
    ta: 'வரலாற்றை அழிக்கவும்',
    te: 'చరిత్రను తొలగించండి',
    ja: '履歴を消去'
  },
  no_scans: {
    en: 'No scans found',
    hi: 'कोई स्कैन नहीं मिला',
    kn: 'ಯಾವುದೇ ಸ್ಕ್ಯಾನ್‌ಗಳಿಲ್ಲ',
    ta: 'ஸ்கேன் இல்லை',
    te: 'స్కాన్‌లు లేవు',
    ja: 'スキャンなし'
  },
  search_placeholder: {
    en: 'Search date or disease...',
    hi: 'तारीख या बीमारी खोजें...',
    kn: 'ದಿನಾಂಕ ಅಥವಾ ರೋಗ ಹುಡುಕಿ...',
    ta: 'தேடு...',
    te: 'శోధించండి...',
    ja: '検索...'
  },

  // --- SETTINGS PAGE ---
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    kn: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    ta: 'அமைப்புகள்',
    te: 'సెట్టింగులు',
    ja: '設定'
  },
  appearance: {
    en: 'Appearance',
    hi: 'दिखावट',
    kn: 'ರೂಪ',
    ta: 'தோற்றம்',
    te: 'స్వరూపం',
    ja: '外観'
  },
  personal_info: {
    en: 'Personal Information',
    hi: 'व्यक्तिगत जानकारी',
    kn: 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    ta: 'தனிப்பட்ட தகவல்',
    te: 'వ్యక్తిగత సమాచారం',
    ja: '個人情報'
  },
  notifications: {
    en: 'Notifications',
    hi: 'सूचनाएं',
    kn: 'ಸೂಚನೆಗಳು',
    ta: 'அறிவிப்புகள்',
    te: 'నోటిఫికేషన్లు',
    ja: '通知'
  },
  data_privacy: {
    en: 'Data & Privacy',
    hi: 'डेटा और गोपनीयता',
    kn: 'ಡೇಟಾ ಗೌಪ್ಯತೆ',
    ta: 'தரவு தனியுரிமை',
    te: 'డేటా గోప్యత',
    ja: 'データとプライバシー'
  },
  export_data: {
    en: 'Export Data',
    hi: 'डेटा निर्यात',
    kn: 'ಡೇಟಾ ರಫ್ತು',
    ta: 'தரவு ஏற்றுமதி',
    te: 'డేటా ఎగుమతి',
    ja: 'データのエクスポート'
  },
  delete_data: {
    en: 'Delete All Data',
    hi: 'सारा डेटा हटाएं',
    kn: 'ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ',
    ta: 'எல்லா தரவையும் நீக்கு',
    te: 'మొత్తం డేటాను తొలగించు',
    ja: '全データを削除'
  },

  // --- DISEASES ---
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
    ta: 'கண்ணீர் அழுத்தம்',
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
  
  // --- DISCLAIMER ---
  disclaimer: {
    en: 'Important: This AI analysis is for screening only. Consult a doctor.',
    hi: 'महत्वपूर्ण: यह एआई विश्लेषण केवल स्क्रीनिंग के लिए है। डॉक्टर से सलाह लें।',
    kn: 'ಪ್ರಮುಖ: ಇದು ಕೇವಲ ತಪಾಸಣೆಗಾಗಿ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    ta: 'முக்கியம்: இது திரையிடலுக்கு மட்டுமே. மருத்துவரை அணுகவும்.',
    te: 'ముఖ్యం: ఇది స్క్రీనింగ్ కోసం మాత్రమే. వైద్యుడిని సంప్రదించండి.',
    ja: '重要：このAI分析はスクリーニングのみを目的としています。医師にご相談ください。'
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
    // Optional: Persist language preference
    localStorage.setItem('app_language', lang);
  };

  // Load language preference on mount
  React.useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang) setCurrentLanguage(savedLang);
  }, []);

  const t = (key: string): string => {
    // Fallback to English if translation is missing
    return translations[key]?.[currentLanguage] || translations[key]?.['en'] || key;
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
