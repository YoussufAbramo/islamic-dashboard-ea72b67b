import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Database, Trash2, Download, AlertTriangle, Loader2, PackagePlus, ShieldAlert, CheckCircle2, ScrollText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataManagementCardProps {
  isAr: boolean;
}

const SEED_LOG_KEY = 'app_seed_log_history';

const DataManagementCard = ({ isAr }: DataManagementCardProps) => {
  const { appName } = useAppSettings();
  const [seedLoading, setSeedLoading] = useState(false);
  const [eraseSeedLoading, setEraseSeedLoading] = useState(false);
  const [seedLog, setSeedLog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SEED_LOG_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showSeedLog, setShowSeedLog] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [confirmEraseSeed, setConfirmEraseSeed] = useState(false);
  const [clearStep, setClearStep] = useState(0);
  const [clearLoading, setClearLoading] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [eraseSummary, setEraseSummary] = useState<{ counts: Record<string, number>; total: number } | null>(null);
  const [appNameInput, setAppNameInput] = useState('');
  const [deleteCodeInput, setDeleteCodeInput] = useState('');
  const [understandCheck, setUnderstandCheck] = useState(false);

  const persistLog = (log: string[]) => {
    setSeedLog(log);
    localStorage.setItem(SEED_LOG_KEY, JSON.stringify(log));
  };

  const handleSeedData = async () => {
    setSeedLoading(true);
    const log = [...seedLog];
    const addLog = (msg: string) => {
      log.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      persistLog([...log]);
    };
    try {
      addLog(isAr ? '🚀 بدء إضافة البيانات التجريبية...' : '🚀 Starting seed process...');
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'seed_all' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const c = data.counts;

      if (c.students) addLog(isAr ? `👨‍🎓 تم إضافة ${c.students} طلاب` : `👨‍🎓 Added ${c.students} students`);
      if (c.teachers) addLog(isAr ? `👨‍🏫 تم إضافة ${c.teachers} معلمين` : `👨‍🏫 Added ${c.teachers} teachers`);
      if (c.courses) addLog(isAr ? `📚 تم إضافة ${c.courses} دورات` : `📚 Added ${c.courses} courses`);
      if (c.sections) addLog(isAr ? `📑 تم إضافة ${c.sections} أقسام` : `📑 Added ${c.sections} sections`);
      if (c.lessons) addLog(isAr ? `📖 تم إضافة ${c.lessons} دروس` : `📖 Added ${c.lessons} lessons`);
      if (c.subscriptions) addLog(isAr ? `💳 تم إضافة ${c.subscriptions} اشتراكات` : `💳 Added ${c.subscriptions} subscriptions`);
      if (c.timetable) addLog(isAr ? `📅 تم إضافة ${c.timetable} مواعيد` : `📅 Added ${c.timetable} timetable entries`);
      if (c.attendance) addLog(isAr ? `✅ تم إضافة ${c.attendance} سجلات حضور` : `✅ Added ${c.attendance} attendance records`);
      if (c.announcements) addLog(isAr ? `📢 تم إضافة ${c.announcements} إعلانات` : `📢 Added ${c.announcements} announcements`);
      if (c.notifications) addLog(isAr ? `🔔 تم إضافة ${c.notifications} إشعارات` : `🔔 Added ${c.notifications} notifications`);
      if (c.chats) addLog(isAr ? `💬 تم إضافة ${c.chats} محادثات` : `💬 Added ${c.chats} chats`);
      if (c.messages) addLog(isAr ? `✉️ تم إضافة ${c.messages} رسائل` : `✉️ Added ${c.messages} messages`);
      if (c.tickets) addLog(isAr ? `🎫 تم إضافة ${c.tickets} تذاكر دعم` : `🎫 Added ${c.tickets} support tickets`);
      if (c.certificates) addLog(isAr ? `🏅 تم إضافة ${c.certificates} شهادات` : `🏅 Added ${c.certificates} certificates`);

      addLog(isAr ? '✅ تمت العملية بنجاح!' : '✅ Seed completed successfully!');
      setShowSeedLog(true);

      toast.success(isAr ? 'تم إضافة البيانات التجريبية بنجاح' : 'Sample data added successfully');
    } catch (err: any) {
      addLog(`❌ ${err.message || 'Failed to seed data'}`);
      setShowSeedLog(true);
      toast.error(err.message || 'Failed to seed data');
    } finally {
      setSeedLoading(false);
    }
  };

  // Removed handleScanSampleData - View Log now just shows the persistent log history

  const handleEraseSeedData = async () => {
    setEraseSeedLoading(true);
    setConfirmEraseSeed(false);
    const log = [...seedLog];
    const addLog = (msg: string) => {
      log.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      persistLog([...log]);
    };
    try {
      addLog(isAr ? '🗑️ جاري مسح البيانات التجريبية...' : '🗑️ Erasing sample data...');
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'clear_seed' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      addLog(isAr ? '✅ تم مسح البيانات التجريبية بنجاح' : '✅ Sample data erased successfully');
      toast.success(isAr ? 'تم مسح البيانات التجريبية بنجاح' : 'Sample data erased successfully');
    } catch (err: any) {
      addLog(`❌ ${err.message || 'Failed to erase sample data'}`);
      toast.error(err.message || 'Failed to erase sample data');
    } finally {
      setEraseSeedLoading(false);
    }
  };

  const handleBackup = async (format: 'json' | 'csv') => {
    setBackupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'export_all' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        let csvContent = '';
        for (const [table, rows] of Object.entries(data.data as Record<string, any[]>)) {
          if (!rows || rows.length === 0) continue;
          const headers = Object.keys(rows[0]);
          csvContent += `\n=== ${table} ===\n`;
          csvContent += headers.join(',') + '\n';
          rows.forEach(row => {
            csvContent += headers.map(h => {
              const val = row[h];
              if (val === null) return '';
              const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
              return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(',') + '\n';
          });
        }
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setBackupDownloaded(true);
      toast.success(isAr ? 'تم تحميل النسخة الاحتياطية' : 'Backup downloaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleEraseAll = async () => {
    setClearLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'clear_all' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setEraseSummary({
        counts: data.counts || {},
        total: data.total_deleted || 0,
      });
      
      toast.success(
        isAr
          ? `تم مسح جميع البيانات. تم حذف ${data.total_deleted} سجل وحفظ ${data.preserved_admins} مدير`
          : `All data erased. Deleted ${data.total_deleted} records, preserved ${data.preserved_admins} admin(s).`
      );
      resetClearState();
    } catch (err: any) {
      toast.error(err.message || 'Failed to erase data');
    } finally {
      setClearLoading(false);
    }
  };

  const resetClearState = () => {
    setClearStep(0);
    setAppNameInput('');
    setDeleteCodeInput('');
    setBackupDownloaded(false);
    setUnderstandCheck(false);
  };

  const canDelete = backupDownloaded && appNameInput === appName && deleteCodeInput === 'ERASE NOW';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {isAr ? 'إدارة البيانات' : 'Data Management'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'إضافة بيانات تجريبية أو مسح جميع البيانات' : 'Add sample data or erase all data'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seed Data */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-border">
            <PackagePlus className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">{isAr ? 'إضافة بيانات تجريبية' : 'Add Sample Data'}</h4>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'إنشاء دورات ودروس وطلاب ومعلمين واشتراكات وحضور وإعلانات وإشعارات ومحادثات وتذاكر دعم وشهادات تجريبية'
                  : 'Create sample courses, lessons, students, teachers, subscriptions, attendance, announcements, notifications, chats, support tickets, and certificates'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSeedData} disabled={seedLoading} size="sm">
                  {seedLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                  {isAr ? 'إضافة بيانات تجريبية' : 'Seed Sample Data'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSeedLog(true)}
                >
                  <ScrollText className="h-4 w-4 me-1" />
                  {isAr ? 'عرض السجل' : 'View Log'}
                </Button>
              </div>
            </div>
          </div>

          {/* Erase Sample Data */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-border">
            <PackagePlus className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">{isAr ? 'مسح البيانات التجريبية' : 'Erase Sample Data'}</h4>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'مسح البيانات التجريبية التي تم إضافتها فقط. لن يتأثر أي بيانات مستخدمين حقيقية.'
                  : 'Erase only the sample data that was seeded. No real user data will be affected.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => setConfirmEraseSeed(true)} disabled={eraseSeedLoading}>
                {eraseSeedLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                {isAr ? 'مسح البيانات التجريبية' : 'Erase Sample Data'}
              </Button>
            </div>
          </div>

          {/* Erase All Data */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <Trash2 className="h-8 w-8 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-destructive">{isAr ? 'مسح جميع البيانات' : 'Erase All Data'}</h4>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'سيتم حذف جميع البيانات والمستخدمين نهائياً. سيتم الاحتفاظ فقط بحسابات المدير.'
                  : 'Permanently erase all data and users. Only admin accounts will be preserved.'}
              </p>
              <Button variant="destructive" size="sm" onClick={() => setClearStep(1)}>
                {isAr ? 'مسح جميع البيانات' : 'Erase All Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Erase Sample Data */}
      <AlertDialog open={confirmEraseSeed} onOpenChange={setConfirmEraseSeed}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? 'تأكيد مسح البيانات التجريبية' : 'Confirm Erase Sample Data'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'سيتم حذف جميع المستخدمين التجريبيين (@sample.edu) وبياناتهم المرتبطة. هل أنت متأكد؟'
                : 'This will delete all sample users (@sample.edu) and their associated data. Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEraseSeedData}
            >
              {isAr ? 'نعم، مسح البيانات التجريبية' : 'Yes, Erase Sample Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seed Log Dialog */}
      <Dialog open={showSeedLog} onOpenChange={setShowSeedLog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              {isAr ? 'سجل البيانات التجريبية' : 'Data Log History'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/30 p-3">
            <div className="space-y-1 font-mono text-xs">
              {seedLog.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{isAr ? 'لا يوجد سجل بعد' : 'No log entries yet'}</p>
              ) : seedLog.map((line, i) => (
                <p key={i} className={line.includes('❌') ? 'text-destructive' : line.includes('✅') ? 'text-primary' : 'text-foreground'}>
                  {line}
                </p>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2 sm:gap-0">
            {seedLog.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { persistLog([]); }}>
                {isAr ? 'مسح السجل' : 'Clear Log'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowSeedLog(false)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 1: First Warning */}
      <AlertDialog open={clearStep === 1} onOpenChange={(open) => !open && resetClearState()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isAr ? 'تحذير: مسح جميع البيانات' : 'Warning: Erase All Data'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'أنت على وشك مسح جميع البيانات من النظام. هذا يشمل جميع الدورات والطلاب والمعلمين والاشتراكات والفواتير والمحادثات والإعلانات والإشعارات والشهادات وتذاكر الدعم. هل تريد المتابعة؟'
                : 'You are about to erase all data from the system. This includes all courses, sections, lessons, timetable entries, attendance records, certificates, support tickets, chats, messages, announcements, notifications, teachers, students, subscriptions, and invoices. Do you want to continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetClearState}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setClearStep(2)}
            >
              {isAr ? 'متابعة' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Acknowledge & Backup */}
      <AlertDialog open={clearStep === 2} onOpenChange={(open) => !open && resetClearState()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {isAr ? 'تأكيد ثانٍ: تحميل نسخة احتياطية' : 'Step 2: Download Backup'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'يجب تحميل نسخة احتياطية قبل المتابعة. هذا الإجراء لا يمكن التراجع عنه!'
                : 'You must download a backup before proceeding. This action is irreversible!'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {isAr
                  ? '⚠️ لا يمكن استرجاع البيانات بعد المسح!'
                  : '⚠️ Data cannot be recovered after erasure!'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">
                {isAr ? 'تحميل نسخة احتياطية (مطلوب)' : 'Download Backup (Required)'}
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBackup('json')} disabled={backupLoading} className="flex-1">
                  {backupLoading ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Download className="h-4 w-4 me-1" />}
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBackup('csv')} disabled={backupLoading} className="flex-1">
                  {backupLoading ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Download className="h-4 w-4 me-1" />}
                  CSV
                </Button>
              </div>
              {backupDownloaded && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {isAr ? 'تم تحميل النسخة الاحتياطية' : 'Backup downloaded'}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={understandCheck}
                onChange={(e) => setUnderstandCheck(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">
                {isAr
                  ? 'أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه'
                  : 'I understand this action is permanent and irreversible'}
              </span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetClearState}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!backupDownloaded || !understandCheck}
              onClick={() => { setClearStep(3); setAppNameInput(''); setDeleteCodeInput(''); }}
            >
              {isAr ? 'الخطوة الأخيرة' : 'Final Step'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 3: Final Confirmation with Inputs */}
      <Dialog open={clearStep === 3} onOpenChange={(open) => !open && resetClearState()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {isAr ? 'التأكيد النهائي' : 'Final Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? 'أدخل البيانات التالية للتأكيد على مسح جميع البيانات نهائياً.'
                : 'Enter the following to confirm permanent data erasure.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {isAr
                  ? '⚠️ آخر فرصة للتراجع!'
                  : '⚠️ LAST CHANCE TO CANCEL!'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                {isAr ? `1. اكتب اسم التطبيق "${appName}"` : `1. Type the app name "${appName}"`}
              </Label>
              <Input
                value={appNameInput}
                onChange={(e) => setAppNameInput(e.target.value)}
                placeholder={appName}
                className={appNameInput === appName ? 'border-primary' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {isAr ? '2. اكتب "ERASE NOW" للتأكيد' : '2. Type "ERASE NOW" to confirm'}
              </Label>
              <Input
                value={deleteCodeInput}
                onChange={(e) => setDeleteCodeInput(e.target.value)}
                placeholder="ERASE NOW"
                className={deleteCodeInput === 'ERASE NOW' ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetClearState}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleEraseAll}
              disabled={!canDelete || clearLoading}
            >
              {clearLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? 'مسح جميع البيانات نهائياً' : 'Permanently Erase All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Erase Summary Report */}
      <Dialog open={!!eraseSummary} onOpenChange={(open) => !open && setEraseSummary(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              {isAr ? 'تقرير المسح' : 'Erase Summary Report'}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? `تم حذف ${eraseSummary?.total || 0} سجل بنجاح`
                : `Successfully deleted ${eraseSummary?.total || 0} records`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              {eraseSummary && Object.entries(eraseSummary.counts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([table, count]) => (
                  <div key={table} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted">
                    <span className="text-sm font-medium">{table.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-mono text-destructive">-{count}</span>
                  </div>
                ))}
              {eraseSummary && Object.values(eraseSummary.counts).every(c => c === 0) && (
                <p className="text-center text-muted-foreground py-4">{isAr ? 'لا توجد بيانات للحذف' : 'No data to delete'}</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEraseSummary(null)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataManagementCard;
