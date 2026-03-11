import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { HardDrive, Plus, Download, Trash2, Loader2, FileJson, FileText, Database, Clock, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface BackupFile {
  name: string;
  size: number;
  created_at: string;
  format: string;
}

const BackupsSettings = () => {
  const { language } = useLanguage();
  const { pending } = useAppSettings();
  const isAr = language === 'ar';
  const defaultTimezone = pending.defaultTimezone || 'UTC';
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [backupName, setBackupName] = useState('');
  const [backupFormat, setBackupFormat] = useState<'json' | 'sql' | 'csv'>('json');
  const [backupComment, setBackupComment] = useState('');

  // Comments stored in localStorage
  const [backupComments, setBackupComments] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem('backup_comments'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const saveComment = (name: string, comment: string) => {
    const next = { ...backupComments, [name]: comment };
    setBackupComments(next);
    localStorage.setItem('backup_comments', JSON.stringify(next));
  };

  const generateBackupName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: defaultTimezone }); // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: defaultTimezone, hour12: false }).replace(/:/g, '-'); // HH-MM-SS
    return `backup-${dateStr}_${timeStr}`;
  };

  const ALL_BACKUP_TABLES = [
    { key: 'courses', label: 'Courses', labelAr: 'الدورات' },
    { key: 'course_sections', label: 'Course Sections', labelAr: 'أقسام الدورات' },
    { key: 'lessons', label: 'Lessons', labelAr: 'الدروس' },
    { key: 'students', label: 'Students', labelAr: 'الطلاب' },
    { key: 'teachers', label: 'Teachers', labelAr: 'المعلمين' },
    { key: 'profiles', label: 'Profiles', labelAr: 'الملفات الشخصية' },
    { key: 'user_roles', label: 'User Roles', labelAr: 'أدوار المستخدمين' },
    { key: 'subscriptions', label: 'Subscriptions', labelAr: 'الاشتراكات' },
    { key: 'invoices', label: 'Invoices', labelAr: 'الفواتير' },
    { key: 'timetable_entries', label: 'Timetable', labelAr: 'الجداول الزمنية' },
    { key: 'attendance', label: 'Attendance', labelAr: 'الحضور' },
    { key: 'certificates', label: 'Certificates', labelAr: 'الشهادات' },
    { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات' },
    { key: 'notifications', label: 'Notifications', labelAr: 'الإشعارات' },
    { key: 'chats', label: 'Chats', labelAr: 'المحادثات' },
    { key: 'chat_messages', label: 'Chat Messages', labelAr: 'رسائل المحادثات' },
    { key: 'support_tickets', label: 'Support Tickets', labelAr: 'تذاكر الدعم' },
    { key: 'student_progress', label: 'Student Progress', labelAr: 'تقدم الطلاب' },
    { key: 'pricing_packages', label: 'Pricing Packages', labelAr: 'باقات الأسعار' },
    { key: 'landing_content', label: 'Landing Content', labelAr: 'محتوى الصفحة' },
  ];

  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_BACKUP_TABLES.map(t => [t.key, true]))
  );

  const toggleTable = (key: string) => setSelectedTables(prev => ({ ...prev, [key]: !prev[key] }));
  const selectAll = () => setSelectedTables(Object.fromEntries(ALL_BACKUP_TABLES.map(t => [t.key, true])));
  const deselectAll = () => setSelectedTables(Object.fromEntries(ALL_BACKUP_TABLES.map(t => [t.key, false])));

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-backups', { body: { action: 'list_backups' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBackups(data.backups || []);
    } catch (err: any) { notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message || 'Failed to load backups' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreate = async () => {
    if (!backupName.trim()) { notifyError({ error: 'VAL_BACKUP_NAME', isAr }); return; }
    setCreating(true);
    try {
      const tablesToBackup = Object.keys(selectedTables).filter(k => selectedTables[k]);
      if (tablesToBackup.length === 0) { notifyError({ error: 'VAL_SELECT_TABLE', isAr }); setCreating(false); return; }
      const appSettings = { ...pending };
      const { data, error } = await supabase.functions.invoke('manage-backups', {
        body: { action: 'create_backup', name: backupName.trim(), format: backupFormat, appSettings, tables: tablesToBackup },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (backupComment.trim()) saveComment(data.file, backupComment.trim());
      toast.success(isAr ? `تم إنشاء النسخة الاحتياطية: ${data.file} (${data.total_records} سجل)` : `Backup created: ${data.file} (${data.total_records} records)`);
      setShowCreate(false);
      setBackupName('');
      setBackupComment('');
      fetchBackups();
    } catch (err: any) { notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message || 'Failed to create backup' }); }
    finally { setCreating(false); }
  };

  const handleDownload = async (fileName: string) => {
    setDownloading(fileName);
    try {
      const { data, error } = await supabase.functions.invoke('manage-backups', { body: { action: 'download_backup', fileName } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      window.open(data.url, '_blank');
    } catch (err: any) { notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message || 'Failed to download backup' }); }
    finally { setDownloading(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-backups', { body: { action: 'delete_backup', fileName: deleteTarget } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(isAr ? 'تم حذف النسخة الاحتياطية' : 'Backup deleted');
      setDeleteTarget(null);
      fetchBackups();
    } catch (err: any) { notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message || 'Failed to delete backup' }); }
    finally { setDeleting(false); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatIcon = (format: string) => {
    if (format === 'json') return <FileJson className="h-4 w-4 text-primary" />;
    if (format === 'sql') return <Database className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" />{isAr ? 'النسخ الاحتياطية' : 'Backups'}</CardTitle>
                <CardDescription>{isAr ? 'إنشاء وإدارة النسخ الاحتياطية لبيانات المنصة' : 'Create and manage platform data backups'}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchBackups} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 me-1 ${loading ? 'animate-spin' : ''}`} />{isAr ? 'تحديث' : 'Refresh'}
                </Button>
                <Button size="sm" onClick={() => { setShowCreate(true); setBackupName(generateBackupName()); setBackupComment(''); }}>
                  <Plus className="h-4 w-4 me-1" />{isAr ? 'إنشاء نسخة احتياطية' : 'Create Backup'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{isAr ? 'لا توجد نسخ احتياطية' : 'No backups yet'}</p>
                <p className="text-sm mt-1">{isAr ? 'أنشئ أول نسخة احتياطية لحماية بياناتك' : 'Create your first backup to protect your data'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div key={backup.name} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    {formatIcon(backup.format)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{backup.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(backup.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</span>
                        <span>{formatSize(backup.size)}</span>
                        <span className="uppercase font-mono">{backup.format}</span>
                      </div>
                      {backupComments[backup.name] && (
                        <p className="text-xs text-muted-foreground mt-1 italic">💬 {backupComments[backup.name]}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(backup.name)} disabled={downloading === backup.name}>
                        {downloading === backup.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(backup.name)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AutoBackupCard isAr={isAr} />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />{isAr ? 'إنشاء نسخة احتياطية' : 'Create Backup'}</DialogTitle>
            <DialogDescription>{isAr ? 'سيتم تصدير جميع بيانات المنصة وحفظها في ملف نسخة احتياطية' : 'All platform data will be exported and saved as a backup file'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'اسم الملف' : 'File Name'}</Label>
              <Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder={isAr ? 'اسم النسخة الاحتياطية' : 'Backup name'} />
              <p className="text-xs text-muted-foreground">{isAr ? `المنطقة الزمنية: ${defaultTimezone}` : `Timezone: ${defaultTimezone}`}</p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'تعليق (اختياري)' : 'Comment (optional)'}</Label>
              <Textarea value={backupComment} onChange={(e) => setBackupComment(e.target.value)} placeholder={isAr ? 'أضف تعليقاً على هذه النسخة...' : 'Add a comment for this backup...'} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'التنسيق' : 'Format'}</Label>
              <Select value={backupFormat} onValueChange={(v) => setBackupFormat(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="json"><span className="flex items-center gap-2"><FileJson className="h-4 w-4" /> JSON</span></SelectItem>
                  <SelectItem value="sql"><span className="flex items-center gap-2"><Database className="h-4 w-4" /> SQL</span></SelectItem>
                  <SelectItem value="csv"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> CSV</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{isAr ? 'البيانات المشمولة' : 'Select Data to Backup'}</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAll}>{isAr ? 'تحديد الكل' : 'Select All'}</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={deselectAll}>{isAr ? 'إلغاء الكل' : 'Deselect All'}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto p-3 rounded-lg border border-border bg-muted/30">
                {ALL_BACKUP_TABLES.map(t => (
                  <label key={t.key} className="flex items-center gap-2 py-1 cursor-pointer text-sm hover:text-foreground">
                    <Checkbox checked={selectedTables[t.key]} onCheckedChange={() => toggleTable(t.key)} />
                    <span className={selectedTables[t.key] ? 'text-foreground' : 'text-muted-foreground'}>{isAr ? t.labelAr : t.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr ? `${Object.values(selectedTables).filter(Boolean).length} من ${ALL_BACKUP_TABLES.length} جدول محدد` : `${Object.values(selectedTables).filter(Boolean).length} of ${ALL_BACKUP_TABLES.length} tables selected`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreate} disabled={creating || !backupName.trim()}>
              {creating && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? 'إنشاء الآن' : 'Create Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />{isAr ? 'حذف النسخة الاحتياطية' : 'Delete Backup'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? `هل أنت متأكد من حذف "${deleteTarget}"؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete "${deleteTarget}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupsSettings;
