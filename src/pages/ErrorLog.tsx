import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bug, Search, Trash2, AlertTriangle, AlertCircle, Info, RefreshCw, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface ErrorEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  source?: string;
  stack?: string;
}

const PAGE_SIZE = 10;

const ErrorLog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Capture runtime errors
  useEffect(() => {
    const stored = localStorage.getItem('app_error_log');
    if (stored) {
      try { setErrors(JSON.parse(stored)); } catch {}
    }

    const handleError = (event: ErrorEvent) => {
      const entry: ErrorEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: event.message,
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack,
      };
      setErrors(prev => {
        const updated = [entry, ...prev].slice(0, 500);
        localStorage.setItem('app_error_log', JSON.stringify(updated));
        return updated;
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const entry: ErrorEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      };
      setErrors(prev => {
        const updated = [entry, ...prev].slice(0, 500);
        localStorage.setItem('app_error_log', JSON.stringify(updated));
        return updated;
      });
    };

    // Intercept console.warn and console.error
    const origWarn = console.warn;
    const origError = console.error;

    console.warn = (...args: any[]) => {
      origWarn.apply(console, args);
      const entry: ErrorEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      };
      setErrors(prev => {
        const updated = [entry, ...prev].slice(0, 500);
        localStorage.setItem('app_error_log', JSON.stringify(updated));
        return updated;
      });
    };

    console.error = (...args: any[]) => {
      origError.apply(console, args);
      const entry: ErrorEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      };
      setErrors(prev => {
        const updated = [entry, ...prev].slice(0, 500);
        localStorage.setItem('app_error_log', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.warn = origWarn;
      console.error = origError;
    };
  }, []);

  const clearLogs = () => {
    setErrors([]);
    localStorage.removeItem('app_error_log');
  };

  const filtered = errors.filter(e => {
    if (levelFilter !== 'all' && e.level !== levelFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, levelFilter]);

  const levelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const levelBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive" className="text-[10px]">Error</Badge>;
      case 'warn': return <Badge className="text-[10px] bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">Warn</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            {isAr ? 'سجل الأخطاء' : 'Error Log'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'عرض أخطاء وتحذيرات التطبيق في الوقت الحقيقي' : 'View real-time application errors and warnings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 h-9" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-28 h-9">
              <Filter className="h-3.5 w-3.5 me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="error">{isAr ? 'أخطاء' : 'Errors'}</SelectItem>
              <SelectItem value="warn">{isAr ? 'تحذيرات' : 'Warnings'}</SelectItem>
              <SelectItem value="info">{isAr ? 'معلومات' : 'Info'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={() => { const stored = localStorage.getItem('app_error_log'); if (stored) try { setErrors(JSON.parse(stored)); } catch {} }}>
            <RefreshCw className="h-3.5 w-3.5 me-1" />{isAr ? 'تحديث' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-destructive hover:text-destructive" onClick={clearLogs}>
            <Trash2 className="h-3.5 w-3.5 me-1" />{isAr ? 'مسح' : 'Clear'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold">{errors.filter(e => e.level === 'error').length}</p><p className="text-xs text-muted-foreground">{isAr ? 'أخطاء' : 'Errors'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-yellow-500" /></div>
          <div><p className="text-2xl font-bold">{errors.filter(e => e.level === 'warn').length}</p><p className="text-xs text-muted-foreground">{isAr ? 'تحذيرات' : 'Warnings'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><Info className="h-5 w-5 text-blue-500" /></div>
          <div><p className="text-2xl font-bold">{errors.filter(e => e.level === 'info').length}</p><p className="text-xs text-muted-foreground">{isAr ? 'معلومات' : 'Info'}</p></div>
        </CardContent></Card>
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Bug className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{isAr ? 'لا توجد سجلات' : 'No log entries'}</p>
          <p className="text-sm mt-1">{isAr ? 'لم يتم تسجيل أي أخطاء حتى الآن' : 'No errors have been recorded yet'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-1.5 w-full max-w-[800px] overflow-hidden">
          {filtered.slice(0, visibleCount).map(entry => (
            <Card key={entry.id} className="hover:shadow-sm transition-shadow cursor-pointer overflow-hidden" onClick={() => setSelectedError(entry)}>
              <CardContent className="p-3 flex items-start gap-3 min-w-0">
                {levelIcon(entry.level)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate max-w-full">{entry.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {levelBadge(entry.level)}
                    {entry.source && <span className="text-[10px] text-muted-foreground font-mono truncate">{entry.source}</span>}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {format(new Date(entry.timestamp), 'HH:mm:ss')}
                </span>
              </CardContent>
            </Card>
          ))}
          {visibleCount < filtered.length && (
            <div className="flex justify-start pt-2">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
                {isAr ? 'تحميل المزيد' : 'Load More'} ({filtered.length - visibleCount} {isAr ? 'متبقي' : 'remaining'})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedError} onOpenChange={(open) => { if (!open) setSelectedError(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && levelIcon(selectedError.level)}
              {isAr ? 'تفاصيل الخطأ' : 'Error Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {levelBadge(selectedError.level)}
                <span className="text-xs text-muted-foreground">{format(new Date(selectedError.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-mono break-all">{selectedError.message}</p>
              </div>
              {selectedError.source && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? 'المصدر' : 'Source'}</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedError.source}</p>
                </div>
              )}
              {selectedError.stack && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? 'تتبع المكدس' : 'Stack Trace'}</p>
                  <pre className="text-xs font-mono p-3 rounded-lg bg-muted/50 border border-border overflow-x-auto whitespace-pre-wrap break-all">{selectedError.stack}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ErrorLog;
