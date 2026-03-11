import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllErrors, categoryLabels, type ErrorDetail } from '@/lib/errorMessages';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldAlert, AlertTriangle, Database, Wifi, HardDrive, Info, Search, ExternalLink } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  auth: ShieldAlert,
  validation: AlertTriangle,
  database: Database,
  network: Wifi,
  storage: HardDrive,
  general: Info,
};

const categoryColors: Record<string, string> = {
  auth: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  validation: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  database: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  network: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  storage: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  general: 'bg-muted text-muted-foreground border-border',
};

const ErrorDocs = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allErrors = useMemo(() => getAllErrors(), []);

  const categories = useMemo(() => {
    const cats = new Set(allErrors.map(e => e.category));
    return Array.from(cats);
  }, [allErrors]);

  const filtered = useMemo(() => {
    return allErrors.filter(e => {
      if (activeCategory && e.category !== activeCategory) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.code.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.titleAr.includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.messageAr.includes(q)
      );
    });
  }, [allErrors, search, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, ErrorDetail[]> = {};
    for (const e of filtered) {
      if (!map[e.category]) map[e.category] = [];
      map[e.category].push(e);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          {isAr ? 'توثيق الأخطاء' : 'Error Documentation'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? 'مرجع شامل لجميع رسائل الأخطاء في النظام مع شرح وحلول مقترحة.'
            : 'A comprehensive reference of all system error messages with explanations and suggested fixes.'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'ابحث عن خطأ...' : 'Search errors...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(null)}
          >
            {isAr ? 'الكل' : 'All'} ({allErrors.length})
          </Button>
          {categories.map(cat => {
            const label = categoryLabels[cat] || categoryLabels.general;
            const count = allErrors.filter(e => e.category === cat).length;
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {isAr ? label.ar : label.en} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Error List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{isAr ? 'لا توجد نتائج مطابقة' : 'No matching errors found'}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, errors]) => {
          const CatIcon = categoryIcons[category] || Info;
          const catLabel = categoryLabels[category] || categoryLabels.general;
          const catColor = categoryColors[category] || categoryColors.general;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${catColor}`}>
                  <CatIcon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">
                  {isAr ? catLabel.ar : catLabel.en}
                </h2>
                <Badge variant="secondary" className="text-xs">{errors.length}</Badge>
              </div>

              <div className="grid gap-2">
                {errors.map(err => (
                  <Card
                    key={err.code}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/dashboard/error/${err.code}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {isAr ? err.titleAr : err.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {err.code}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {isAr ? err.messageAr : err.message}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ErrorDocs;
