// ─── Quran API Service Layer ───
// Uses alquran.cloud API v1 (free, no auth, CORS-enabled)

const BASE_URL = 'https://api.alquran.cloud/v1';

export interface SurahMeta {
  number: number;
  name: string;          // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;        // global ayah number
  numberInSurah: number;
  text: string;          // Arabic text
  surah: SurahMeta;
  juz: number;
  page: number;
}

export interface SearchMatch {
  number: number;
  text: string;
  numberInSurah: number;
  surah: SurahMeta;
}

// ─── Cache ───
let surahCache: SurahMeta[] | null = null;
const ayahCache = new Map<number, Ayah[]>();

// ─── Helpers ───
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Quran API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || json.status !== 'OK') {
    throw new Error(json.data || 'API returned an error');
  }
  return json.data as T;
}

// ─── Get all Surahs (cached) ───
export async function getSurahList(): Promise<SurahMeta[]> {
  if (surahCache) return surahCache;
  const data = await apiFetch<SurahMeta[]>('/surah');
  surahCache = data;
  return data;
}

// ─── Get all Ayahs of a Surah (cached) ───
export async function getSurahAyahs(surahNumber: number): Promise<Ayah[]> {
  if (ayahCache.has(surahNumber)) return ayahCache.get(surahNumber)!;
  const data = await apiFetch<{ ayahs: Ayah[]; [key: string]: any }>(`/surah/${surahNumber}/quran-uthmani`);
  const ayahs = data.ayahs;
  ayahCache.set(surahNumber, ayahs);
  return ayahs;
}

// ─── Get specific Ayah range ───
export async function getAyahRange(surahNumber: number, fromAyah: number, toAyah: number): Promise<Ayah[]> {
  const allAyahs = await getSurahAyahs(surahNumber);
  return allAyahs.filter(a => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah);
}

// ─── Search Quran text ───
export async function searchQuran(keyword: string, surahNumber?: number): Promise<SearchMatch[]> {
  if (!keyword || keyword.trim().length < 2) return [];
  const surahPart = surahNumber ? `${surahNumber}` : 'all';
  try {
    const data = await apiFetch<{ count: number; matches: SearchMatch[] }>(
      `/search/${encodeURIComponent(keyword.trim())}/${surahPart}/ar.quran-simple`
    );
    return data.matches || [];
  } catch {
    return [];
  }
}

// ─── Parse reference like "2:255" or "2:255-260" ───
export function parseAyahReference(ref: string): { surah: number; from: number; to: number } | null {
  const match = ref.trim().match(/^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/);
  if (!match) return null;
  const surah = parseInt(match[1]);
  const from = parseInt(match[2]);
  const to = match[3] ? parseInt(match[3]) : from;
  if (surah < 1 || surah > 114 || from < 1 || to < from) return null;
  return { surah, from, to };
}
