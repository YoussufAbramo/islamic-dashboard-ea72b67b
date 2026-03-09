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
  ltrFont: string;
  rtlFont: string;
  buttonShape: ButtonShape;
  currencyDecimals: number;
  paymentGateway: string;
  paymentGatewayKey: string;
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
  paymentGatewayKey: string;
  setPaymentGatewayKey: (k: string) => void;
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
    appName: localStorage.getItem('app_name') || 'EduDash',
    appDescription: localStorage.getItem('app_description') || 'Islamic Educational Dashboard',
    appLogo: localStorage.getItem('app_logo') || '',
    ltrFont: localStorage.getItem('app_ltr_font') || 'Inter',
    rtlFont: localStorage.getItem('app_rtl_font') || 'Cairo',
    buttonShape: (localStorage.getItem('app_button_shape') as ButtonShape) || 'rounded',
  };
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saved, setSaved] = useState<PendingSettings>(loadSaved);
  const [pending, setPending] = useState<PendingSettings>(loadSaved);

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
    localStorage.setItem('app_ltr_font', pending.ltrFont);
    localStorage.setItem('app_rtl_font', pending.rtlFont);
    localStorage.setItem('app_button_shape', pending.buttonShape);
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
  const setLtrFont = useCallback((f: string) => { setPending(p => ({ ...p, ltrFont: f })); }, []);
  const setRtlFont = useCallback((f: string) => { setPending(p => ({ ...p, rtlFont: f })); }, []);
  const setButtonShape = useCallback((s: ButtonShape) => { setPending(p => ({ ...p, buttonShape: s })); }, []);

  return (
    <AppSettingsContext.Provider value={{
      currency: saved.currency, setCurrency, currencies: CURRENCIES,
      colorTheme: saved.colorTheme, setColorTheme, themes: THEMES,
      appName: saved.appName, setAppName,
      appDescription: saved.appDescription, setAppDescription,
      appLogo: saved.appLogo, setAppLogo,
      ltrFont: saved.ltrFont, setLtrFont,
      rtlFont: saved.rtlFont, setRtlFont,
      buttonShape: saved.buttonShape, setButtonShape,
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
