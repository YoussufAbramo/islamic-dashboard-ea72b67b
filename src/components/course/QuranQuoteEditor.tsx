import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, BookOpen, X, Languages, Type, Eraser, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSurahList, getSurahAyahs, searchQuran, parseAyahReference,
  getEnglishEditions, getSurahTranslation, stripTashkeel, toArabicNumber,
  stripBesmellah, hasBesmellah,
  type SurahMeta, type Ayah, type SearchMatch, type TranslationEdition,
} from '@/lib/quranApi';
import type { ContentBlock } from '@/components/course/LessonBuilder';

interface Props {
  block: ContentBlock;
  isAr: boolean;
  onChange: (block: ContentBlock) => void;
}

const QuranQuoteEditor = ({ block, isAr, onChange }: Props) => {
  const [quranFont, setQuranFont] = useState(() => {
    try { return localStorage.getItem('quran_font') || 'Indopak Nastaleeq'; } catch { return 'Indopak Nastaleeq'; }
  });

  useEffect(() => {
    const sync = () => { try { setQuranFont(localStorage.getItem('quran_font') || 'Indopak Nastaleeq'); } catch {} };
    window.addEventListener('storage', sync);
    const id = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number>(block.quran_surah_number || 0);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [ayahFrom, setAyahFrom] = useState<number>(block.quran_ayah_from || 1);
  const [ayahTo, setAyahTo] = useState<number>(block.quran_ayah_to || 1);

  // Surah combobox
  const [surahPopoverOpen, setSurahPopoverOpen] = useState(false);

  // Search (ayat only)
  const [searchQuery, setSearchQuery] = useState('');
  const [allSearchResults, setAllSearchResults] = useState<SearchMatch[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Translation
  const [editions, setEditions] = useState<TranslationEdition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  useEffect(() => {
    setLoadingSurahs(true);
    getSurahList().then(setSurahs).catch(() => {}).finally(() => setLoadingSurahs(false));
  }, []);

  useEffect(() => {
    if (block.quran_translation_enabled && editions.length === 0) {
      setLoadingEditions(true);
      getEnglishEditions().then(setEditions).catch(() => {}).finally(() => setLoadingEditions(false));
    }
  }, [block.quran_translation_enabled]);

  useEffect(() => {
    if (!selectedSurah) { setAyahs([]); return; }
    setLoadingAyahs(true);
    getSurahAyahs(selectedSurah).then((data) => {
      setAyahs(data);
      if (selectedSurah !== block.quran_surah_number) {
        setAyahFrom(1);
        setAyahTo(1);
      }
    }).catch(() => setAyahs([])).finally(() => setLoadingAyahs(false));
  }, [selectedSurah]);

  // Debounced search — ayat only (reference parsing + text search)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery || searchQuery.trim().length < 2) { setAllSearchResults([]); setVisibleCount(10); return; }

    const ref = parseAyahReference(searchQuery);
    if (ref) {
      setSearching(true);
      getSurahAyahs(ref.surah).then(allAyahs => {
        const matches = allAyahs
          .filter(a => a.numberInSurah >= ref.from && a.numberInSurah <= ref.to)
          .map(a => ({ number: a.number, text: a.text, numberInSurah: a.numberInSurah, surah: a.surah }));
        setAllSearchResults(matches);
        setVisibleCount(10);
      }).catch(() => setAllSearchResults([])).finally(() => setSearching(false));
      return;
    }

    searchTimer.current = setTimeout(() => {
      setSearching(true);
      searchQuran(searchQuery).then(r => { setAllSearchResults(r); setVisibleCount(10); }).catch(() => setAllSearchResults([])).finally(() => setSearching(false));
    }, 500);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const surahMeta = useMemo(() => surahs.find(s => s.number === selectedSurah), [surahs, selectedSurah]);

  const fetchTranslation = useCallback(async (surahNum: number, from: number, to: number, edition: string) => {
    if (!edition) return '';
    setLoadingTranslation(true);
    try {
      const translationAyahs = await getSurahTranslation(surahNum, edition);
      const selected = translationAyahs.filter(a => a.numberInSurah >= from && a.numberInSurah <= to);
      return selected.map(a => a.text).join(' ');
    } catch {
      return '';
    } finally {
      setLoadingTranslation(false);
    }
  }, []);

  // Build display text from selected ayahs
  const buildQuranText = useCallback((selectedAyahs: Ayah[], bMode: string, fromAyah: number, showNumbers: boolean, tashkeelEnabled: boolean) => {
    let processedAyahs = selectedAyahs.map(a => {
      let text = a.text;
      // Strip besmellah from ayah 1 if besmellah mode is not 'inline'
      if (a.numberInSurah === 1 && fromAyah === 1 && bMode !== 'inline' && hasBesmellah(text)) {
        text = stripBesmellah(text);
      }
      // Strip tashkeel if disabled
      if (!tashkeelEnabled) {
        text = stripTashkeel(text);
      }
      // Add ayah number marker
      if (showNumbers) {
        text = `${text} ﴿${toArabicNumber(a.numberInSurah)}﴾`;
      }
      return text;
    });
    return processedAyahs.join(' ');
  }, []);

  const applySelection = useCallback(async (selectedAyahs: Ayah[], surahNum: number, surahName: string, surahNameEn: string, from: number, to: number) => {
    const ref = from === to ? `${surahNum}:${from}` : `${surahNum}:${from}-${to}`;
    const bMode = block.quran_besmellah_mode || (block.quran_besmellah_enabled === false ? 'none' : 'inline');
    const showNumbers = block.quran_show_ayah_numbers !== false; // default true
    const tashkeelEnabled = block.quran_tashkeel_enabled !== false; // default true
    const text = buildQuranText(selectedAyahs, bMode, from, showNumbers, tashkeelEnabled);

    let translationText = block.quran_translation_text;
    if (block.quran_translation_enabled && block.quran_translation_edition) {
      translationText = await fetchTranslation(surahNum, from, to, block.quran_translation_edition);
    }
    onChange({
      ...block,
      quran_text: text,
      quran_raw_ayahs: selectedAyahs.map(a => ({ numberInSurah: a.numberInSurah, text: a.text })),
      quran_surah_number: surahNum,
      quran_surah_name: surahName,
      quran_surah_name_en: surahNameEn,
      quran_ayah_from: from,
      quran_ayah_to: to,
      quran_reference: ref,
      quran_translation_text: translationText,
    });
  }, [block, onChange, fetchTranslation, buildQuranText]);

  // Rebuild text when tashkeel/numbers/besmellah settings change
  const rebuildText = useCallback(() => {
    const rawAyahs = block.quran_raw_ayahs;
    if (!rawAyahs || rawAyahs.length === 0) return;
    const bMode = block.quran_besmellah_mode || (block.quran_besmellah_enabled === false ? 'none' : 'inline');
    const showNumbers = block.quran_show_ayah_numbers !== false;
    const tashkeelEnabled = block.quran_tashkeel_enabled !== false;
    const text = buildQuranText(
      rawAyahs.map((a: any) => ({ ...a, number: 0, surah: {} as any, juz: 0, page: 0 })),
      bMode, block.quran_ayah_from || 1, showNumbers, tashkeelEnabled
    );
    onChange({ ...block, quran_text: text });
  }, [block, onChange, buildQuranText]);

  const handleLoadAyahs = useCallback(() => {
    if (!surahMeta || ayahs.length === 0) return;
    const from = Math.max(1, ayahFrom);
    const to = Math.min(surahMeta.numberOfAyahs, Math.max(from, ayahTo));
    const selected = ayahs.filter(a => a.numberInSurah >= from && a.numberInSurah <= to);
    applySelection(selected, surahMeta.number, surahMeta.name, surahMeta.englishName, from, to);
  }, [surahMeta, ayahs, ayahFrom, ayahTo, applySelection]);

  const handleSearchSelect = useCallback((match: SearchMatch) => {
    setSelectedSurah(match.surah.number);
    setAyahFrom(match.numberInSurah);
    setAyahTo(match.numberInSurah);
    const fakeAyah = [{ number: match.number, numberInSurah: match.numberInSurah, text: match.text, surah: match.surah, juz: 0, page: 0 }];
    applySelection(fakeAyah, match.surah.number, match.surah.name, match.surah.englishName, match.numberInSurah, match.numberInSurah);
    setSearchQuery('');
    setAllSearchResults([]);
    setVisibleCount(10);
  }, [applySelection]);

  const handleToggleTranslation = useCallback(async (enabled: boolean) => {
    const updated: Partial<ContentBlock> = { quran_translation_enabled: enabled };
    if (!enabled) {
      updated.quran_translation_text = undefined;
    } else if (enabled && block.quran_surah_number && block.quran_ayah_from && block.quran_translation_edition) {
      const text = await fetchTranslation(block.quran_surah_number, block.quran_ayah_from, block.quran_ayah_to || block.quran_ayah_from, block.quran_translation_edition);
      updated.quran_translation_text = text;
    }
    onChange({ ...block, ...updated });
  }, [block, onChange, fetchTranslation]);

  const handleEditionChange = useCallback(async (edition: string) => {
    const updated: Partial<ContentBlock> = { quran_translation_edition: edition };
    if (block.quran_surah_number && block.quran_ayah_from) {
      const text = await fetchTranslation(block.quran_surah_number, block.quran_ayah_from, block.quran_ayah_to || block.quran_ayah_from, edition);
      updated.quran_translation_text = text;
    }
    onChange({ ...block, ...updated });
  }, [block, onChange, fetchTranslation]);

  const handleClear = () => {
    onChange({ ...block, quran_text: undefined, quran_surah_number: undefined, quran_surah_name: undefined, quran_surah_name_en: undefined, quran_ayah_from: undefined, quran_ayah_to: undefined, quran_reference: undefined, quran_translation_text: undefined });
    setSelectedSurah(0);
    setAyahFrom(1);
    setAyahTo(1);
  };

  const showSearchResults = searchQuery.length >= 2 && (searching || allSearchResults.length > 0 || searchFocused);

  // Besmellah mode (migrate old boolean to new mode)
  const besmellahMode = block.quran_besmellah_mode || (block.quran_besmellah_enabled === false ? 'none' : 'inline');
  const surahNameMode = block.quran_surah_name_mode || 'surat_name';

  return (
    <div className="space-y-3">
      {/* ─── Search (ayat only) ─── */}
      <div className="relative">
        <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder={isAr ? 'ابحث في الآيات بالنص أو المرجع (2:255)...' : 'Search ayat by text or reference (2:255)...'}
          className="ps-8 h-9 text-xs"
          dir="auto"
        />
        {searchQuery && (
          <Button variant="ghost" size="icon" className="absolute end-1 top-1 h-7 w-7" onClick={() => { setSearchQuery(''); setAllSearchResults([]); setVisibleCount(10); }}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search results dropdown */}
      {showSearchResults && (
        <div className="relative">
          {searching ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : allSearchResults.length > 0 ? (
            <div
              ref={scrollRef}
              className="max-h-52 overflow-y-auto space-y-1 rounded-lg border bg-background p-1"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
                  setVisibleCount(prev => Math.min(prev + 10, allSearchResults.length));
                }
              }}
            >
              {allSearchResults.slice(0, visibleCount).map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleSearchSelect(m)}
                  className="w-full text-start p-2 rounded-md hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{m.surah.englishName}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{m.surah.number}:{m.numberInSurah}</span>
                  </div>
                  <p className="text-sm leading-[2]" dir="rtl" style={{ fontFamily: `'${quranFont}', serif` }}>{m.text}</p>
                </button>
              ))}
              {visibleCount < allSearchResults.length && (
                <div className="flex items-center justify-center py-1.5 gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{visibleCount} / {allSearchResults.length}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">{isAr ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
          )}
        </div>
      )}

      {/* ─── Surah + Ayah Selection ─── */}
      <div className="space-y-2">
        {loadingSurahs ? (
          <div className="flex items-center justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <div className="flex items-end gap-1.5">
            {/* Searchable Surah Combobox */}
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground">{isAr ? 'السورة' : 'Surah'}</Label>
              <Popover open={surahPopoverOpen} onOpenChange={setSurahPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={surahPopoverOpen}
                    className="w-full h-8 text-xs mt-0.5 justify-between font-normal"
                  >
                    {selectedSurah ? (
                      <span className="truncate">
                        <span className="text-muted-foreground">{selectedSurah}.</span>{' '}
                        {surahs.find(s => s.number === selectedSurah)?.name}{' '}
                        <span className="text-muted-foreground text-[10px]">({surahs.find(s => s.number === selectedSurah)?.englishName})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{isAr ? 'اختر سورة...' : 'Pick a surah...'}</span>
                    )}
                    <ChevronsUpDown className="ms-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={isAr ? 'ابحث بالاسم...' : 'Search surah name...'} className="h-8 text-xs" />
                    <CommandList className="max-h-60">
                      <CommandEmpty className="text-xs py-3 text-center">{isAr ? 'لا نتائج' : 'No surah found'}</CommandEmpty>
                      <CommandGroup>
                        {surahs.map(s => (
                          <CommandItem
                            key={s.number}
                            value={`${s.number} ${s.name} ${s.englishName}`}
                            onSelect={() => { setSelectedSurah(s.number); setSurahPopoverOpen(false); }}
                            className="text-xs"
                          >
                            <Check className={cn("me-1.5 h-3 w-3", selectedSurah === s.number ? "opacity-100" : "opacity-0")} />
                            <span className="text-muted-foreground w-5 text-end me-1.5">{s.number}</span>
                            <span>{s.name}</span>
                            <span className="text-muted-foreground text-[10px] ms-1">({s.englishName})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedSurah > 0 && surahMeta && !loadingAyahs && (
              <>
                <div className="w-16 shrink-0">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? 'من' : 'From'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={surahMeta.numberOfAyahs}
                    value={ayahFrom}
                    onChange={e => setAyahFrom(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 text-xs mt-0.5"
                  />
                </div>
                <div className="w-16 shrink-0">
                  <Label className="text-[10px] text-muted-foreground">{isAr ? 'إلى' : 'To'}</Label>
                  <Input
                    type="number"
                    min={ayahFrom}
                    max={surahMeta.numberOfAyahs}
                    value={ayahTo}
                    onChange={e => setAyahTo(Math.max(ayahFrom, parseInt(e.target.value) || ayahFrom))}
                    className="h-8 text-xs mt-0.5"
                  />
                </div>
                <Button size="sm" className="h-8 px-2.5 text-xs shrink-0 gap-1" onClick={handleLoadAyahs}>
                  <BookOpen className="h-3 w-3" />
                  {isAr ? 'تحميل' : 'Load'}
                </Button>
                {block.quran_text && (
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs shrink-0 gap-1 text-destructive hover:text-destructive" onClick={handleClear}>
                    <Eraser className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        {selectedSurah > 0 && surahMeta && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{surahMeta.numberOfAyahs} {isAr ? 'آية' : 'Ayahs'}</Badge>
            <Badge variant="outline" className="text-[10px]">{surahMeta.revelationType === 'Meccan' ? (isAr ? 'مكية' : 'Meccan') : (isAr ? 'مدنية' : 'Medinan')}</Badge>
            {loadingAyahs && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        )}
      </div>

      <Separator />

      {/* ─── Besmellah Mode ─── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs">{isAr ? 'البسملة' : 'Besmellah'}</Label>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            { value: 'none' as const, label: isAr ? 'بدون' : 'None' },
            { value: 'inline' as const, label: isAr ? 'مدمجة' : 'Inline' },
            { value: 'single_line' as const, label: isAr ? 'سطر منفصل' : 'Single Line' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({ ...block, quran_besmellah_mode: opt.value, quran_besmellah_enabled: opt.value !== 'none' });
                // Trigger rebuild after state settles
                setTimeout(() => rebuildText(), 50);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
                besmellahMode === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {besmellahMode === 'single_line' && (
          <div className="flex items-center gap-2">
            <Type className="h-3 w-3 text-muted-foreground shrink-0" />
            <Slider
              min={12}
              max={60}
              step={1}
              value={[block.quran_besmellah_font_size || 24]}
              onValueChange={([v]) => onChange({ ...block, quran_besmellah_font_size: v })}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-end">{block.quran_besmellah_font_size || 24}px</span>
          </div>
        )}
      </div>

      <Separator />

      {/* ─── Surah Name Mode ─── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs">{isAr ? 'اسم السورة' : 'Surah Name'}</Label>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            { value: 'none' as const, label: isAr ? 'بدون' : 'None' },
            { value: 'name' as const, label: isAr ? 'الاسم فقط' : '{Name}' },
            { value: 'surat_name' as const, label: isAr ? 'سورة + الاسم' : 'Surah {Name}' },
            { value: 'nameplate' as const, label: isAr ? 'لوحة' : 'Nameplate' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...block, quran_surah_name_mode: opt.value })}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
                surahNameMode === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Tashkeel & Ayah Numbers ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isAr ? 'التشكيل' : 'Tashkeel'}</Label>
          <Switch
            checked={block.quran_tashkeel_enabled !== false}
            onCheckedChange={(v) => {
              onChange({ ...block, quran_tashkeel_enabled: v });
              setTimeout(() => rebuildText(), 50);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isAr ? 'أرقام الآيات' : 'Ayah Numbers'}</Label>
          <Switch
            checked={block.quran_show_ayah_numbers !== false}
            onCheckedChange={(v) => {
              onChange({ ...block, quran_show_ayah_numbers: v });
              setTimeout(() => rebuildText(), 50);
            }}
          />
        </div>
      </div>

      <Separator />

      {/* ─── Translation toggle ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">{isAr ? 'الترجمة الإنجليزية' : 'English Translation'}</Label>
          </div>
          <Switch
            checked={!!block.quran_translation_enabled}
            onCheckedChange={handleToggleTranslation}
          />
        </div>

        {block.quran_translation_enabled && (
          loadingEditions ? (
            <div className="flex items-center justify-center py-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /></div>
          ) : (
            <Select value={block.quran_translation_edition || ''} onValueChange={handleEditionChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={isAr ? 'اختر المترجم...' : 'Pick a translator...'} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {editions.map(e => (
                  <SelectItem key={e.identifier} value={e.identifier}>
                    <span className="text-xs">{e.englishName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* Font size slider */}
        {block.quran_text && (
          <div className="flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Slider
              min={12}
              max={100}
              step={1}
              value={[block.quran_font_size || 18]}
              onValueChange={([v]) => onChange({ ...block, quran_font_size: v })}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-end">{block.quran_font_size || 18}px</span>
          </div>
        )}
      </div>

      {/* ─── Preview ─── */}
      {block.quran_text ? (
        <>
          <div className="p-4 rounded-lg border bg-muted/10 text-center quran-quote-block" dir="rtl">
            {/* Surah Name before ayat */}
            {surahNameMode === 'name' && block.quran_surah_number && (
              <p className="mb-3" style={{ fontFamily: "'Surah Name V4', serif", fontSize: `${(block.quran_font_size || 18) + 4}px` }}>
                {`surah${String(block.quran_surah_number).padStart(3, '0')}`}
              </p>
            )}
            {surahNameMode === 'surat_name' && block.quran_surah_number && (
              <p className="mb-3" style={{ fontFamily: "'Surah Name V2', serif", fontSize: `${(block.quran_font_size || 18) + 4}px` }}>
                {`surah${String(block.quran_surah_number).padStart(3, '0')}`}
              </p>
            )}
            {surahNameMode === 'nameplate' && block.quran_surah_number && (
              <p className="mb-3" style={{ fontFamily: "'Surah Header', serif", fontSize: `${(block.quran_font_size || 18) + 12}px` }}>
                {String(block.quran_surah_number).padStart(3, '0')}
              </p>
            )}
            {/* Besmellah */}
            {besmellahMode === 'single_line' && (
              <p className="mb-3" style={{ fontFamily: "'Besmellah', serif", fontSize: `${block.quran_besmellah_font_size || 24}px` }}>﷽</p>
            )}
            <p className="leading-[2.5]" style={{ fontFamily: `'${quranFont}', serif`, fontSize: `${block.quran_font_size || 18}px` }}>
              {block.quran_text}
            </p>
            {block.quran_translation_enabled && block.quran_translation_text && (
              <div className="mt-3 pt-3 border-t border-border/30" dir="ltr">
                <p className="text-sm leading-relaxed text-muted-foreground italic">{block.quran_translation_text}</p>
              </div>
            )}
            {/* Reference line */}
            {block.quran_reference && (
              <p className="text-xs text-muted-foreground mt-3">
                {surahNameMode !== 'none' && surahNameMode !== 'nameplate' && block.quran_surah_name_en && (
                  <span className="mx-1">{surahNameMode === 'surat_name' ? `Surah ${block.quran_surah_name_en}` : block.quran_surah_name_en}</span>
                )}
                <span>({block.quran_reference})</span>
              </p>
            )}
          </div>
          {loadingTranslation && (
            <div className="flex items-center justify-center gap-1.5 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{isAr ? 'جاري تحميل الترجمة...' : 'Loading translation...'}</span>
            </div>
          )}
        </>
      ) : (
        <div className="py-4 text-center rounded-lg border border-dashed border-border/50">
          <BookOpen className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {isAr ? 'ابحث عن آية أو اختر سورة ثم حدد الآيات' : 'Search for a verse or pick a surah then select ayahs'}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuranQuoteEditor;
