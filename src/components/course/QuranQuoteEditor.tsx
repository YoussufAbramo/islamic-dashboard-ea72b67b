import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, BookOpen, Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSurahList, getSurahAyahs, searchQuran, parseAyahReference,
  type SurahMeta, type Ayah, type SearchMatch,
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
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load surahs on mount
  useEffect(() => {
    setLoadingSurahs(true);
    getSurahList().then(setSurahs).catch(() => {}).finally(() => setLoadingSurahs(false));
  }, []);

  // Load ayahs when surah changes
  useEffect(() => {
    if (!selectedSurah) { setAyahs([]); return; }
    setLoadingAyahs(true);
    getSurahAyahs(selectedSurah).then((data) => {
      setAyahs(data);
      // Reset range when surah changes (unless it's initial load with existing data)
      if (selectedSurah !== block.quran_surah_number) {
        setAyahFrom(1);
        setAyahTo(1);
      }
    }).catch(() => setAyahs([])).finally(() => setLoadingAyahs(false));
  }, [selectedSurah]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery || searchQuery.trim().length < 2) { setSearchResults([]); return; }

    // Check if it's a reference like "2:255"
    const ref = parseAyahReference(searchQuery);
    if (ref) {
      setSearching(true);
      getSurahAyahs(ref.surah).then(allAyahs => {
        const matches = allAyahs
          .filter(a => a.numberInSurah >= ref.from && a.numberInSurah <= ref.to)
          .map(a => ({ number: a.number, text: a.text, numberInSurah: a.numberInSurah, surah: a.surah }));
        setSearchResults(matches);
      }).catch(() => setSearchResults([])).finally(() => setSearching(false));
      return;
    }

    searchTimer.current = setTimeout(() => {
      setSearching(true);
      searchQuran(searchQuery).then(setSearchResults).catch(() => setSearchResults([])).finally(() => setSearching(false));
    }, 500);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const surahMeta = useMemo(() => surahs.find(s => s.number === selectedSurah), [surahs, selectedSurah]);

  const applySelection = useCallback((text: string, surahNum: number, surahName: string, surahNameEn: string, from: number, to: number) => {
    const ref = from === to ? `${surahNum}:${from}` : `${surahNum}:${from}-${to}`;
    onChange({
      ...block,
      quran_text: text,
      quran_surah_number: surahNum,
      quran_surah_name: surahName,
      quran_surah_name_en: surahNameEn,
      quran_ayah_from: from,
      quran_ayah_to: to,
      quran_reference: ref,
    });
  }, [block, onChange]);

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
    setSearchResults([]);
  }, [applySelection]);

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
              placeholder={isAr ? 'ابحث بالنص، اسم السورة، أو المرجع (مثل 2:255)...' : 'Search by text, Surah name, or reference (e.g. 2:255)...'}
              className="ps-8 h-9 text-xs"
              dir="auto"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute end-1 top-1 h-7 w-7" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && searchResults.length > 0 && (
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {searchResults.slice(0, 20).map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchSelect(m)}
                    className="w-full text-start p-2.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{m.surah.englishName}</Badge>
                      <span className="text-[10px] text-muted-foreground">{m.surah.number}:{m.numberInSurah}</span>
                    </div>
                    <p className="text-sm leading-[2]" dir="rtl" style={{ fontFamily: "'QPC V2', serif" }}>{m.text}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
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
            <p className="text-lg leading-[2.5]" style={{ fontFamily: "'QPC V2', serif" }}>{block.quran_text}</p>
            {block.quran_surah_name && (
              <p className="text-xs text-muted-foreground mt-3">
                {block.quran_surah_name} {block.quran_surah_name_en && `— ${block.quran_surah_name_en}`} {block.quran_reference && `(${block.quran_reference})`}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 text-destructive hover:text-destructive"
            onClick={() => onChange({ ...block, quran_text: undefined, quran_surah_number: undefined, quran_surah_name: undefined, quran_surah_name_en: undefined, quran_ayah_from: undefined, quran_ayah_to: undefined, quran_reference: undefined })}
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
