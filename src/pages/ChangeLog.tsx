import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Tag, Calendar, Rocket, Wrench, Plus, Bug, ShieldAlert, Trash2, Sparkles, FileText } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import changelogRaw from '../../CHANGELOG.md?raw';

interface ChangeEntry {
  version: string;
  date: string;
  sections: { type: string; title: string; items: string[] }[];
}

function parseChangelog(raw: string): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  const versionBlocks = raw.split(/^## /gm).filter(Boolean);

  for (const block of versionBlocks) {
    const headerMatch = block.match(/^\[(.+?)\]\s*-\s*(\S+)/);
    if (!headerMatch) continue;

    const [, version, date] = headerMatch;
    const sections: { type: string; title: string; items: string[] }[] = [];
    const sectionMatches = block.matchAll(/^### (.+)$/gm);

    let lastIdx = 0;
    const sectionPositions: { type: string; title: string; start: number }[] = [];
    for (const m of sectionMatches) {
      const rawTitle = m[1].trim();
      const typeMatch = rawTitle.match(/^(\w+)(?:\s*—\s*(.+))?$/);
      const type = typeMatch ? typeMatch[1] : rawTitle;
      const title = typeMatch && typeMatch[2] ? typeMatch[2] : '';
      sectionPositions.push({ type, title, start: m.index! + m[0].length });
    }

    for (let i = 0; i < sectionPositions.length; i++) {
      const start = sectionPositions[i].start;
      const end = i + 1 < sectionPositions.length ? block.indexOf('### ', start + 1) : block.length;
      const content = block.slice(start, end === -1 ? undefined : end);
      const items = content
        .split('\n')
        .map(l => l.replace(/^-\s*/, '').trim())
        .filter(l => l.length > 0 && !l.startsWith('---'));
      sections.push({ type: sectionPositions[i].type, title: sectionPositions[i].title, items });
    }

    entries.push({ version, date, sections });
  }

  return entries;
}

const sectionConfig: Record<string, { icon: any; color: string; bg: string }> = {
  Added: { icon: Plus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  Changed: { icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  Fixed: { icon: Bug, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  Improved: { icon: Sparkles, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  Removed: { icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  Security: { icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
};

const ChangeLog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');

  const entries = useMemo(() => parseChangelog(changelogRaw), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.version.toLowerCase().includes(q) ||
      e.sections.some(s => s.items.some(item => item.toLowerCase().includes(q)))
    );
  }, [entries, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? 'سجل التغييرات' : 'Change Log'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'جميع التحديثات والتغييرات في النظام' : 'All updates and changes to the system'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1.5">
          <Tag className="h-3.5 w-3.5" />
          v{APP_VERSION}
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? 'بحث في التغييرات...' : 'Search changes...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute start-[19px] top-0 bottom-0 w-px bg-border hidden md:block" />

        <div className="space-y-6">
          {filtered.map((entry, idx) => {
            const isLatest = idx === 0 && !search;
            return (
              <div key={entry.version} className="relative md:ps-12">
                {/* Timeline dot */}
                <div className={`absolute start-2.5 top-5 h-3 w-3 rounded-full border-2 hidden md:block ${
                  isLatest ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'
                }`} />

                <Card className={isLatest ? 'border-primary/30 shadow-md' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-primary" />
                          v{entry.version}
                        </CardTitle>
                        {isLatest && (
                          <Badge className="text-[10px]">
                            {isAr ? 'الأحدث' : 'Latest'}
                          </Badge>
                        )}
                        {entry.version.endsWith('.0.0') && (
                          <Badge variant="destructive" className="text-[10px]">
                            {isAr ? 'إصدار رئيسي' : 'Major'}
                          </Badge>
                        )}
                        {entry.version.split('.')[2] === '0' && !entry.version.endsWith('.0.0') && (
                          <Badge variant="secondary" className="text-[10px]">
                            {isAr ? 'إصدار ثانوي' : 'Minor'}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {entry.date}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entry.sections.map((section, sIdx) => {
                      const config = sectionConfig[section.type] || { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' };
                      const Icon = config.icon;
                      return (
                        <div key={sIdx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-md flex items-center justify-center ${config.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <span className={`text-sm font-semibold ${config.color}`}>
                              {section.type}
                            </span>
                            {section.title && (
                              <span className="text-xs text-muted-foreground">— {section.title}</span>
                            )}
                          </div>
                          <ul className="space-y-1.5 ps-8">
                            {section.items.map((item, iIdx) => {
                              const boldMatch = item.match(/^\*\*(.+?)\*\*\s*[-—]?\s*(.*)/);
                              return (
                                <li key={iIdx} className="text-sm text-muted-foreground leading-relaxed list-disc">
                                  {boldMatch ? (
                                    <>
                                      <span className="font-medium text-foreground">{boldMatch[1]}</span>
                                      {boldMatch[2] && <span> — {boldMatch[2]}</span>}
                                    </>
                                  ) : (
                                    item
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                          {sIdx < entry.sections.length - 1 && <Separator className="mt-3" />}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">{isAr ? 'لا توجد نتائج' : 'No results found'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeLog;
