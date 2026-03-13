import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Database, AlertTriangle, Loader2, PackagePlus, ScrollText, Trash2, History, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Eraser } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface DataManagementCardProps {
  isAr: boolean;
}

type SeedCategory = 'students' | 'teachers' | 'courses' | 'billing' | 'schedule' | 'communications' | 'support' | 'certificates' | 'website' | 'packages';

const SEED_CATEGORIES: { key: SeedCategory; label: string; labelAr: string; icon: string; desc: string; descAr: string }[] = [
  { key: 'students', label: 'Students', labelAr: 'طلاب', icon: '👨‍🎓', desc: 'Auth users + profiles + student records', descAr: 'مستخدمون + ملفات + سجلات طلاب' },
  { key: 'teachers', label: 'Teachers', labelAr: 'معلمون', icon: '👨‍🏫', desc: 'Auth users + profiles + teacher records', descAr: 'مستخدمون + ملفات + سجلات معلمين' },
  { key: 'courses', label: 'Courses & Curriculum', labelAr: 'دورات ومناهج', icon: '📚', desc: 'Tracks, categories, levels, courses, sections, lessons', descAr: 'مسارات وتصنيفات ومستويات ودورات وأقسام ودروس' },
  { key: 'billing', label: 'Billing', labelAr: 'فواتير', icon: '💳', desc: 'Subscriptions & invoices', descAr: 'اشتراكات وفواتير' },
  { key: 'schedule', label: 'Schedule', labelAr: 'جدول', icon: '📅', desc: 'Timetable entries & attendance', descAr: 'مواعيد وحضور' },
  { key: 'communications', label: 'Communications', labelAr: 'تواصل', icon: '📢', desc: 'Announcements & notifications', descAr: 'إعلانات وإشعارات' },
  { key: 'support', label: 'Support & Chats', labelAr: 'دعم ومحادثات', icon: '💬', desc: 'Chats, messages & support tickets', descAr: 'محادثات ورسائل وتذاكر دعم' },
  { key: 'certificates', label: 'Certificates', labelAr: 'شهادات', icon: '🏅', desc: 'Student certificates', descAr: 'شهادات الطلاب' },
  { key: 'website', label: 'Website Content', labelAr: 'محتوى الموقع', icon: '🌐', desc: 'Blog posts & pages', descAr: 'مقالات وصفحات' },
  { key: 'packages', label: 'Pricing Packages', labelAr: 'باقات الأسعار', icon: '📦', desc: 'Pricing packages', descAr: 'باقات الأسعار' },
];

const getEstimatedCounts = (m: number) => ({
  students: m * 2,
  teachers: Math.max(1, Math.ceil(m * 0.8)),
  courses: Math.max(1, Math.ceil(m * 0.6)),
  timetable: m * 3,
  tickets: Math.max(1, m),
  blogs: Math.max(1, Math.ceil(m * 0.6)),
});

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

const DataManagementCard = ({ isAr }: DataManagementCardProps) => {
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SeedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState<{ sessionId?: string; all?: boolean } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<SeedCategory[]>(SEED_CATEGORIES.map(c => c.key));
  const [multiplier, setMultiplier] = useState(3);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

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
    try {
      const { data, error } = await supabase.functions.invoke('seed-data', {
        body: { action: 'seed', categories: selectedCategories, multiplier },
      });
      const serverError = data?.error;
      if (error || serverError) throw new Error(serverError || error?.message);
      
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

  const formatCounts = (counts: Record<string, number>) =>
    Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">{isAr ? 'المضاعف' : 'Multiplier'}</Label>
                  <span className="text-xs font-bold text-primary tabular-nums">{multiplier}x</span>
                </div>
                <Slider
                  value={[multiplier]}
                  onValueChange={([v]) => setMultiplier(v)}
                  min={1} max={10} step={1}
                  className="w-full"
                />
                {(() => {
                  const est = getEstimatedCounts(multiplier);
                  return (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      <span>👨‍🎓 ~{est.students} {isAr ? 'طالب' : 'students'}</span>
                      <span>👨‍🏫 ~{est.teachers} {isAr ? 'معلم' : 'teachers'}</span>
                      <span>📚 ~{est.courses} {isAr ? 'دورات' : 'courses'}</span>
                      <span>📅 ~{est.timetable} {isAr ? 'مواعيد' : 'entries'}</span>
                    </div>
                  );
                })()}
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
