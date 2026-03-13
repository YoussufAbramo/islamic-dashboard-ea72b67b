import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings, LTR_FONTS, RTL_FONTS, type ButtonShape, type FooterPosition } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Building2, Check, Type, RectangleHorizontal, Circle, Square, Search, Plus, AlignLeft, AlignCenter, AlignRight, Moon, Sun, PanelLeft } from 'lucide-react';
import ImagePickerField from '@/components/media/ImagePickerField';
import { toast } from 'sonner';
import { useRef, useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const AppearanceSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, themes, setAppLogo, appLogo, darkLogo, setDarkLogo, signatureImage, setSignatureImage, stampImage, setStampImage, signaturePosition, stampPosition, setFavicon, favicon } = useAppSettings();
  const isAr = language === 'ar';

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
      {/* Branding — Compact Grid Layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{isAr ? 'العلامة التجارية' : 'Branding'}</CardTitle>
          <CardDescription>{isAr ? 'خصص الشعار والأيقونة والتوقيع' : 'Customize logo, favicon, signature and stamp'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Logos + Favicon — 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: isAr ? 'شعار التطبيق' : 'App Logo', desc: isAr ? 'الوضع الفاتح' : 'Light mode', value: appLogo, onChange: setAppLogo },
              { label: isAr ? 'شعار داكن' : 'Dark Logo', desc: isAr ? 'الوضع الداكن' : 'Dark mode', value: darkLogo, onChange: setDarkLogo },
              { label: isAr ? 'أيقونة الموقع' : 'Favicon', desc: isAr ? 'تبويب المتصفح' : 'Browser tab', value: favicon, onChange: setFavicon },
            ] as const).map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">{item.desc}</p>
                <CompactImagePicker value={item.value} onChange={item.onChange} isAr={isAr} />
              </div>
            ))}
          </div>

          {/* Row 2: Signature + Stamp — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: isAr ? 'صورة التوقيع' : 'Signature', desc: isAr ? 'تذييل الفواتير' : 'Invoice footer', value: signatureImage, onChange: setSignatureImage, posValue: pending.signaturePosition, posKey: 'signaturePosition' as const },
              { label: isAr ? 'صورة الختم' : 'Stamp', desc: isAr ? 'تذييل الفواتير' : 'Invoice footer', value: stampImage, onChange: setStampImage, posValue: pending.stampPosition, posKey: 'stampPosition' as const },
            ] as const).map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">{item.desc}</p>
                <CompactImagePicker value={item.value} onChange={item.onChange} isAr={isAr} />
                {item.value && (
                  <div className="flex gap-0.5 pt-1">
                    {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([pos, Icon]) => (
                      <Button
                        key={pos}
                        variant={item.posValue === pos ? 'default' : 'ghost'}
                        size="sm"
                        className="flex-1 h-6 px-0"
                        onClick={() => updatePending({ [item.posKey]: pos })}
                      >
                        <Icon className="h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />{isAr ? 'سمة الألوان' : 'Color Theme'}</CardTitle>
          <CardDescription>{isAr ? 'اختر نظام ألوان التطبيق' : 'Choose the app color scheme'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
              const isSelected = pending.colorTheme === t.value;
              const colorLabels = isAr
                ? ['الرئيسي', 'التمييز', 'القائمة', 'الخلفية']
                : ['Main', 'Accent', 'Sidebar', 'Surface'];
              return (
                <button
                  key={t.value}
                  onClick={() => updatePending({ colorTheme: t.value })}
                  className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/40'
                  }`}
                >
                  {/* Radio indicator */}
                  <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-primary' : 'border-muted-foreground/40 group-hover:border-muted-foreground/60'
                  }`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>

                  {/* Color palette box */}
                  <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden border border-border/30">
                    {/* Top 3/4 — Main color */}
                    <div className="h-[75%]" style={{ background: t.palette[0] }} />
                    {/* Bottom 1/4 — 3 colors side by side */}
                    <div className="h-[25%] flex">
                      <div className="flex-1" style={{ background: t.palette[1] }} />
                      <div className="flex-1" style={{ background: t.palette[2] }} />
                      <div className="flex-1" style={{ background: t.palette[3] }} />
                    </div>
                  </div>

                  {/* Label + color names */}
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm font-medium block truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {isAr ? t.labelAr : t.label}
                    </span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {t.palette.map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                          <span className="text-[10px] text-muted-foreground">{colorLabels[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isSelected && <Check className="absolute top-3 end-3 h-4 w-4 text-primary" />}
                </button>
              );
            })}
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
