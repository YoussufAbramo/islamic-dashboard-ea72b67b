import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, BookOpen, X, Languages, Type, Eraser } from 'lucide-react';
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

const QuranQuoteEditor = ({ block, isAr, onChange }: Props) => {
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

  // Debounced search
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
    setSelectedSurah(match.surah.number);
    setAyahFrom(match.numberInSurah);
    setAyahTo(match.numberInSurah);
    applySelection(match.text, match.surah.number, match.surah.name, match.surah.englishName, match.numberInSurah, match.numberInSurah);
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

  return (
    <div className="space-y-3">
      {/* ─── Search ─── */}
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

      {/* ─── Surah + Ayah Selection — single row ─── */}
      <div className="space-y-2">
        {loadingSurahs ? (
          <div className="flex items-center justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] text-muted-foreground">{isAr ? 'السورة' : 'Surah'}</Label>
              <Select value={selectedSurah ? String(selectedSurah) : ''} onValueChange={v => setSelectedSurah(Number(v))}>
                <SelectTrigger className="h-8 text-xs mt-0.5">
                  <SelectValue placeholder={isAr ? 'اختر...' : 'Pick...'} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {surahs.map(s => (
                    <SelectItem key={s.number} value={String(s.number)}>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] w-5 text-end">{s.number}</span>
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-[10px]">({s.englishName})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Button size="sm" className="h-8 px-2.5 text-xs shrink-0" onClick={handleLoadAyahs}>
                  <BookOpen className="h-3 w-3" />
                </Button>
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

      {/* ─── Options Row: Translation + Font ─── */}
      <div className="space-y-2.5">
        {/* Translation toggle */}
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

        {/* Font size */}
        {block.quran_text && (
          <div className="flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={12}
              max={100}
              value={block.quran_font_size || 18}
              onChange={e => onChange({ ...block, quran_font_size: parseInt(e.target.value) })}
              className="flex-1 h-1.5 accent-primary"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-end">{block.quran_font_size || 18}px</span>
          </div>
        )}
      </div>

      {/* ─── Preview ─── */}
      {block.quran_text ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 text-destructive hover:text-destructive gap-1.5"
            onClick={handleClear}
          >
            <Eraser className="h-3 w-3" />
            {isAr ? 'مسح الاختيار' : 'Clear Selection'}
          </Button>
          <div className="p-4 rounded-lg border bg-muted/10 text-center quran-quote-block" dir="rtl">
            <p className="leading-[2.5]" style={{ fontFamily: `'${quranFont}', serif`, fontSize: `${block.quran_font_size || 18}px` }}>
              {block.quran_text}
            </p>
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
