import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_LOGO = '/system/logos/logo.png';
const DEFAULT_DARK_LOGO = '/system/logos/logo-dark.png';
const DEFAULT_FAVICON = '/system/logos/favicon.png';
const DEFAULT_APP_NAME = 'Quran E-Learning Platform - CodeCom.dev';
const DEFAULT_APP_DESCRIPTION = 'An interactive Quran learning platform offering courses in Tajweed, memorization, and Quran reading with qualified teachers. Study from anywhere and follow a structured path to improve your recitation and understanding.';
const DEFAULT_LTR_FONT = 'Montserrat';
const DEFAULT_RTL_FONT = 'Noto Kufi Arabic';
const DEFAULT_ACTIVE_GATEWAYS = { paypal: true, paymob: true };
const DEFAULT_SIGNATURE = '/system/signature/signature.png';
const DEFAULT_STAMP = '/system/stamp/stamp.jpg';

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

export type ColorTheme = 'emerald' | 'ocean' | 'purple' | 'desert' | 'midnight' | 'rose' | 'teal' | 'amber' | 'slate' | 'crimson';
export type ButtonShape = 'rounded' | 'circular' | 'square';
export type FooterPosition = 'left' | 'center' | 'right';
export type SidebarMode = 'dark' | 'light';
export type TimeFormat = '12h' | '24h';

const THEMES: { value: ColorTheme; label: string; labelAr: string; color: string; palette: string[] }[] = [
  { value: 'emerald', label: 'Emerald Gold', labelAr: 'الزمرد الذهبي', color: 'hsl(160 45% 28%)', palette: ['hsl(160 45% 28%)', 'hsl(160 20% 93%)', 'hsl(160 30% 12%)', 'hsl(38 50% 92%)'] },
  { value: 'ocean', label: 'Ocean Blue', labelAr: 'الأزرق المحيطي', color: 'hsl(210 65% 38%)', palette: ['hsl(210 65% 38%)', 'hsl(210 20% 93%)', 'hsl(210 40% 12%)', 'hsl(210 20% 96%)'] },
  { value: 'purple', label: 'Royal Purple', labelAr: 'البنفسجي الملكي', color: 'hsl(270 50% 40%)', palette: ['hsl(270 50% 40%)', 'hsl(270 18% 93%)', 'hsl(270 35% 12%)', 'hsl(270 15% 96%)'] },
  { value: 'desert', label: 'Desert Sand', labelAr: 'رمال الصحراء', color: 'hsl(25 60% 42%)', palette: ['hsl(25 60% 42%)', 'hsl(25 20% 93%)', 'hsl(25 40% 12%)', 'hsl(35 20% 96%)'] },
  { value: 'midnight', label: 'Midnight', labelAr: 'منتصف الليل', color: 'hsl(220 55% 35%)', palette: ['hsl(220 55% 35%)', 'hsl(220 18% 93%)', 'hsl(220 40% 10%)', 'hsl(220 15% 96%)'] },
  { value: 'rose', label: 'Rose Garden', labelAr: 'حديقة الورد', color: 'hsl(345 55% 45%)', palette: ['hsl(345 55% 45%)', 'hsl(345 18% 93%)', 'hsl(345 35% 12%)', 'hsl(345 15% 96%)'] },
  { value: 'teal', label: 'Teal Breeze', labelAr: 'نسيم أزرق مخضر', color: 'hsl(180 50% 35%)', palette: ['hsl(180 50% 35%)', 'hsl(180 18% 93%)', 'hsl(180 40% 10%)', 'hsl(180 15% 96%)'] },
  { value: 'amber', label: 'Amber Glow', labelAr: 'توهج العنبر', color: 'hsl(40 75% 45%)', palette: ['hsl(40 75% 45%)', 'hsl(40 22% 93%)', 'hsl(30 40% 12%)', 'hsl(40 20% 96%)'] },
  { value: 'slate', label: 'Slate Steel', labelAr: 'الرمادي الفولاذي', color: 'hsl(215 20% 40%)', palette: ['hsl(215 20% 40%)', 'hsl(215 12% 93%)', 'hsl(215 18% 12%)', 'hsl(215 10% 96%)'] },
  { value: 'crimson', label: 'Crimson Fire', labelAr: 'النار القرمزية', color: 'hsl(0 65% 42%)', palette: ['hsl(0 65% 42%)', 'hsl(0 18% 93%)', 'hsl(0 40% 12%)', 'hsl(0 15% 96%)'] },
];

export const LTR_FONTS = [
  { value: 'Inter', label: 'Inter' }, { value: 'Roboto', label: 'Roboto' }, { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' }, { value: 'Lato', label: 'Lato' }, { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Nunito', label: 'Nunito' }, { value: 'Raleway', label: 'Raleway' }, { value: 'Source Sans 3', label: 'Source Sans 3' },
  { value: 'DM Sans', label: 'DM Sans' },
];

export const RTL_FONTS = [
  { value: 'Cairo', label: 'Cairo' }, { value: 'Tajawal', label: 'Tajawal' }, { value: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic' },
  { value: 'Almarai', label: 'Almarai' }, { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Readex Pro', label: 'Readex Pro' }, { value: 'Rubik', label: 'Rubik' }, { value: 'Changa', label: 'Changa' },
  { value: 'El Messiri', label: 'El Messiri' }, { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

export interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
  telegram: string;
  whatsapp: string;
}

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  facebook: '', twitter: '', instagram: '', youtube: '',
  linkedin: '', tiktok: '', telegram: '', whatsapp: '',
};

interface PendingSettings {
  currency: Currency;
  colorTheme: ColorTheme;
  appName: string;
  appDescription: string;
  appLogo: string;
  darkLogo: string;
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
  defaultTimezone: string;
  sidebarMode: SidebarMode;
  timeFormat: TimeFormat;
  developerMode: boolean;
  websiteMode: boolean;
  socialLinks: SocialLinks;
  teacherBadges: boolean;
  studentBadges: boolean;
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
  darkLogo: string;
  setDarkLogo: (l: string) => void;
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
  defaultTimezone: string;
  setDefaultTimezone: (tz: string) => void;
  sidebarMode: SidebarMode;
  setSidebarMode: (m: SidebarMode) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (f: TimeFormat) => void;
  developerMode: boolean;
  setDeveloperMode: (d: boolean) => void;
  websiteMode: boolean;
  setWebsiteMode: (w: boolean) => void;
  teacherBadges: boolean;
  setTeacherBadges: (b: boolean) => void;
  studentBadges: boolean;
  setStudentBadges: (b: boolean) => void;
  pending: PendingSettings;
  updatePending: (partial: Partial<PendingSettings>) => void;
  saveSettings: () => void;
  hasPendingChanges: boolean;
  discardChanges: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

/** Build default settings object */
function buildDefaults(): PendingSettings {
  return {
    currency: CURRENCIES[0],
    colorTheme: 'emerald',
    appName: DEFAULT_APP_NAME,
    appDescription: DEFAULT_APP_DESCRIPTION,
    appLogo: DEFAULT_LOGO,
    darkLogo: DEFAULT_DARK_LOGO,
    signatureImage: DEFAULT_SIGNATURE,
    stampImage: DEFAULT_STAMP,
    signaturePosition: 'left',
    stampPosition: 'right',
    ltrFont: DEFAULT_LTR_FONT,
    rtlFont: DEFAULT_RTL_FONT,
    buttonShape: 'rounded',
    currencyDecimals: 2,
    paymentGateway: 'paypal',
    defaultLanguage: 'en',
    defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sidebarMode: 'dark',
    timeFormat: '12h',
    developerMode: true,
    websiteMode: true,
    socialLinks: { ...DEFAULT_SOCIAL_LINKS },
    teacherBadges: true,
    studentBadges: true,
  };
}

/** Merge DB JSON over defaults */
function mergeFromDb(dbJson: Record<string, any>): PendingSettings {
  const d = buildDefaults();
  if (!dbJson || typeof dbJson !== 'object') return d;

  return {
    currency: dbJson.currency ?? d.currency,
    colorTheme: dbJson.colorTheme ?? d.colorTheme,
    appName: dbJson.appName ?? d.appName,
    appDescription: dbJson.appDescription ?? d.appDescription,
    appLogo: dbJson.appLogo ?? d.appLogo,
    darkLogo: dbJson.darkLogo ?? d.darkLogo,
    signatureImage: dbJson.signatureImage ?? d.signatureImage,
    stampImage: dbJson.stampImage ?? d.stampImage,
    signaturePosition: dbJson.signaturePosition ?? d.signaturePosition,
    stampPosition: dbJson.stampPosition ?? d.stampPosition,
    ltrFont: dbJson.ltrFont ?? d.ltrFont,
    rtlFont: dbJson.rtlFont ?? d.rtlFont,
    buttonShape: dbJson.buttonShape ?? d.buttonShape,
    currencyDecimals: dbJson.currencyDecimals ?? d.currencyDecimals,
    paymentGateway: dbJson.paymentGateway ?? d.paymentGateway,
    defaultLanguage: dbJson.defaultLanguage ?? d.defaultLanguage,
    defaultTimezone: dbJson.defaultTimezone ?? d.defaultTimezone,
    sidebarMode: dbJson.sidebarMode ?? d.sidebarMode,
    timeFormat: dbJson.timeFormat ?? d.timeFormat,
    developerMode: dbJson.developerMode ?? d.developerMode,
    websiteMode: dbJson.websiteMode ?? d.websiteMode,
    socialLinks: dbJson.socialLinks ? { ...DEFAULT_SOCIAL_LINKS, ...dbJson.socialLinks } : d.socialLinks,
    teacherBadges: dbJson.teacherBadges ?? d.teacherBadges,
    studentBadges: dbJson.studentBadges ?? d.studentBadges,
  };
}

/** Load from localStorage cache (fast startup) */
function loadCached(): PendingSettings {
  try {
    const cached = localStorage.getItem('app_settings_cache');
    if (cached) return mergeFromDb(JSON.parse(cached));
  } catch { /* ignore */ }
  return buildDefaults();
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saved, setSaved] = useState<PendingSettings>(loadCached);
  const [pending, setPending] = useState<PendingSettings>(loadCached);
  const [favicon, setFaviconState] = useState(() => {
    try {
      const cached = localStorage.getItem('app_settings_cache');
      if (cached) { const p = JSON.parse(cached); return p.favicon || DEFAULT_FAVICON; }
    } catch { /* ignore */ }
    return DEFAULT_FAVICON;
  });
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);
  const dbLoaded = useRef(false);

  // Load settings from Supabase on mount
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('id, settings')
          .limit(1)
          .single();

        if (error) {
          console.warn('Could not load app settings from DB, using cached/defaults:', error.message);
          return;
        }

        if (data) {
          setSettingsRowId(data.id);
          const dbSettings = data.settings as Record<string, any>;
          const merged = mergeFromDb(dbSettings);
          const dbFavicon = (dbSettings as any)?.favicon || DEFAULT_FAVICON;

          // Cache in localStorage for fast subsequent loads
          localStorage.setItem('app_settings_cache', JSON.stringify({ ...dbSettings }));

          setSaved(merged);
          setPending(merged);
          setFaviconState(dbFavicon);
          dbLoaded.current = true;
        }
      } catch (err) {
        console.warn('Failed to load app settings from DB:', err);
      }
    };

    loadFromDb();
  }, []);

  // Migrate: if we have old localStorage settings but DB is empty, push them to DB
  useEffect(() => {
    if (!settingsRowId || dbLoaded.current) return;

    // Check if old localStorage keys exist (from pre-DB era)
    const oldName = localStorage.getItem('app_name');
    if (!oldName) return;

    // Old settings exist — migrate them to DB
    const migrateToDb = async () => {
      const settingsJson: Record<string, any> = {};
      // Gather all old localStorage settings
      try { const s = localStorage.getItem('app_currency'); if (s) settingsJson.currency = JSON.parse(s); } catch {}
      const strKeys: [string, string][] = [
        ['app_color_theme', 'colorTheme'], ['app_name', 'appName'], ['app_description', 'appDescription'],
        ['app_logo', 'appLogo'], ['app_dark_logo', 'darkLogo'], ['app_signature_image', 'signatureImage'],
        ['app_stamp_image', 'stampImage'], ['app_signature_position', 'signaturePosition'],
        ['app_stamp_position', 'stampPosition'], ['app_ltr_font', 'ltrFont'], ['app_rtl_font', 'rtlFont'],
        ['app_button_shape', 'buttonShape'], ['app_payment_gateway', 'paymentGateway'],
        ['app_default_language', 'defaultLanguage'], ['app_default_timezone', 'defaultTimezone'],
        ['app_sidebar_mode', 'sidebarMode'], ['app_time_format', 'timeFormat'], ['app_favicon', 'favicon'],
      ];
      strKeys.forEach(([lsKey, jsonKey]) => {
        const v = localStorage.getItem(lsKey);
        if (v) settingsJson[jsonKey] = v;
      });
      const numV = localStorage.getItem('app_currency_decimals');
      if (numV) settingsJson.currencyDecimals = parseInt(numV, 10);
      const boolKeys: [string, string][] = [
        ['app_developer_mode', 'developerMode'], ['app_website_mode', 'websiteMode'],
        ['app_teacher_badges', 'teacherBadges'], ['app_student_badges', 'studentBadges'],
      ];
      boolKeys.forEach(([lsKey, jsonKey]) => {
        const v = localStorage.getItem(lsKey);
        if (v !== null) settingsJson[jsonKey] = v !== 'false';
      });
      try { const s = localStorage.getItem('app_social_links'); if (s) settingsJson.socialLinks = JSON.parse(s); } catch {}

      if (Object.keys(settingsJson).length > 0) {
        await supabase
          .from('app_settings')
          .update({ settings: settingsJson, updated_at: new Date().toISOString() })
          .eq('id', settingsRowId);

        // Clean up old localStorage keys
        const oldKeys = [
          'app_currency', 'app_color_theme', 'app_name', 'app_description', 'app_logo', 'app_dark_logo',
          'app_signature_image', 'app_stamp_image', 'app_signature_position', 'app_stamp_position',
          'app_ltr_font', 'app_rtl_font', 'app_button_shape', 'app_currency_decimals', 'app_payment_gateway',
          'app_default_language', 'app_default_timezone', 'app_favicon', 'app_active_gateways',
          'app_sidebar_mode', 'app_time_format', 'app_developer_mode', 'app_website_mode',
          'app_social_links', 'app_teacher_badges', 'app_student_badges', 'app_settings_version',
        ];
        oldKeys.forEach(k => localStorage.removeItem(k));

        // Update cache
        localStorage.setItem('app_settings_cache', JSON.stringify(settingsJson));
      }
    };

    migrateToDb();
  }, [settingsRowId]);

  useEffect(() => {
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = favicon;
    }
  }, [favicon]);

  const setFavicon = useCallback((url: string) => { setFaviconState(url); }, []);

  // Apply appearance changes from PENDING for instant preview
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-purple', 'theme-desert', 'theme-midnight', 'theme-rose', 'theme-teal', 'theme-amber', 'theme-slate', 'theme-crimson');
    if (pending.colorTheme !== 'emerald') root.classList.add(`theme-${pending.colorTheme}`);
  }, [pending.colorTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('btn-rounded', 'btn-circular', 'btn-square');
    root.classList.add(`btn-${pending.buttonShape}`);
  }, [pending.buttonShape]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-ltr', `'${pending.ltrFont}', sans-serif`);
    document.documentElement.style.setProperty('--font-rtl', `'${pending.rtlFont}', sans-serif`);
    const families = [pending.ltrFont, pending.rtlFont].map(f => f.replace(/ /g, '+')).join('&family=');
    const linkId = 'dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) { link = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700&display=swap`;
  }, [pending.ltrFont, pending.rtlFont]);

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-mode', pending.sidebarMode);
  }, [pending.sidebarMode]);

  const hasPendingChanges = JSON.stringify(saved) !== JSON.stringify(pending);

  const saveSettings = useCallback(async () => {
    // Build the full settings JSON to persist
    const settingsJson: Record<string, any> = {
      currency: pending.currency,
      colorTheme: pending.colorTheme,
      appName: pending.appName,
      appDescription: pending.appDescription,
      appLogo: pending.appLogo,
      darkLogo: pending.darkLogo,
      signatureImage: pending.signatureImage,
      stampImage: pending.stampImage,
      signaturePosition: pending.signaturePosition,
      stampPosition: pending.stampPosition,
      ltrFont: pending.ltrFont,
      rtlFont: pending.rtlFont,
      buttonShape: pending.buttonShape,
      currencyDecimals: pending.currencyDecimals,
      paymentGateway: pending.paymentGateway,
      defaultLanguage: pending.defaultLanguage,
      defaultTimezone: pending.defaultTimezone,
      sidebarMode: pending.sidebarMode,
      timeFormat: pending.timeFormat,
      developerMode: pending.developerMode,
      websiteMode: pending.websiteMode,
      socialLinks: pending.socialLinks,
      teacherBadges: pending.teacherBadges,
      studentBadges: pending.studentBadges,
      favicon,
    };

    // Save to Supabase
    if (settingsRowId) {
      const { error } = await supabase
        .from('app_settings')
        .update({
          settings: settingsJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settingsRowId);

      if (error) {
        console.error('Failed to save settings to DB:', error.message);
        // Still update local state so UI stays consistent
      }
    }

    // Update localStorage cache
    localStorage.setItem('app_settings_cache', JSON.stringify(settingsJson));

    setSaved({ ...pending });
  }, [pending, favicon, settingsRowId]);

  const discardChanges = useCallback(() => {
    setPending({ ...saved });
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-purple', 'theme-desert', 'theme-midnight', 'theme-rose', 'theme-teal', 'theme-amber', 'theme-slate', 'theme-crimson');
    if (saved.colorTheme !== 'emerald') root.classList.add(`theme-${saved.colorTheme}`);
    root.classList.remove('btn-rounded', 'btn-circular', 'btn-square');
    root.classList.add(`btn-${saved.buttonShape}`);
    document.documentElement.style.setProperty('--font-ltr', `'${saved.ltrFont}', sans-serif`);
    document.documentElement.style.setProperty('--font-rtl', `'${saved.rtlFont}', sans-serif`);
    document.documentElement.setAttribute('data-sidebar-mode', saved.sidebarMode);
  }, [saved]);

  const updatePending = useCallback((partial: Partial<PendingSettings>) => { setPending(prev => ({ ...prev, ...partial })); }, []);

  const setCurrency = useCallback((c: Currency) => { setPending(p => ({ ...p, currency: c })); }, []);
  const setColorTheme = useCallback((t: ColorTheme) => { setPending(p => ({ ...p, colorTheme: t })); }, []);
  const setAppName = useCallback((n: string) => { setPending(p => ({ ...p, appName: n })); }, []);
  const setAppDescription = useCallback((d: string) => { setPending(p => ({ ...p, appDescription: d })); }, []);
  const setAppLogo = useCallback((l: string) => { setPending(p => ({ ...p, appLogo: l })); }, []);
  const setDarkLogo = useCallback((l: string) => { setPending(p => ({ ...p, darkLogo: l })); }, []);
  const setSignatureImage = useCallback((s: string) => { setPending(prev => ({ ...prev, signatureImage: s })); }, []);
  const setStampImage = useCallback((s: string) => { setPending(prev => ({ ...prev, stampImage: s })); }, []);
  const setSignaturePosition = useCallback((p: FooterPosition) => { setPending(prev => ({ ...prev, signaturePosition: p })); }, []);
  const setStampPosition = useCallback((p: FooterPosition) => { setPending(prev => ({ ...prev, stampPosition: p })); }, []);
  const setLtrFont = useCallback((f: string) => { setPending(p => ({ ...p, ltrFont: f })); }, []);
  const setRtlFont = useCallback((f: string) => { setPending(p => ({ ...p, rtlFont: f })); }, []);
  const setButtonShape = useCallback((s: ButtonShape) => { setPending(p => ({ ...p, buttonShape: s })); }, []);
  const setCurrencyDecimals = useCallback((d: number) => { setPending(p => ({ ...p, currencyDecimals: d })); }, []);
  const setPaymentGateway = useCallback((g: string) => { setPending(p => ({ ...p, paymentGateway: g })); }, []);
  const setDefaultTimezone = useCallback((tz: string) => { setPending(p => ({ ...p, defaultTimezone: tz })); }, []);
  const setSidebarMode = useCallback((m: SidebarMode) => { setPending(p => ({ ...p, sidebarMode: m })); }, []);
  const setTimeFormat = useCallback((f: TimeFormat) => { setPending(p => ({ ...p, timeFormat: f })); }, []);
  const setDeveloperMode = useCallback((d: boolean) => { setPending(p => ({ ...p, developerMode: d })); }, []);
  const setWebsiteMode = useCallback((w: boolean) => { setPending(p => ({ ...p, websiteMode: w })); }, []);
  const setTeacherBadges = useCallback((b: boolean) => { setPending(p => ({ ...p, teacherBadges: b })); }, []);
  const setStudentBadges = useCallback((b: boolean) => { setPending(p => ({ ...p, studentBadges: b })); }, []);

  return (
    <AppSettingsContext.Provider value={{
      currency: saved.currency, setCurrency, currencies: CURRENCIES,
      colorTheme: saved.colorTheme, setColorTheme, themes: THEMES,
      appName: saved.appName, setAppName,
      appDescription: saved.appDescription, setAppDescription,
      appLogo: saved.appLogo, setAppLogo,
      darkLogo: saved.darkLogo, setDarkLogo,
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
      defaultTimezone: saved.defaultTimezone, setDefaultTimezone,
      sidebarMode: saved.sidebarMode, setSidebarMode,
      timeFormat: saved.timeFormat, setTimeFormat,
      developerMode: saved.developerMode, setDeveloperMode,
      websiteMode: saved.websiteMode, setWebsiteMode,
      teacherBadges: saved.teacherBadges, setTeacherBadges,
      studentBadges: saved.studentBadges, setStudentBadges,
      pending, updatePending, saveSettings, hasPendingChanges, discardChanges,
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
