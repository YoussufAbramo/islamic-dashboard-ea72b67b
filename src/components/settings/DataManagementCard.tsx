import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Database, Trash2, Download, AlertTriangle, Loader2, PackagePlus, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface DataManagementCardProps {
  isAr: boolean;
}

const DataManagementCard = ({ isAr }: DataManagementCardProps) => {
  const { appName } = useAppSettings();
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearStep, setClearStep] = useState(0); // 0=hidden, 1=first confirm, 2=second confirm
  const [clearLoading, setClearLoading] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [appNameInput, setAppNameInput] = useState('');
  const [deleteCodeInput, setDeleteCodeInput] = useState('');

  const handleSeedData = async () => {
    setSeedLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'seed_all' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const c = data.counts;
      toast.success(
        isAr
          ? `تم إضافة البيانات التجريبية: ${c.courses} دورات، ${c.students} طلاب، ${c.teachers} معلمين`
          : `Sample data added: ${c.courses} courses, ${c.students} students, ${c.teachers} teachers, ${c.subscriptions} subscriptions, ${c.timetable} timetable entries`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed data');
    } finally {
      setSeedLoading(false);
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
        // CSV format - create a zip-like multi-table CSV
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

  const handleClearAll = async () => {
    setClearLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: { action: 'clear_all' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        isAr
          ? `تم مسح جميع البيانات. تم حذف ${data.deleted_users} مستخدمين وحفظ ${data.preserved_admins} مدير`
          : `All data cleared. Deleted ${data.deleted_users} users, preserved ${data.preserved_admins} admin(s).`
      );
      setClearStep(0);
      setAppNameInput('');
      setDeleteCodeInput('');
      setBackupDownloaded(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear data');
    } finally {
      setClearLoading(false);
    }
  };

  const canDelete = backupDownloaded && appNameInput === appName && deleteCodeInput === 'DELETE NOW';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {isAr ? 'إدارة البيانات' : 'Data Management'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'إضافة بيانات تجريبية أو مسح جميع البيانات' : 'Add sample data or clear all data'}
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
              <Button onClick={handleSeedData} disabled={seedLoading} size="sm">
                {seedLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                {isAr ? 'إضافة بيانات تجريبية' : 'Seed Sample Data'}
              </Button>
            </div>
          </div>

          {/* Clear Data */}
          <div className="flex items-start gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <Trash2 className="h-8 w-8 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-destructive">{isAr ? 'مسح جميع البيانات' : 'Clear All Data'}</h4>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'سيتم حذف جميع البيانات والمستخدمين نهائياً. سيتم الاحتفاظ فقط بحسابات المدير.'
                  : 'Permanently delete all data and users. Only admin accounts will be preserved.'}
              </p>
              <Button variant="destructive" size="sm" onClick={() => setClearStep(1)}>
                {isAr ? 'مسح جميع البيانات' : 'Clear All Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: First Confirmation */}
      <AlertDialog open={clearStep === 1} onOpenChange={(open) => !open && setClearStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isAr ? 'تأكيد مسح البيانات' : 'Confirm Data Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'هل أنت متأكد أنك تريد مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع الدورات والطلاب والمعلمين والاشتراكات وجميع البيانات الأخرى. سيتم الاحتفاظ فقط بحسابات المدير.'
                : 'Are you sure you want to clear all data? This action cannot be undone. All courses, students, teachers, subscriptions, and all other data will be permanently deleted. Only admin accounts will be preserved.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearStep(0)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setClearStep(2); setBackupDownloaded(false); setAppNameInput(''); setDeleteCodeInput(''); }}
            >
              {isAr ? 'متابعة' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Final Confirmation with Backup + Inputs */}
      <Dialog open={clearStep === 2} onOpenChange={(open) => !open && setClearStep(0)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {isAr ? 'تأكيد نهائي' : 'Final Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? 'يجب تحميل نسخة احتياطية أولاً ثم إدخال الرمز للتأكيد.'
                : 'You must download a backup first, then enter the confirmation code to proceed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {isAr
                  ? '⚠️ تحذير: سيتم حذف جميع البيانات نهائياً ولا يمكن استرجاعها!'
                  : '⚠️ WARNING: All data will be permanently deleted and cannot be recovered!'}
              </p>
            </div>

            {/* Backup Section */}
            <div className="space-y-2">
              <Label className="font-medium">
                {isAr ? '1. تحميل نسخة احتياطية (مطلوب)' : '1. Download Backup (Required)'}
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackup('json')}
                  disabled={backupLoading}
                  className="flex-1"
                >
                  {backupLoading ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Download className="h-4 w-4 me-1" />}
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBackup('csv')}
                  disabled={backupLoading}
                  className="flex-1"
                >
                  {backupLoading ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Download className="h-4 w-4 me-1" />}
                  CSV
                </Button>
              </div>
              {backupDownloaded && (
                <p className="text-xs text-primary flex items-center gap-1">✓ {isAr ? 'تم تحميل النسخة الاحتياطية' : 'Backup downloaded'}</p>
              )}
            </div>

            {/* App Name Input */}
            <div className="space-y-2">
              <Label>
                {isAr ? `2. اكتب اسم التطبيق "${appName}"` : `2. Type the app name "${appName}"`}
              </Label>
              <Input
                value={appNameInput}
                onChange={(e) => setAppNameInput(e.target.value)}
                placeholder={appName}
                className={appNameInput === appName ? 'border-primary' : ''}
              />
            </div>

            {/* DELETE NOW Input */}
            <div className="space-y-2">
              <Label>
                {isAr ? '3. اكتب "DELETE NOW" للتأكيد' : '3. Type "DELETE NOW" to confirm'}
              </Label>
              <Input
                value={deleteCodeInput}
                onChange={(e) => setDeleteCodeInput(e.target.value)}
                placeholder="DELETE NOW"
                className={deleteCodeInput === 'DELETE NOW' ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setClearStep(0)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={!canDelete || clearLoading}
            >
              {clearLoading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? 'حذف جميع البيانات نهائياً' : 'Permanently Delete All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataManagementCard;