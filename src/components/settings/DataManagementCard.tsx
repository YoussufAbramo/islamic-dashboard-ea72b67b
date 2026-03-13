import { useState, useEffect } from 'react';
import SystemResetCard from './SystemResetCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Database, AlertTriangle, Loader2, PackagePlus, ScrollText, Trash2, History, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Eraser, Info, ClipboardList, Bug } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { logAction } from '@/lib/actionsQueue';

interface DataManagementCardProps {
  isAr: boolean;
}

type SeedCategory = 'students' | 'teachers' | 'courses' | 'billing' | 'schedule' | 'communications' | 'support' | 'certificates' | 'website' | 'packages' | 'expenses' | 'ebooks' | 'progress' | 'support_config' | 'payouts' | 'badges';

const SEED_CATEGORIES: { key: SeedCategory; label: string; labelAr: string; icon: string; desc: string; descAr: string }[] = [
  { key: 'students', label: 'Students', labelAr: 'طلاب', icon: '👨‍🎓', desc: 'Auth users + profiles + student records', descAr: 'مستخدمون + ملفات + سجلات طلاب' },
  { key: 'teachers', label: 'Teachers', labelAr: 'معلمون', icon: '👨‍🏫', desc: 'Auth users + profiles + teacher records', descAr: 'مستخدمون + ملفات + سجلات معلمين' },
  { key: 'courses', label: 'Courses & Curriculum', labelAr: 'دورات ومناهج', icon: '📚', desc: 'Tracks, categories, levels, courses, sections, lessons', descAr: 'مسارات وتصنيفات ومستويات ودورات وأقسام ودروس' },
  { key: 'billing', label: 'Billing', labelAr: 'فواتير', icon: '💳', desc: 'Subscriptions & invoices', descAr: 'اشتراكات وفواتير' },
  { key: 'schedule', label: 'Schedule', labelAr: 'جدول', icon: '📅', desc: 'Timetable entries & attendance', descAr: 'مواعيد وحضور' },
  { key: 'communications', label: 'Communications', labelAr: 'تواصل', icon: '📢', desc: 'Announcements & notifications', descAr: 'إعلانات وإشعارات' },
  { key: 'support', label: 'Support & Chats', labelAr: 'دعم ومحادثات', icon: '💬', desc: 'Chats, messages & support tickets', descAr: 'محادثات ورسائل وتذاكر دعم' },
  { key: 'support_config', label: 'Support Config', labelAr: 'إعدادات الدعم', icon: '⚙️', desc: 'Departments & priorities', descAr: 'أقسام وأولويات الدعم' },
  { key: 'certificates', label: 'Certificates', labelAr: 'شهادات', icon: '🏅', desc: 'Student certificates', descAr: 'شهادات الطلاب' },
  { key: 'progress', label: 'Progress & Reports', labelAr: 'تقدم وتقارير', icon: '📊', desc: 'Student progress & session reports', descAr: 'تقدم الطلاب وتقارير الحصص' },
  { key: 'expenses', label: 'Expenses', labelAr: 'مصروفات', icon: '💰', desc: 'Expense categories & expense records', descAr: 'تصنيفات المصروفات والسجلات' },
  { key: 'ebooks', label: 'E-Books', labelAr: 'كتب إلكترونية', icon: '📖', desc: 'E-books, views & downloads', descAr: 'كتب إلكترونية ومشاهدات وتنزيلات' },
  { key: 'website', label: 'Website Content', labelAr: 'محتوى الموقع', icon: '🌐', desc: 'Blog posts & pages', descAr: 'مقالات وصفحات' },
  { key: 'packages', label: 'Pricing Packages', labelAr: 'باقات الأسعار', icon: '📦', desc: 'Pricing packages', descAr: 'باقات الأسعار' },
  { key: 'payouts', label: 'Payout Requests', labelAr: 'طلبات الدفع', icon: '💸', desc: 'Approved & declined payouts', descAr: 'طلبات دفع مقبولة ومرفوضة' },
  { key: 'badges', label: 'Badge Achievements', labelAr: 'إنجازات الشارات', icon: '🏆', desc: 'Seed badge data for teachers', descAr: 'بيانات شارات للمعلمين' },
];

const MAX_TOTAL_RECORDS = 1000;

const getEstimatedTotal = (m: number) => Math.min(MAX_TOTAL_RECORDS, m * 100);

interface SeedSession {
  id: string;
  created_at: string;
  status: string;
  categories: string[];
  multiplier: number;
  counts: Record<string, number>;
  errors: string[];
  total_records: number;
  cleared_at: string | null;
}

const StatusBadge = ({ status, isAr }: { status: string; isAr: boolean }) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; label: string; labelAr: string }> = {
    completed: { variant: 'default', icon: CheckCircle2, label: 'Completed', labelAr: 'مكتمل' },
    running: { variant: 'secondary', icon: Clock, label: 'Running', labelAr: 'جاري' },
    failed: { variant: 'destructive', icon: XCircle, label: 'Failed', labelAr: 'فشل' },
    cleared: { variant: 'outline', icon: Eraser, label: 'Cleared', labelAr: 'تم المسح' },
  };
  const info = map[status] || map.completed;
  const Icon = info.icon;
  return (
    <Badge variant={info.variant} className="text-[10px] gap-1">
      <Icon className="h-3 w-3" />
      {isAr ? info.labelAr : info.label}
    </Badge>
  );
};

// ==================== Clear Logs Card (Compact) ====================
type LogType = 'audit_logs' | 'seed_log' | 'error_log';

const LOG_TYPES: { key: LogType; label: string; labelAr: string; icon: any; desc: string; descAr: string; isLocal?: boolean }[] = [
  { key: 'audit_logs', label: 'Audit Logs', labelAr: 'سجل التدقيق', icon: ClipboardList, desc: 'Database audit trail entries', descAr: 'سجلات تدقيق قاعدة البيانات' },
  { key: 'seed_log', label: 'Seed Log', labelAr: 'سجل البيانات التجريبية', icon: Database, desc: 'Seed sessions & records', descAr: 'جلسات وسجلات البيانات التجريبية' },
  { key: 'error_log', label: 'Error Log', labelAr: 'سجل الأخطاء', icon: Bug, desc: 'Browser error log (localStorage)', descAr: 'سجل أخطاء المتصفح (محلي)', isLocal: true },
];

const ClearLogsCard = ({ isAr }: { isAr: boolean }) => {
  const [selected, setSelected] = useState<LogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClear = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      // Clear localStorage error log if selected
      if (selected.includes('error_log')) {
        localStorage.removeItem('app_error_log');
      }

      // Clear DB logs
      const dbLogs = selected.filter(s => s !== 'error_log');
      if (dbLogs.length > 0) {
        const { data, error } = await supabase.functions.invoke('seed-data', {
          body: { action: 'clear_logs', log_types: dbLogs },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        logAction('delete', 'Logs', `Cleared logs: ${selected.join(', ')}`, undefined, `Deleted ${data.total_deleted} DB records`);
        toast.success(isAr ? `تم مسح ${data.total_deleted} سجل` : `Cleared ${data.total_deleted} log entries`);
      } else {
        logAction('delete', 'Logs', 'Cleared error log (localStorage)');
        toast.success(isAr ? 'تم مسح سجل الأخطاء' : 'Error log cleared');
      }
      setSelected([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {isAr ? 'مسح السجلات' : 'Clear Logs'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map(lt => {
              const Icon = lt.icon;
              return (
                <label
                  key={lt.key}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-xs ${
                    selected.includes(lt.key) ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <Checkbox
                    className="h-3.5 w-3.5"
                    checked={selected.includes(lt.key)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelected(prev => [...prev, lt.key]);
                      else setSelected(prev => prev.filter(c => c !== lt.key));
                    }}
                  />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{isAr ? lt.labelAr : lt.label}</span>
                  {lt.isLocal && <Badge variant="outline" className="text-[8px] h-3.5 px-1">{isAr ? 'محلي' : 'Local'}</Badge>}
                </label>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={loading || selected.length === 0}
            className="text-destructive hover:text-destructive h-7 text-xs"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />}
            {isAr ? 'مسح المحدد' : 'Clear Selected'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? 'تأكيد مسح السجلات' : 'Confirm Log Cleanup'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `سيتم مسح: ${selected.map(s => LOG_TYPES.find(l => l.key === s)?.labelAr).join('، ')}. لا يمكن التراجع عن هذا الإجراء.`
                : `This will clear: ${selected.map(s => LOG_TYPES.find(l => l.key === s)?.label).join(', ')}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleClear}>
              {isAr ? 'نعم، مسح' : 'Yes, Clear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const DataManagementCard = ({ isAr }: DataManagementCardProps) => {
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SeedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState<{ sessionId?: string; all?: boolean } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<SeedCategory[]>(SEED_CATEGORIES.map(c => c.key));
  const [multiplier, setMultiplier] = useState(3);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [lastSeedResult, setLastSeedResult] = useState<any>(null);

  const fetchSessions = async () => {
    const { data, error } = await supabase.functions.invoke('seed-data', {
      body: { action: 'list_sessions' },
    });
    if (!error && data?.sessions) {
      setSessions(data.sessions);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'completed');

  const handleSeed = async () => {
    if (selectedCategories.length === 0) {
      toast.error(isAr ? 'اختر فئة واحدة على الأقل' : 'Select at least one category');
      return;
    }
    setSeedLoading(true);
    setLastSeedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-data', {
        body: { action: 'seed', categories: selectedCategories, multiplier },
      });
      const serverError = data?.error;
      if (error || serverError) throw new Error(serverError || error?.message);
      
      setLastSeedResult(data);
      logAction('add', 'Sample Data', `Seeded ${data.total_records} records (${multiplier}x)`, data.session_id, `Categories: ${selectedCategories.join(', ')}`);
      toast.success(
        isAr
          ? `تم إضافة ${data.total_records} سجل تجريبي بنجاح`
          : `Successfully seeded ${data.total_records} records`
      );
      await fetchSessions();
      setShowHistory(true);
    } catch (err: any) {
      notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message });
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClear = async (sessionId?: string, clearAll?: boolean) => {
    setConfirmClear(null);
    const loadingKey = clearAll ? 'all' : sessionId || 'all';
    setClearLoading(loadingKey);
    try {
      const body: any = { action: 'clear' };
      if (sessionId) body.session_id = sessionId;
      if (clearAll) body.clear_all = true;

      const { data, error } = await supabase.functions.invoke('seed-data', { body });
      const serverError = data?.error;
      if (error || serverError) throw new Error(serverError || error?.message);
      
      logAction('delete', 'Sample Data', `Cleared ${data.total_deleted} seed records`, sessionId, clearAll ? 'Cleared all sessions' : `Session: ${sessionId}`);
      toast.success(
        isAr
          ? `تم حذف ${data.total_deleted} سجل تجريبي`
          : `Deleted ${data.total_deleted} seed records`
      );
      await fetchSessions();
    } catch (err: any) {
      notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message });
    } finally {
      setClearLoading(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Seed Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {isAr ? 'إدارة البيانات التجريبية' : 'Sample Data Management'}
            </CardTitle>
            <CardDescription>
              {isAr
                ? 'أداة لإنشاء بيانات تجريبية واقعية للاختبار والعرض. كل عملية يتم تتبعها ويمكن التراجع عنها.'
                : 'Generate realistic sample data for testing and demos. Every operation is tracked and fully reversible.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Quantity Slider */}
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center gap-3">
                <PackagePlus className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{isAr ? 'إنشاء بيانات تجريبية' : 'Generate Sample Data'}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? 'اختر الكمية والفئات ثم ابدأ الإنشاء' : 'Choose quantity and categories, then generate'}
                  </p>
                </div>
              </div>

              {/* Record limit notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">
                    {isAr ? `الحد الأقصى: ${MAX_TOTAL_RECORDS} سجل` : `Global limit: ${MAX_TOTAL_RECORDS} records max`}
                  </p>
                  <p>
                    {isAr
                      ? 'يتم توزيع السجلات عبر آخر 90 يومًا بشكل طبيعي مع الحفاظ على العلاقات بين الجداول.'
                      : 'Records are distributed across the last 90 days with natural timestamps and full relational integrity.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Header with multiplier badge */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">{isAr ? 'مضاعف الكمية' : 'Data Multiplier'}</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? 'كلما زاد المضاعف، زادت البيانات المُنشأة' : 'Higher multiplier = more records generated'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-sm font-mono font-bold px-3 py-1">
                      {multiplier}x
                    </Badge>
                  </div>
                </div>

                {/* Slider with aligned labels */}
                <div className="space-y-1.5">
                  <Slider
                    value={[multiplier]}
                    onValueChange={([v]) => setMultiplier(v)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                    <span>1x</span>
                    <span className="translate-x-[-2px]">2x</span>
                    <span className="translate-x-[-2px]">3x</span>
                    <span className="translate-x-[-1px]">4x</span>
                    <span>5x</span>
                    <span className="translate-x-[1px]">6x</span>
                    <span className="translate-x-[1px]">7x</span>
                    <span className="translate-x-[1px]">8x</span>
                    <span className="translate-x-[2px]">9x</span>
                    <span>10x</span>
                  </div>
                </div>

                {/* Estimated records bar */}
                <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-border">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">{isAr ? 'السجلات المُقدرة' : 'Estimated records'}</span>
                      <span className="font-mono font-semibold text-foreground">
                        ~{getEstimatedTotal(multiplier)} <span className="text-muted-foreground font-normal">/ {MAX_TOTAL_RECORDS}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${(getEstimatedTotal(multiplier) / MAX_TOTAL_RECORDS) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick info */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-md bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الفئات' : 'Categories'}</p>
                    <p className="text-sm font-semibold">{selectedCategories.length}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'لكل فئة' : 'Per category'}</p>
                    <p className="text-sm font-semibold">~{selectedCategories.length > 0 ? Math.round(getEstimatedTotal(multiplier) / selectedCategories.length) : 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الحد الأدنى' : 'Min/category'}</p>
                    <p className="text-sm font-semibold">{multiplier <= 3 ? 1 : multiplier <= 6 ? 2 : 3}</p>
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">{isAr ? 'الفئات' : 'Categories'}</Label>
                  <button
                    className="text-[10px] text-primary hover:underline"
                    onClick={() => setSelectedCategories(
                      selectedCategories.length === SEED_CATEGORIES.length ? [] : SEED_CATEGORIES.map(c => c.key)
                    )}
                  >
                    {selectedCategories.length === SEED_CATEGORIES.length ? (isAr ? 'إلغاء الكل' : 'Deselect all') : (isAr ? 'تحديد الكل' : 'Select all')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SEED_CATEGORIES.map(cat => (
                    <label
                      key={cat.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategories.includes(cat.key) ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'
                      }`}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(cat.key)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedCategories(prev => [...prev, cat.key]);
                          else setSelectedCategories(prev => prev.filter(c => c !== cat.key));
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium">{cat.icon} {isAr ? cat.labelAr : cat.label}</span>
                        <p className="text-[10px] text-muted-foreground truncate">{isAr ? cat.descAr : cat.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSeed} disabled={seedLoading || selectedCategories.length === 0} size="sm">
                  {seedLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                  {isAr ? 'إنشاء بيانات تجريبية' : 'Seed Sample Data'}
                </Button>
              </div>
            </div>

            {/* Cleanup Section */}
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{isAr ? 'مسح البيانات التجريبية' : 'Cleanup Sample Data'}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? 'يتم حذف البيانات التجريبية فقط. لن تتأثر أي بيانات حقيقية.'
                      : 'Only removes tracked seed records. Real data is never affected.'}
                  </p>
                </div>
              </div>

              {activeSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {isAr ? 'لا توجد بيانات تجريبية لمسحها' : 'No active seed data to clean up'}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? `${activeSessions.length} عمليات نشطة (${activeSessions.reduce((a, s) => a + s.total_records, 0)} سجل)`
                      : `${activeSessions.length} active session(s) (${activeSessions.reduce((a, s) => a + s.total_records, 0)} records)`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmClear({ all: true })}
                    disabled={clearLoading !== null}
                    className="text-destructive hover:text-destructive"
                  >
                    {clearLoading === 'all' && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                    {isAr ? 'مسح كل البيانات التجريبية' : 'Clear All Sample Data'}
                  </Button>
                </div>
              )}
            </div>

            {/* Session History Button */}
            <Button
              variant="outline" size="sm"
              onClick={() => { fetchSessions(); setShowHistory(true); }}
              className="w-full"
            >
              <History className="h-4 w-4 me-1" />
              {isAr ? 'سجل العمليات' : 'Seed History'}
              {sessions.length > 0 && (
                <Badge variant="secondary" className="ms-2 text-[10px]">{sessions.length}</Badge>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Clear Logs Card */}
        <ClearLogsCard isAr={isAr} />

        {/* System Reset - Collapsible Accordion */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {isAr ? 'إعادة تعيين النظام' : 'System Reset'}
              </span>
              <ChevronDown className="h-4 w-4 text-destructive" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <SystemResetCard isAr={isAr} />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Confirm Clear Dialog */}
      <AlertDialog open={confirmClear !== null} onOpenChange={(open) => !open && setConfirmClear(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? 'تأكيد مسح البيانات التجريبية' : 'Confirm Cleanup'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmClear?.all
                ? (isAr
                    ? 'سيتم حذف جميع البيانات التجريبية من كل العمليات السابقة. البيانات الحقيقية لن تتأثر.'
                    : 'This will delete all tracked seed data from every session. Real data will not be affected.')
                : (isAr
                    ? 'سيتم حذف البيانات التجريبية من هذه العملية فقط. البيانات الحقيقية لن تتأثر.'
                    : 'This will delete seed data from this session only. Real data will not be affected.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleClear(confirmClear?.sessionId, confirmClear?.all)}
            >
              {isAr ? 'نعم، مسح' : 'Yes, Clear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Session History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {isAr ? 'سجل عمليات البيانات التجريبية' : 'Seed Session History'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{isAr ? 'لا توجد عمليات سابقة' : 'No seed sessions yet'}</p>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {sessions.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  return (
                    <div key={session.id} className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-start"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">
                              {session.id.slice(0, 8)}
                            </span>
                            <StatusBadge status={session.status} isAr={isAr} />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(session.created_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium">
                              {session.total_records} {isAr ? 'سجل' : 'records'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {session.multiplier}x · {session.categories.length} {isAr ? 'فئات' : 'categories'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {session.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmClear({ sessionId: session.id });
                              }}
                              disabled={clearLoading !== null}
                            >
                              {clearLoading === session.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </Button>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          <Separator />
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">{isAr ? 'الفئات:' : 'Categories:'}</span>{' '}
                              {session.categories.join(', ')}
                            </div>
                          </div>
                          {Object.keys(session.counts).length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium">{isAr ? 'السجلات المُنشأة:' : 'Records created:'}</p>
                              <div className="grid grid-cols-3 gap-1">
                                {Object.entries(session.counts)
                                  .filter(([, v]) => v > 0)
                                  .map(([key, val]) => (
                                    <div key={key} className="text-[10px] bg-muted/50 rounded px-2 py-1 flex items-center justify-between">
                                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                      <span className="font-mono font-medium">{val}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          {session.errors.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-destructive">{isAr ? 'أخطاء:' : 'Errors:'}</p>
                              {session.errors.map((err, i) => (
                                <p key={i} className="text-[10px] text-destructive/80 font-mono">{err}</p>
                              ))}
                            </div>
                          )}
                          {session.cleared_at && (
                            <p className="text-[10px] text-muted-foreground">
                              {isAr ? 'تم المسح:' : 'Cleared:'} {format(new Date(session.cleared_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(false)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataManagementCard;
