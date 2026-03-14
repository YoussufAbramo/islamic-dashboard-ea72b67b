import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, BookOpen, Hash, X, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSurahList, getSurahAyahs, searchQuran, parseAyahReference,
  getEnglishEditions, getSurahTranslation,
  type SurahMeta, type Ayah, type SearchMatch, type TranslationEdition,
} from '@/lib/quranApi';
import type { ContentBlock } from '@/components/course/LessonBuilder';

interface Props {
  block: ContentBlock;
  isAr: boolean;
  onChange: (block: ContentBlock) => void;
}

type Tab = 'search' | 'surah' | 'ayah';

const QuranQuoteEditor = ({ block, isAr, onChange }: Props) => {
  const [tab, setTab] = useState<Tab>('surah');
  const [quranFont, setQuranFont] = useState(() => {
    try { return localStorage.getItem('quran_font') || 'QPC V2'; } catch { return 'QPC V2'; }
  });

  useEffect(() => {
    const sync = () => { try { setQuranFont(localStorage.getItem('quran_font') || 'QPC V2'); } catch {} };
    window.addEventListener('storage', sync);
    const id = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);

  // Surah picker
  const [selectedSurah, setSelectedSurah] = useState<number>(block.quran_surah_number || 0);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [ayahFrom, setAyahFrom] = useState<number>(block.quran_ayah_from || 1);
  const [ayahTo, setAyahTo] = useState<number>(block.quran_ayah_to || 1);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [allSearchResults, setAllSearchResults] = useState<SearchMatch[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Translation
  const [editions, setEditions] = useState<TranslationEdition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  // Load surahs on mount
  useEffect(() => {
    setLoadingSurahs(true);
    getSurahList().then(setSurahs).catch(() => {}).finally(() => setLoadingSurahs(false));
  }, []);

  // Load editions when translation is enabled
  useEffect(() => {
    if (block.quran_translation_enabled && editions.length === 0) {
      setLoadingEditions(true);
      getEnglishEditions().then(setEditions).catch(() => {}).finally(() => setLoadingEditions(false));
    }
  }, [block.quran_translation_enabled]);

  // Load ayahs when surah changes
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

  // Debounced search — ayat text only
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

  // Fetch translation when quran text is set and translation is enabled
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

  const applySelection = useCallback(async (text: string, surahNum: number, surahName: string, surahNameEn: string, from: number, to: number) => {
    const ref = from === to ? `${surahNum}:${from}` : `${surahNum}:${from}-${to}`;
    let translationText = block.quran_translation_text;
    
    if (block.quran_translation_enabled && block.quran_translation_edition) {
      translationText = await fetchTranslation(surahNum, from, to, block.quran_translation_edition);
    }
    
    onChange({
      ...block,
      quran_text: text,
      quran_surah_number: surahNum,
      quran_surah_name: surahName,
      quran_surah_name_en: surahNameEn,
      quran_ayah_from: from,
      quran_ayah_to: to,
      quran_reference: ref,
      quran_translation_text: translationText,
    });
  }, [block, onChange, fetchTranslation]);

  const handleLoadAyahs = useCallback(() => {
    if (!surahMeta || ayahs.length === 0) return;
    const from = Math.max(1, ayahFrom);
    const to = Math.min(surahMeta.numberOfAyahs, Math.max(from, ayahTo));
    const selected = ayahs.filter(a => a.numberInSurah >= from && a.numberInSurah <= to);
    const text = selected.map(a => a.text).join(' ');
    applySelection(text, surahMeta.number, surahMeta.name, surahMeta.englishName, from, to);
  }, [surahMeta, ayahs, ayahFrom, ayahTo, applySelection]);

  const handleSearchSelect = useCallback((match: SearchMatch) => {
    applySelection(match.text, match.surah.number, match.surah.name, match.surah.englishName, match.numberInSurah, match.numberInSurah);
    setSearchQuery('');
    setAllSearchResults([]);
    setVisibleCount(10);
  }, [applySelection]);

  const handleToggleTranslation = useCallback(async (enabled: boolean) => {
    const updated: Partial<ContentBlock> = {
      quran_translation_enabled: enabled,
    };
    if (!enabled) {
      updated.quran_translation_text = undefined;
    } else if (enabled && block.quran_surah_number && block.quran_ayah_from && block.quran_translation_edition) {
      const text = await fetchTranslation(block.quran_surah_number, block.quran_ayah_from, block.quran_ayah_to || block.quran_ayah_from, block.quran_translation_edition);
      updated.quran_translation_text = text;
    }
    onChange({ ...block, ...updated });
  }, [block, onChange, fetchTranslation]);

  const handleEditionChange = useCallback(async (edition: string) => {
    const updated: Partial<ContentBlock> = {
      quran_translation_edition: edition,
    };
    if (block.quran_surah_number && block.quran_ayah_from) {
      const text = await fetchTranslation(block.quran_surah_number, block.quran_ayah_from, block.quran_ayah_to || block.quran_ayah_from, edition);
      updated.quran_translation_text = text;
    }
    onChange({ ...block, ...updated });
  }, [block, onChange, fetchTranslation]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'search', label: isAr ? 'بحث' : 'Search', icon: Search },
    { key: 'surah', label: isAr ? 'السورة' : 'Surah', icon: BookOpen },
    { key: 'ayah', label: isAr ? 'الآية' : 'Ayah', icon: Hash },
  ];

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Search Tab ─── */}
      {tab === 'search' && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في الآيات بالنص أو المرجع (مثل 2:255)...' : 'Search ayat by text or reference (e.g. 2:255)...'}
              className="ps-8 h-9 text-xs"
              dir="auto"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute end-1 top-1 h-7 w-7" onClick={() => { setSearchQuery(''); setAllSearchResults([]); setVisibleCount(10); }}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && allSearchResults.length > 0 && (
            <div
              ref={scrollRef}
              className="max-h-64 overflow-y-auto space-y-1 rounded-md"
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
                  className="w-full text-start p-2.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{m.surah.englishName}</Badge>
                    <span className="text-[10px] text-muted-foreground">{m.surah.number}:{m.numberInSurah}</span>
                  </div>
                  <p className="text-sm leading-[2]" dir="rtl" style={{ fontFamily: `'${quranFont}', serif` }}>{m.text}</p>
                </button>
              ))}
              {visibleCount < allSearchResults.length && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground ms-1.5">
                    {visibleCount} / {allSearchResults.length}
                  </span>
                </div>
              )}
            </div>
          )}
          {!searching && searchQuery.length >= 2 && allSearchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
          )}
        </div>
      )}

      {/* ─── Surah Tab ─── */}
      {tab === 'surah' && (
        <div className="space-y-2">
          <Label className="text-xs">{isAr ? 'اختر السورة' : 'Select Surah'}</Label>
          {loadingSurahs ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            <Select value={selectedSurah ? String(selectedSurah) : ''} onValueChange={v => setSelectedSurah(Number(v))}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={isAr ? 'اختر سورة...' : 'Pick a Surah...'} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-60">
                  {surahs.map(s => (
                    <SelectItem key={s.number} value={String(s.number)}>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] w-5 text-end">{s.number}</span>
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-[10px]">({s.englishName})</span>
                      </span>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          )}
          {selectedSurah > 0 && surahMeta && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{surahMeta.numberOfAyahs} {isAr ? 'آية' : 'Ayahs'}</Badge>
              <Badge variant="outline" className="text-[10px]">{surahMeta.revelationType === 'Meccan' ? (isAr ? 'مكية' : 'Meccan') : (isAr ? 'مدنية' : 'Medinan')}</Badge>
            </div>
          )}
        </div>
      )}

      {/* ─── Ayah Tab ─── */}
      {tab === 'ayah' && (
        <div className="space-y-3">
          {!selectedSurah ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {isAr ? 'يرجى اختيار السورة أولاً من تبويب "السورة"' : 'Please select a Surah first from the "Surah" tab'}
            </p>
          ) : loadingAyahs ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{isAr ? 'من آية' : 'From Ayah'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={surahMeta?.numberOfAyahs || 1}
                    value={ayahFrom}
                    onChange={e => setAyahFrom(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? 'إلى آية' : 'To Ayah'}</Label>
                  <Input
                    type="number"
                    min={ayahFrom}
                    max={surahMeta?.numberOfAyahs || 1}
                    value={ayahTo}
                    onChange={e => setAyahTo(Math.max(ayahFrom, parseInt(e.target.value) || ayahFrom))}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <Button size="sm" className="w-full text-xs h-8" onClick={handleLoadAyahs} disabled={!selectedSurah}>
                <BookOpen className="h-3 w-3 me-1.5" />
                {isAr ? 'تحميل الآيات' : 'Load Ayahs'}
              </Button>
            </>
          )}
        </div>
      )}

      <Separator />

      {/* ─── English Translation ─── */}
      <div className="space-y-2">
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
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">{isAr ? 'اختر المترجم' : 'Select Translator'}</Label>
            {loadingEditions ? (
              <div className="flex items-center justify-center py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /></div>
            ) : (
              <Select value={block.quran_translation_edition || ''} onValueChange={handleEditionChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={isAr ? 'اختر المترجم...' : 'Pick a translator...'} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="max-h-60">
                    {editions.map(e => (
                      <SelectItem key={e.identifier} value={e.identifier}>
                        <span className="text-xs">{e.englishName}</span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* ─── Font Size ─── */}
      {block.quran_text && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{isAr ? 'حجم الخط' : 'Font Size'}</Label>
            <span className="text-[10px] font-mono text-muted-foreground">{block.quran_font_size || 18}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={12}
              max={100}
              value={block.quran_font_size || 18}
              onChange={e => onChange({ ...block, quran_font_size: parseInt(e.target.value) })}
              className="flex-1 h-1.5 accent-primary"
            />
          </div>
        </div>
      )}

      <Separator />

      {/* ─── Preview ─── */}
      {block.quran_text ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{isAr ? 'معاينة' : 'Preview'}</Label>
            {block.quran_reference && (
              <Badge variant="secondary" className="text-[9px]">
                {block.quran_surah_name_en} ({block.quran_reference})
              </Badge>
            )}
          </div>
          <div className="p-4 rounded-lg border bg-muted/10 text-center quran-quote-block" dir="rtl">
            <p className="leading-[2.5]" style={{ fontFamily: `'${quranFont}', serif`, fontSize: `${block.quran_font_size || 18}px` }}>{block.quran_text}</p>
            {block.quran_translation_enabled && block.quran_translation_text && (
              <div className="mt-3 pt-3 border-t border-border/30" dir="ltr">
                <p className="text-sm leading-relaxed text-muted-foreground italic">{block.quran_translation_text}</p>
              </div>
            )}
            {block.quran_surah_name && (
              <p className="text-xs text-muted-foreground mt-3">
                {block.quran_surah_name} {block.quran_surah_name_en && `— ${block.quran_surah_name_en}`} {block.quran_reference && `(${block.quran_reference})`}
              </p>
            )}
          </div>
          {loadingTranslation && (
            <div className="flex items-center justify-center gap-1.5 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{isAr ? 'جاري تحميل الترجمة...' : 'Loading translation...'}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 text-destructive hover:text-destructive"
            onClick={() => onChange({ ...block, quran_text: undefined, quran_surah_number: undefined, quran_surah_name: undefined, quran_surah_name_en: undefined, quran_ayah_from: undefined, quran_ayah_to: undefined, quran_reference: undefined, quran_translation_text: undefined })}
          >
            {isAr ? 'مسح الاختيار' : 'Clear Selection'}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2 italic">
          {isAr ? 'اختر آية باستخدام أحد التبويبات أعلاه' : 'Select a verse using the tabs above'}
        </p>
      )}
    </div>
  );
};

export default QuranQuoteEditor;