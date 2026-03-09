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

const THEMES: { value: ColorTheme; label: string; labelAr: string; color: string }[] = [
  { value: 'emerald', label: 'Emerald Gold', labelAr: 'الزمرد الذهبي', color: 'hsl(160 45% 28%)' },
  { value: 'ocean', label: 'Ocean Blue', labelAr: 'الأزرق المحيطي', color: 'hsl(210 65% 38%)' },
  { value: 'purple', label: 'Royal Purple', labelAr: 'البنفسجي الملكي', color: 'hsl(270 50% 40%)' },
  { value: 'desert', label: 'Desert Sand', labelAr: 'رمال الصحراء', color: 'hsl(25 60% 42%)' },
  { value: 'midnight', label: 'Midnight', labelAr: 'منتصف الليل', color: 'hsl(220 55% 35%)' },
];

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
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('app_currency');
    return saved ? JSON.parse(saved) : CURRENCIES[0];
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    return (localStorage.getItem('app_color_theme') as ColorTheme) || 'emerald';
  });

  const [appName, setAppNameState] = useState(() => localStorage.getItem('app_name') || 'EduDash');
  const [appDescription, setAppDescriptionState] = useState(() => localStorage.getItem('app_description') || 'Islamic Educational Dashboard');
  const [appLogo, setAppLogoState] = useState(() => localStorage.getItem('app_logo') || '');

  // Apply theme class to root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-purple', 'theme-desert', 'theme-midnight');
    if (colorTheme !== 'emerald') {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('app_currency', JSON.stringify(c));
  }, []);

  const setColorTheme = useCallback((t: ColorTheme) => {
    setColorThemeState(t);
    localStorage.setItem('app_color_theme', t);
  }, []);

  const setAppName = useCallback((n: string) => {
    setAppNameState(n);
    localStorage.setItem('app_name', n);
  }, []);

  const setAppDescription = useCallback((d: string) => {
    setAppDescriptionState(d);
    localStorage.setItem('app_description', d);
  }, []);

  const setAppLogo = useCallback((l: string) => {
    setAppLogoState(l);
    localStorage.setItem('app_logo', l);
  }, []);

  return (
    <AppSettingsContext.Provider value={{
      currency, setCurrency, currencies: CURRENCIES,
      colorTheme, setColorTheme, themes: THEMES,
      appName, setAppName,
      appDescription, setAppDescription,
      appLogo, setAppLogo,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
};
