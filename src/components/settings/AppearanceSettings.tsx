import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings, LTR_FONTS, RTL_FONTS, type ButtonShape, type FooterPosition } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Building2, Upload, Check, Type, RectangleHorizontal, Circle, Square, Search, Plus, AlignLeft, AlignCenter, AlignRight, Image, Moon, Sun, PanelLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRef, useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const AppearanceSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, themes, setAppLogo, appLogo, darkLogo, setDarkLogo, signatureImage, setSignatureImage, stampImage, setStampImage, signaturePosition, stampPosition, setFavicon, favicon } = useAppSettings();
  const isAr = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const [ltrSearch, setLtrSearch] = useState('');
  const [rtlSearch, setRtlSearch] = useState('');
  const [ltrOpen, setLtrOpen] = useState(false);
  const [rtlOpen, setRtlOpen] = useState(false);
  const [customFontDialog, setCustomFontDialog] = useState<'ltr' | 'rtl' | null>(null);
  const [customFontName, setCustomFontName] = useState('');
  const [customFonts, setCustomFonts] = useState<{ ltr: string[]; rtl: string[] }>(() => {
    const saved = localStorage.getItem('app_custom_fonts');
    return saved ? JSON.parse(saved) : { ltr: [], rtl: [] };
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `branding/logo-${Date.now()}.${ext}`;
    const { uploadAndGetSignedUrl } = await import('@/lib/storage');
    const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(path, file);
    if (uploadErr) { toast.error(uploadErr); return; }
    setAppLogo(signedUrl);
    toast.success(isAr ? 'تم رفع الشعار' : 'Logo uploaded');
  };

  const handleDarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `branding/dark-logo-${Date.now()}.${ext}`;
    const { uploadAndGetSignedUrl } = await import('@/lib/storage');
    const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(path, file);
    if (uploadErr) { toast.error(uploadErr); return; }
    setDarkLogo(signedUrl);
    toast.success(isAr ? 'تم رفع شعار الوضع الداكن' : 'Dark mode logo uploaded');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void, prefix: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `branding/${prefix}-${Date.now()}.${ext}`;
    const { uploadAndGetSignedUrl } = await import('@/lib/storage');
    const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(path, file);
    if (uploadErr) { toast.error(uploadErr); return; }
    setter(signedUrl);
    toast.success(isAr ? 'تم الرفع بنجاح' : 'Uploaded successfully');
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `branding/favicon-${Date.now()}.${ext}`;
    const { uploadAndGetSignedUrl } = await import('@/lib/storage');
    const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(path, file);
    if (uploadErr) { toast.error(uploadErr); return; }
    setFavicon(signedUrl);
    toast.success(isAr ? 'تم رفع الأيقونة' : 'Favicon uploaded');
  };

  const shapeOptions: { value: ButtonShape; label: string; labelAr: string; icon: any }[] = [
    { value: 'rounded', label: 'Rounded', labelAr: 'مستدير', icon: RectangleHorizontal },
    { value: 'circular', label: 'Circular', labelAr: 'دائري', icon: Circle },
    { value: 'square', label: 'Square', labelAr: 'مربع', icon: Square },
  ];

  const allLtrFonts = useMemo(() => [
    ...LTR_FONTS,
    ...customFonts.ltr.map(f => ({ value: f, label: f })),
  ], [customFonts.ltr]);

  const allRtlFonts = useMemo(() => [
    ...RTL_FONTS,
    ...customFonts.rtl.map(f => ({ value: f, label: f })),
  ], [customFonts.rtl]);

  const filteredLtrFonts = useMemo(() =>
    allLtrFonts.filter(f => f.label.toLowerCase().includes(ltrSearch.toLowerCase())),
    [allLtrFonts, ltrSearch]
  );

  const filteredRtlFonts = useMemo(() =>
    allRtlFonts.filter(f => f.label.toLowerCase().includes(rtlSearch.toLowerCase())),
    [allRtlFonts, rtlSearch]
  );

  const addCustomFont = () => {
    if (!customFontName.trim() || !customFontDialog) return;
    const type = customFontDialog;
    const updated = {
      ...customFonts,
      [type]: [...customFonts[type], customFontName.trim()],
    };
    setCustomFonts(updated);
    localStorage.setItem('app_custom_fonts', JSON.stringify(updated));
    updatePending({ [type === 'ltr' ? 'ltrFont' : 'rtlFont']: customFontName.trim() });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${customFontName.trim().replace(/ /g, '+')}:wght@400;600&display=swap`;
    document.head.appendChild(link);
    setCustomFontName('');
    setCustomFontDialog(null);
    toast.success(isAr ? 'تمت إضافة الخط' : 'Font added');
  };

  const FontPicker = ({
    fonts, search, setSearch, open, setOpen, selected, onSelect, type,
  }: {
    fonts: { value: string; label: string }[];
    search: string; setSearch: (s: string) => void;
    open: boolean; setOpen: (o: boolean) => void;
    selected: string; onSelect: (v: string) => void; type: 'ltr' | 'rtl';
  }) => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-sm font-normal">
          <span style={{ fontFamily: `'${selected}', sans-serif` }}>{selected}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'ابحث عن خط...' : 'Search fonts...'} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-8 h-8 text-sm" />
          </div>
        </div>
        <ScrollArea className="h-[240px]">
          <div className="p-1">
            {fonts.map((f) => (
              <button key={f.value} onClick={() => { onSelect(f.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selected === f.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                {selected === f.value && <Check className="h-4 w-4" />}
              </button>
            ))}
            {fonts.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">{isAr ? 'لا توجد نتائج' : 'No results'}</p>}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { setOpen(false); setCustomFontDialog(type); }}>
            <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة خط مخصص' : 'Add custom font'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{isAr ? 'العلامة التجارية' : 'Branding'}</CardTitle>
          <CardDescription>{isAr ? 'خصص الشعار والأيقونة والتوقيع' : 'Customize logo, favicon, signature and stamp'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App Logo */}
          <div className="space-y-2">
            <Label>{isAr ? 'شعار التطبيق' : 'App Logo'}</Label>
            <p className="text-xs text-muted-foreground">{isAr ? 'الشعار الرئيسي للوضع الفاتح' : 'Main logo for light mode'}</p>
            <div className="flex items-center gap-4">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-14 max-w-[200px] rounded-lg object-contain border border-border" />
              ) : (
                <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>{isAr ? 'رفع شعار' : 'Upload Logo'}</Button>
                {appLogo && <Button variant="ghost" size="sm" onClick={() => setAppLogo('')}>{isAr ? 'إزالة' : 'Remove'}</Button>}
              </div>
            </div>
          </div>

          {/* Dark Mode Logo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              {isAr ? 'شعار الوضع الداكن (أبيض)' : 'Dark Mode Logo (White)'}
            </Label>
            <p className="text-xs text-muted-foreground">{isAr ? 'شعار بديل يظهر على الخلفيات الداكنة (القائمة الجانبية الداكنة والوضع المظلم)' : 'Alternative logo shown on dark backgrounds (dark sidebar and dark mode)'}</p>
            <div className="flex items-center gap-4">
              {darkLogo ? (
                <div className="h-14 max-w-[200px] rounded-lg border border-border bg-sidebar p-2">
                  <img src={darkLogo} alt="Dark Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-sidebar">
                  <Moon className="h-5 w-5 text-sidebar-foreground/40" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={darkLogoRef} type="file" accept="image/*" className="hidden" onChange={handleDarkLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => darkLogoRef.current?.click()}>{isAr ? 'رفع شعار داكن' : 'Upload Dark Logo'}</Button>
                {darkLogo && <Button variant="ghost" size="sm" onClick={() => setDarkLogo('')}>{isAr ? 'إزالة' : 'Remove'}</Button>}
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <Label>{isAr ? 'أيقونة الموقع (Favicon)' : 'Favicon'}</Label>
            <p className="text-xs text-muted-foreground">{isAr ? 'الأيقونة التي تظهر في تبويب المتصفح' : 'The icon shown in the browser tab'}</p>
            <div className="flex items-center gap-4">
              {favicon ? (
                <img src={favicon} alt="Favicon" className="h-10 w-10 rounded object-contain border border-border bg-background p-0.5" />
              ) : (
                <div className="h-10 w-10 rounded border-2 border-dashed border-border flex items-center justify-center">
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
                <Button variant="outline" size="sm" onClick={() => faviconRef.current?.click()}>{isAr ? 'رفع أيقونة' : 'Upload Favicon'}</Button>
                {favicon && <Button variant="ghost" size="sm" onClick={() => setFavicon('')}>{isAr ? 'إزالة' : 'Remove'}</Button>}
              </div>
            </div>
          </div>

          {/* Signature Image */}
          <div className="space-y-2">
            <Label>{isAr ? 'صورة التوقيع' : 'Signature Image'}</Label>
            <p className="text-xs text-muted-foreground">{isAr ? 'تظهر في تذييل الفواتير' : 'Displayed in invoice footer'}</p>
            <div className="flex items-center gap-4">
              {signatureImage ? (
                <img src={signatureImage} alt="Signature" className="h-14 w-28 rounded-lg object-contain border border-border bg-background p-1" />
              ) : (
                <div className="h-14 w-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={signatureRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setSignatureImage, 'signature')} />
                <Button variant="outline" size="sm" onClick={() => signatureRef.current?.click()}>{isAr ? 'رفع توقيع' : 'Upload Signature'}</Button>
                {signatureImage && <Button variant="ghost" size="sm" onClick={() => setSignatureImage('')}>{isAr ? 'إزالة' : 'Remove'}</Button>}
              </div>
            </div>
          </div>

          {/* Stamp Image */}
          <div className="space-y-2">
            <Label>{isAr ? 'صورة الختم' : 'Stamp Image'}</Label>
            <p className="text-xs text-muted-foreground">{isAr ? 'تظهر في تذييل الفواتير' : 'Displayed in invoice footer'}</p>
            <div className="flex items-center gap-4">
              {stampImage ? (
                <img src={stampImage} alt="Stamp" className="h-14 w-14 rounded-lg object-contain border border-border bg-background p-1" />
              ) : (
                <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setStampImage, 'stamp')} />
                <Button variant="outline" size="sm" onClick={() => stampRef.current?.click()}>{isAr ? 'رفع ختم' : 'Upload Stamp'}</Button>
                {stampImage && <Button variant="ghost" size="sm" onClick={() => setStampImage('')}>{isAr ? 'إزالة' : 'Remove'}</Button>}
              </div>
            </div>
          </div>

          {/* Position Controls */}
          {(signatureImage || stampImage) && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Label>{isAr ? 'موضع التوقيع والختم' : 'Signature & Stamp Position'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signatureImage && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{isAr ? 'موضع التوقيع' : 'Signature Position'}</p>
                    <div className="flex gap-1">
                      {([['left', AlignLeft, 'Left', 'يسار'], ['center', AlignCenter, 'Center', 'وسط'], ['right', AlignRight, 'Right', 'يمين']] as const).map(([pos, Icon, label, labelAr]) => (
                        <Button key={pos} variant={pending.signaturePosition === pos ? 'default' : 'outline'} size="sm" className="flex-1 gap-1" onClick={() => updatePending({ signaturePosition: pos })}>
                          <Icon className="h-3 w-3" /><span className="text-xs">{isAr ? labelAr : label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {stampImage && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{isAr ? 'موضع الختم' : 'Stamp Position'}</p>
                    <div className="flex gap-1">
                      {([['left', AlignLeft, 'Left', 'يسار'], ['center', AlignCenter, 'Center', 'وسط'], ['right', AlignRight, 'Right', 'يمين']] as const).map(([pos, Icon, label, labelAr]) => (
                        <Button key={pos} variant={pending.stampPosition === pos ? 'default' : 'outline'} size="sm" className="flex-1 gap-1" onClick={() => updatePending({ stampPosition: pos })}>
                          <Icon className="h-3 w-3" /><span className="text-xs">{isAr ? labelAr : label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />{isAr ? 'سمة الألوان' : 'Color Theme'}</CardTitle>
          <CardDescription>{isAr ? 'اختر نظام ألوان التطبيق' : 'Choose the app color scheme'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {themes.map((t) => (
              <button key={t.value} onClick={() => updatePending({ colorTheme: t.value })} className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${pending.colorTheme === t.value ? 'border-primary shadow-md scale-[1.02]' : 'border-border hover:border-muted-foreground/30'}`}>
                <div className="w-10 h-10 rounded-lg" style={{ background: t.color }} />
                <span className="text-xs font-medium">{isAr ? t.labelAr : t.label}</span>
                {pending.colorTheme === t.value && <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PanelLeft className="h-5 w-5 text-primary" />{isAr ? 'وضع القائمة الرئيسية' : 'Main Menu Mode'}</CardTitle>
          <CardDescription>{isAr ? 'اختر المظهر الفاتح أو الداكن للقائمة الرئيسية' : 'Choose light or dark appearance for the main menu'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {([
              { value: 'dark' as const, icon: Moon, label: 'Dark', labelAr: 'داكن' },
              { value: 'light' as const, icon: Sun, label: 'Light', labelAr: 'فاتح' },
            ]).map((opt) => {
              const Icon = opt.icon;
              const isSelected = pending.sidebarMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updatePending({ sidebarMode: opt.value })}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${isSelected ? 'border-primary shadow-md scale-[1.02]' : 'border-border hover:border-muted-foreground/30'}`}
                >
                  <div className={`w-full h-20 rounded-lg flex items-center justify-center ${opt.value === 'dark' ? 'bg-sidebar text-sidebar-foreground' : 'bg-muted text-foreground'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-6 w-6" />
                      <div className={`flex gap-1 ${opt.value === 'dark' ? 'opacity-60' : 'opacity-40'}`}>
                        <div className="w-6 h-1 rounded-sm bg-current" />
                        <div className="w-4 h-1 rounded-sm bg-current" />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{isAr ? opt.labelAr : opt.label}</span>
                  {isSelected && <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Button Shape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><RectangleHorizontal className="h-5 w-5 text-primary" />{isAr ? 'شكل الأزرار' : 'Button Shape'}</CardTitle>
          <CardDescription>{isAr ? 'اختر شكل الأزرار في التطبيق' : 'Choose the button shape style'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {shapeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button key={opt.value} onClick={() => updatePending({ buttonShape: opt.value })} className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${pending.buttonShape === opt.value ? 'border-primary shadow-md scale-[1.02]' : 'border-border hover:border-muted-foreground/30'}`}>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs font-medium">{isAr ? opt.labelAr : opt.label}</span>
                  {pending.buttonShape === opt.value && <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-3">
            <Button size="sm">Preview</Button>
            <Button size="sm" variant="outline">Preview</Button>
            <Button size="sm" variant="secondary">Preview</Button>
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary" />{isAr ? 'الخطوط' : 'Fonts'}</CardTitle>
          <CardDescription>{isAr ? 'اختر خطوط التطبيق للغة العربية والإنجليزية' : 'Choose app fonts for LTR and RTL languages'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? 'خط LTR (الإنجليزية)' : 'LTR Font (English)'}</Label>
              <FontPicker fonts={filteredLtrFonts} search={ltrSearch} setSearch={setLtrSearch} open={ltrOpen} setOpen={setLtrOpen} selected={pending.ltrFont} onSelect={(v) => updatePending({ ltrFont: v })} type="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'خط RTL (العربية)' : 'RTL Font (Arabic)'}</Label>
              <FontPicker fonts={filteredRtlFonts} search={rtlSearch} setSearch={setRtlSearch} open={rtlOpen} setOpen={setRtlOpen} selected={pending.rtlFont} onSelect={(v) => updatePending({ rtlFont: v })} type="rtl" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'إذا كنت ترغب في معاينة الخطوط أو الحصول على المزيد، ' : 'If you want to preview the fonts or get more, '}
            <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              {isAr ? 'اذهب إلى Google Fonts' : 'Go to Google Fonts'}
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Custom Font Dialog */}
      <Dialog open={!!customFontDialog} onOpenChange={(open) => !open && setCustomFontDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إضافة خط مخصص' : 'Add Custom Font'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{isAr ? 'أدخل اسم خط Google Fonts بالضبط' : 'Enter the exact Google Fonts name'}</p>
            <Input value={customFontName} onChange={(e) => setCustomFontName(e.target.value)} placeholder={isAr ? 'مثال: Amiri' : 'e.g. Playfair Display'} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomFontDialog(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addCustomFont} disabled={!customFontName.trim()}>{isAr ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppearanceSettings;
