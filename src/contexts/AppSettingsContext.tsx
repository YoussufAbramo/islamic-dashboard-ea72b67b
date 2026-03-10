import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface Currency {
  name: string;
  symbol: string;
}

const CURRENCIES: Currency[] = [
  { name: 'USD', symbol: '$' },
  { name: 'EUR', symbol: '€' },
  { name: 'GBP', symbol: '£' },
  { name: 'SAR', symbol: '﷼' },
  { name: 'AED', symbol: 'د.إ' },
  { name: 'EGP', symbol: 'ج.م' },
  { name: 'KWD', symbol: 'د.ك' },
  { name: 'QAR', symbol: 'ر.ق' },
];

export type ColorTheme = 'emerald' | 'ocean' | 'purple' | 'desert' | 'midnight';
export type ButtonShape = 'rounded' | 'circular' | 'square';
export type FooterPosition = 'left' | 'center' | 'right';

const THEMES: { value: ColorTheme; label: string; labelAr: string; color: string }[] = [
  { value: 'emerald', label: 'Emerald Gold', labelAr: 'الزمرد الذهبي', color: 'hsl(160 45% 28%)' },
  { value: 'ocean', label: 'Ocean Blue', labelAr: 'الأزرق المحيطي', color: 'hsl(210 65% 38%)' },
  { value: 'purple', label: 'Royal Purple', labelAr: 'البنفسجي الملكي', color: 'hsl(270 50% 40%)' },
  { value: 'desert', label: 'Desert Sand', labelAr: 'رمال الصحراء', color: 'hsl(25 60% 42%)' },
  { value: 'midnight', label: 'Midnight', labelAr: 'منتصف الليل', color: 'hsl(220 55% 35%)' },
];

export const LTR_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Source Sans 3', label: 'Source Sans 3' },
  { value: 'DM Sans', label: 'DM Sans' },
];

export const RTL_FONTS = [
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Readex Pro', label: 'Readex Pro' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Changa', label: 'Changa' },
  { value: 'El Messiri', label: 'El Messiri' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

interface PendingSettings {
  currency: Currency;
  colorTheme: ColorTheme;
  appName: string;
  appDescription: string;
  appLogo: string;
  signatureImage: string;
  stampImage: string;
  signaturePosition: FooterPosition;
  stampPosition: FooterPosition;
  ltrFont: string;
  rtlFont: string;
  buttonShape: ButtonShape;
  currencyDecimals: number;
  paymentGateway: string;
  defaultLanguage: 'en' | 'ar';
}

interface AppSettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencies: Currency[];
  colorTheme: ColorTheme;
  setColorTheme: (t: ColorTheme) => void;
  themes: typeof THEMES;
  appName: string;
  setAppName: (n: string) => void;
  appDescription: string;
  setAppDescription: (d: string) => void;
  appLogo: string;
  setAppLogo: (l: string) => void;
  signatureImage: string;
  setSignatureImage: (s: string) => void;
  stampImage: string;
  setStampImage: (s: string) => void;
  signaturePosition: FooterPosition;
  setSignaturePosition: (p: FooterPosition) => void;
  stampPosition: FooterPosition;
  setStampPosition: (p: FooterPosition) => void;
  ltrFont: string;
  setLtrFont: (f: string) => void;
  rtlFont: string;
  setRtlFont: (f: string) => void;
  buttonShape: ButtonShape;
  setButtonShape: (s: ButtonShape) => void;
  currencyDecimals: number;
  setCurrencyDecimals: (d: number) => void;
  paymentGateway: string;
  setPaymentGateway: (g: string) => void;
  favicon: string;
  setFavicon: (f: string) => void;
  pending: PendingSettings;
  updatePending: (partial: Partial<PendingSettings>) => void;
  saveSettings: () => void;
  hasPendingChanges: boolean;
  discardChanges: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

function loadSaved(): PendingSettings {
  return {
    currency: (() => { const s = localStorage.getItem('app_currency'); return s ? JSON.parse(s) : CURRENCIES[0]; })(),
    colorTheme: (localStorage.getItem('app_color_theme') as ColorTheme) || 'emerald',
    appName: localStorage.getItem('app_name') || 'Islamic Dashboard',
    appDescription: localStorage.getItem('app_description') || 'Islamic Educational Dashboard',
    appLogo: localStorage.getItem('app_logo') || '',
    signatureImage: localStorage.getItem('app_signature_image') || '',
    stampImage: localStorage.getItem('app_stamp_image') || '',
    signaturePosition: (localStorage.getItem('app_signature_position') as FooterPosition) || 'left',
    stampPosition: (localStorage.getItem('app_stamp_position') as FooterPosition) || 'right',
    ltrFont: localStorage.getItem('app_ltr_font') || 'Inter',
    rtlFont: localStorage.getItem('app_rtl_font') || 'Cairo',
    buttonShape: (localStorage.getItem('app_button_shape') as ButtonShape) || 'rounded',
    currencyDecimals: parseInt(localStorage.getItem('app_currency_decimals') || '2', 10),
    paymentGateway: localStorage.getItem('app_payment_gateway') || '',
    defaultLanguage: (localStorage.getItem('app_default_language') as 'en' | 'ar') || 'en',
  };
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saved, setSaved] = useState<PendingSettings>(loadSaved);
  const [pending, setPending] = useState<PendingSettings>(loadSaved);
  const [favicon, setFaviconState] = useState(() => localStorage.getItem('app_favicon') || '');

  // Apply favicon
  useEffect(() => {
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [favicon]);

  const setFavicon = useCallback((url: string) => {
    localStorage.setItem('app_favicon', url);
    setFaviconState(url);
  }, []);

  // Apply theme class to root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-purple', 'theme-desert', 'theme-midnight');
    if (saved.colorTheme !== 'emerald') {
      root.classList.add(`theme-${saved.colorTheme}`);
    }
  }, [saved.colorTheme]);

  // Apply button shape
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('btn-rounded', 'btn-circular', 'btn-square');
    root.classList.add(`btn-${saved.buttonShape}`);
  }, [saved.buttonShape]);

  // Apply fonts
  useEffect(() => {
    document.documentElement.style.setProperty('--font-ltr', `'${saved.ltrFont}', sans-serif`);
    document.documentElement.style.setProperty('--font-rtl', `'${saved.rtlFont}', sans-serif`);
    const families = [saved.ltrFont, saved.rtlFont].map(f => f.replace(/ /g, '+')).join('&family=');
    const linkId = 'dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700&display=swap`;
  }, [saved.ltrFont, saved.rtlFont]);

  const hasPendingChanges = JSON.stringify(saved) !== JSON.stringify(pending);

  const saveSettings = useCallback(() => {
    localStorage.setItem('app_currency', JSON.stringify(pending.currency));
    localStorage.setItem('app_color_theme', pending.colorTheme);
    localStorage.setItem('app_name', pending.appName);
    localStorage.setItem('app_description', pending.appDescription);
    localStorage.setItem('app_logo', pending.appLogo);
    localStorage.setItem('app_signature_image', pending.signatureImage);
    localStorage.setItem('app_stamp_image', pending.stampImage);
    localStorage.setItem('app_signature_position', pending.signaturePosition);
    localStorage.setItem('app_stamp_position', pending.stampPosition);
    localStorage.setItem('app_ltr_font', pending.ltrFont);
    localStorage.setItem('app_rtl_font', pending.rtlFont);
    localStorage.setItem('app_button_shape', pending.buttonShape);
    localStorage.setItem('app_currency_decimals', String(pending.currencyDecimals));
    localStorage.setItem('app_payment_gateway', pending.paymentGateway);
    localStorage.setItem('app_default_language', pending.defaultLanguage);
    setSaved({ ...pending });
  }, [pending]);

  const discardChanges = useCallback(() => {
    setPending({ ...saved });
  }, [saved]);

  const updatePending = useCallback((partial: Partial<PendingSettings>) => {
    setPending(prev => ({ ...prev, ...partial }));
  }, []);

  const setCurrency = useCallback((c: Currency) => { setPending(p => ({ ...p, currency: c })); }, []);
  const setColorTheme = useCallback((t: ColorTheme) => { setPending(p => ({ ...p, colorTheme: t })); }, []);
  const setAppName = useCallback((n: string) => { setPending(p => ({ ...p, appName: n })); }, []);
  const setAppDescription = useCallback((d: string) => { setPending(p => ({ ...p, appDescription: d })); }, []);
  const setAppLogo = useCallback((l: string) => {
    localStorage.setItem('app_logo', l);
    setSaved(s => ({ ...s, appLogo: l }));
    setPending(p => ({ ...p, appLogo: l }));
  }, []);
  const setSignatureImage = useCallback((s: string) => {
    localStorage.setItem('app_signature_image', s);
    setSaved(prev => ({ ...prev, signatureImage: s }));
    setPending(prev => ({ ...prev, signatureImage: s }));
  }, []);
  const setStampImage = useCallback((s: string) => {
    localStorage.setItem('app_stamp_image', s);
    setSaved(prev => ({ ...prev, stampImage: s }));
    setPending(prev => ({ ...prev, stampImage: s }));
  }, []);
  const setSignaturePosition = useCallback((p: FooterPosition) => { setPending(prev => ({ ...prev, signaturePosition: p })); }, []);
  const setStampPosition = useCallback((p: FooterPosition) => { setPending(prev => ({ ...prev, stampPosition: p })); }, []);
  const setLtrFont = useCallback((f: string) => { setPending(p => ({ ...p, ltrFont: f })); }, []);
  const setRtlFont = useCallback((f: string) => { setPending(p => ({ ...p, rtlFont: f })); }, []);
  const setButtonShape = useCallback((s: ButtonShape) => { setPending(p => ({ ...p, buttonShape: s })); }, []);
  const setCurrencyDecimals = useCallback((d: number) => { setPending(p => ({ ...p, currencyDecimals: d })); }, []);
  const setPaymentGateway = useCallback((g: string) => { setPending(p => ({ ...p, paymentGateway: g })); }, []);

  return (
    <AppSettingsContext.Provider value={{
      currency: saved.currency, setCurrency, currencies: CURRENCIES,
      colorTheme: saved.colorTheme, setColorTheme, themes: THEMES,
      appName: saved.appName, setAppName,
      appDescription: saved.appDescription, setAppDescription,
      appLogo: saved.appLogo, setAppLogo,
      signatureImage: saved.signatureImage, setSignatureImage,
      stampImage: saved.stampImage, setStampImage,
      signaturePosition: saved.signaturePosition, setSignaturePosition,
      stampPosition: saved.stampPosition, setStampPosition,
      ltrFont: saved.ltrFont, setLtrFont,
      rtlFont: saved.rtlFont, setRtlFont,
      buttonShape: saved.buttonShape, setButtonShape,
      currencyDecimals: saved.currencyDecimals, setCurrencyDecimals,
      paymentGateway: saved.paymentGateway, setPaymentGateway,
      favicon, setFavicon,
      pending, updatePending, saveSettings, hasPendingChanges, discardChanges,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};
