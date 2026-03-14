import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Tag, Calendar, Rocket, Wrench, Plus, Bug, ShieldAlert, Trash2, Sparkles, FileText } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

// Raw changelog content embedded at build time
const changelogRaw = `## [5.9.4] - 2026-03-14

### Added
- **Change Log page** — new developer page under the Developer sidebar showing full version history with search, category badges, and styled entries

---

## [5.9.3] - 2026-03-13

### Changed
- **Lesson Builder — Block palette restyled** — element categories now display in a 2-column grid with card-style buttons, category headers with item counts, and separators between groups
- **Lesson Builder — New "Layout" category** — Divider, New Page, Split Screen, and Table of Content moved from Media/Content into a dedicated 🧩 Layout group
- **Lesson content page navigation** — replaced top/bottom duplicate pagination bars with a single sticky frosted-glass bar fixed at the bottom of the content area
- **Divider block — text labels** — added optional text inside dividers with font size that scales dynamically based on selected thickness
- **Divider block — new styles & thicknesses** — added Groove and Ridge border styles; expanded thickness presets to 6px and 8px; all divider colors now render at 15% opacity
- **Lesson Builder — blocks collapsed by default** — all block elements start collapsed for cleaner editing; drag handle on the grip icon enables drag-and-drop reordering

---

## [5.9.2] - 2026-03-13

### Added
- **Clear All Content** — new card in Data Management that permanently deletes ALL data (not just seeded) from selected categories
- **Clear Logs** — new card with checkboxes to selectively clear Audit Logs, Seed Log, and Error Log
- **clear_content edge function action** — deletes all rows from selected content table groups respecting FK order
- **clear_logs edge function action** — deletes audit_logs and/or seed_sessions/seed_records from database

---

## [5.9.1] - 2026-03-13

### Changed — Database Consolidation
- **Merged auto_backup_config into app_settings** — backup configuration now stored as backup_config key inside app_settings.settings jsonb
- **Updated manage-backups edge function** — reads backup config from app_settings instead of the removed table
- **Updated BackupsSettings component** — reads/writes backup config via app_settings
- **Removed auto_backup_config** from backup table lists and settings backup scope

---

## [5.9.0] - 2026-03-13

### Added
- **Actions Queue** — new developer page logging all user CRUD actions with type filtering, stats cards, detail dialog, and clear functionality
- **logAction() utility** — reusable function to record actions from any module

### Changed — Global Search
- **Removed invoice preloading** — search dialog no longer fetches invoices on open for instant performance

### Changed — Course Tracks Redesign
- **Stats row** — 4 KPI cards (total tracks, linked courses, levels, unassigned courses)
- **Enhanced track cards** — numbered track badges, vertical separator, improved empty state
- **Better create/edit dialog** — section headers, placeholder examples, saving spinner
- **Published course badges** — green-tinted badges for published status

### Fixed
- **Floating action X buttons** — dismiss icons now have a visible background instead of transparent

---

## [5.8.0] - 2026-03-13

### Added
- **Drop All Students edge function** — full cleanup of all student accounts with admin-only access
- **drop_all_students action** — added to manage-accounts edge function

### Changed — Course Learning Immersive Mode
- **App sidebar auto-collapse** — sidebar automatically collapses when entering Course Learning page

### Security
- **XSS prevention** — integrated DOMPurify to sanitize all dangerouslySetInnerHTML content
- **Lesson Builder two-panel layout** — restructured builder dialog into left editor panel and right element palette

### Fixed
- **Course content not rendering** — expanded ContentViewer to support all 16 block types

---

## [5.7.0] - 2026-03-13

### Changed — Course Learning Sidebar (Major)
- **Hierarchical sidebar** — rebuilt with 3-level collapsible tree: Topics → Sections → Lessons
- **Visual tree structure** — left border lines, indentation, distinct icons per level
- **Section progress** — completion percentage or check icon per section

### Changed — Course Builder UX
- **Topic delete button** — direct trash icon button replacing three-dot menu
- **Section "Move To"** — sub-menu for moving sections between topics
- **Skill level icon** — changed from Signal to Settings2 icon

### Fixed
- **Content Editor RTL reversal** — fixed text typing in reverse in Arabic mode

### Changed — Manage Content → Lesson Builder
- **"Manage Content" button** now opens full Lesson Builder dialog instead of old simple form
- Removed legacy edit dialog code

---

## [5.6.0] - 2026-03-13

### Changed — Lesson Types → Builder Elements (Major)
- **Lesson types moved to Lesson Builder** — 12 hardcoded lesson types are now selectable content block types inside the Lesson Builder
- **Lesson type dropdown removed** — removed from lesson rows and Add/Edit dialog
- **Lesson dialog simplified** — only requires Title (EN/AR); content managed in Lesson Builder

### Added
- **16 block types in Lesson Builder** — expanded from 4 to 16 with full editors
- **Grouped block selector** — blocks organized into Media, Content, and Exercises groups
- **Exercise editors** — Choose Correct/Multiple, True/False, Text Match, Rearrange, Missing Text, Listen & Choose

### Removed
- **contentTypeGroups constant** — removed hardcoded lesson type definitions
- **Lesson type badge** — removed from course learning page header

---

## [5.5.0] - 2026-03-13

### Added
- **Lesson Builder** — block-based content editor for lessons with drag reorder, inline preview, and legacy content auto-migration
- **Course Documentation dialog** — "Full Documentation" button explaining content hierarchy and all lesson types
- **Preset topic selector** — preset insertion dialog with dropdown to choose existing topic

### Improved
- **Preset English translations** — fixed untranslated Arabic labels in English mode

---

## [5.4.0] - 2026-03-13

### Changed
- **Course hierarchy terminology refactored** — renamed from "Lesson → Section → Content" to "Topic → Section → Lesson"
- **Translation keys updated** — added courses.topics and courses.addTopic keys
- **Manage Content button** — inline lesson content editing from learning page
- **Floating action buttons** — individual dismiss X for each button

### Added
- **Leave confirmation dialog** — back button shows warning about unsaved progress

### Improved
- **Top bar animation** — smooth slide transition on course learning page
- **Learning page defaults** — sidebar starts collapsed and top bar auto-hides
- **Copyright footer contrast** — darker text for readability

---

## [5.3.0] - 2026-03-13

### Added
- **Course Learning Page** — full session-based learning interface with sidebar navigation, content viewer, progress tracking
- **Learn Now button** — on course cards and detail page
- **Auto-resume learning** — detects last completed lesson and opens next one
- **System Reset feature** — wipes all operational data with typed confirmation safety
- **Top bar toggle on learning page** — auto-hides with toggle button

### Improved
- **Seed data scaling** — timetable entries, attendance, and session reports scale with multiplier
- **Learning page layout** — compact copyright footer, zero-padding main area

---

## [5.2.0] - 2026-03-13

### Added
- **Global Attend button** — TopBar shows "Attend" button when session starts within 15 minutes
- **Expanded sample data categories** — seed system covers all database areas
- **Realistic session data in seeding** — attended sessions with reports, cancelled sessions with reasons

### Changed
- **Backup dialog redesigned** — expanded with 3-column table selection grid
- **Sample data deduplication** — seeding adds new data without duplicating fixed-pool records

### Improved
- **Schedule seeding distribution** — ~40% completed, ~15% cancelled, remaining scheduled
- **Clear all sample data** — cleanup handles all new tables in FK-safe order

---

## [5.1.0] - 2026-03-13

### Changed
- **Course action icons updated** — "View" uses Edit icon, "Edit" uses Settings icon
- **Backup system improvements** — full database backup covers all 46 tables
- **Landing page editor animation** — smooth slide-in animation
- **Subscription renewal dates** — quarterly corrected to 88 days

### Added
- **Separate App Settings backup** — export only configuration tables
- **Live session URLs in seed data** — Google Meet and Zoom URLs

### Fixed
- **Quarterly renewal label** — corrected from "84 days" to "88 days"

---

## [5.0.0] - 2026-03-12

### Added — Major Release
- **Complete SaaS Pricing System** — full pricing packages with bilingual content, feature lists, and Stripe-ready architecture
- **Sample Data Seeding** — edge function to populate demo data across all modules
- **Backup & Restore System** — full database backup with selective table export
- **Landing Page Manager** — visual editor for all landing page sections
- **Blog System** — full CMS with public archive and SEO
- **Multi-theme System** — 10+ color themes with light/dark variants
- **Invoice System** — auto-generation, PDF export, public view links
- **Expense Tracking** — categorized expenses with receipt attachments
- **Payout Requests** — teacher payout workflow with approval system`;

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
