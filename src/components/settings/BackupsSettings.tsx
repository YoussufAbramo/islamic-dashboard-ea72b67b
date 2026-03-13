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
import { HardDrive, Plus, Download, Trash2, Loader2, FileJson, FileText, Database, Clock, AlertTriangle, RefreshCw, Save, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { logAction } from '@/lib/actionsQueue';

interface BackupFile {
  name: string;
  size: number;
  created_at: string;
  format: string;
}

// ==================== Auto Backup Config Card ====================
const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i;
  const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
  return { value: `${String(h).padStart(2, '0')}:00`, label };
});

const AutoBackupCard = ({ isAr }: { isAr: boolean }) => {
  const [config, setConfig] = useState({ enabled: false, schedule: 'daily', retention_count: 7, format: 'json', scheduled_time: '02:00' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Read backup config from app_settings.settings jsonb
    supabase.from('app_settings').select('settings').limit(1).single().then(({ data }) => {
      if (data?.settings) {
        const s = data.settings as any;
        if (s.backup_config) {
          setConfig({
            enabled: s.backup_config.enabled ?? false,
            schedule: s.backup_config.schedule ?? 'daily',
            retention_count: s.backup_config.retention_count ?? 7,
            format: s.backup_config.format ?? 'json',
            scheduled_time: s.backup_config.scheduled_time ?? '02:00',
          });
        }
      }
      setLoading(false);
    });
  }, []);

  const update = (patch: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Read current settings, merge backup_config into it
      const { data: current } = await supabase.from('app_settings').select('id, settings').limit(1).single();
      if (!current) throw new Error('No app_settings row found');
      const currentSettings = (current.settings as any) || {};
      const merged = { ...currentSettings, backup_config: { enabled: config.enabled, schedule: config.schedule, retention_count: config.retention_count, format: config.format, scheduled_time: config.scheduled_time } };
      const { error } = await supabase.from('app_settings').update({ settings: merged, updated_at: new Date().toISOString() }).eq('id', current.id);
      if (error) throw error;
      logAction('modify', 'Cron Job', `Auto backup ${config.enabled ? 'enabled' : 'disabled'} — ${config.schedule} at ${config.scheduled_time} UTC`, undefined, `Format: ${config.format}, Retention: ${config.retention_count}`);
      toast.success(isAr ? 'تم حفظ إعدادات النسخ التلقائي' : 'Auto backup settings saved');
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const testBackup = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-backups', { body: { action: 'test_auto_backup' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      logAction('add', 'Backup', `Test auto backup created: ${data.fileName}`, undefined, `${data.totalRecords} records`);
      toast.success(isAr ? `تم إنشاء نسخة تجريبية: ${data.fileName} (${data.totalRecords} سجل)` : `Test backup created: ${data.fileName} (${data.totalRecords} records)`);
    } catch (err: any) {
      toast.error(err.message || 'Test backup failed');
    } finally { setTesting(false); }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? 'النسخ الاحتياطي التلقائي' : 'Auto Backups'}
            </CardTitle>
            <CardDescription>{isAr ? 'إنشاء نسخ احتياطية تلقائياً حسب الجدول المحدد' : 'Automatically create backups on a schedule'}</CardDescription>
          </div>
          <Badge variant={config.enabled ? 'default' : 'secondary'} className={config.enabled ? 'bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600' : ''}>
            {config.enabled ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Off')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isAr ? 'تفعيل النسخ الاحتياطي التلقائي' : 'Enable Auto Backups'}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'يتم التشغيل تلقائياً حسب الجدول أدناه' : 'Runs automatically on the schedule below'}</p>
          </div>
          <Switch checked={config.enabled} onCheckedChange={v => update({ enabled: v })} />
        </div>

        {/* Settings */}
        <div className={`space-y-4 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Schedule */}
            <div className="space-y-2">
              <Label>{isAr ? 'الجدول الزمني' : 'Schedule'}</Label>
              <Select value={config.schedule} onValueChange={v => update({ schedule: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{isAr ? 'يومياً' : 'Daily'}</SelectItem>
                  <SelectItem value="weekly">{isAr ? 'أسبوعياً' : 'Weekly'}</SelectItem>
                  <SelectItem value="monthly">{isAr ? 'شهرياً' : 'Monthly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>{isAr ? 'وقت التنفيذ (UTC)' : 'Run Time (UTC)'}</Label>
              <Select value={config.scheduled_time} onValueChange={v => update({ scheduled_time: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Retention */}
            <div className="space-y-2">
              <Label>{isAr ? 'الاحتفاظ بآخر' : 'Keep Last'}</Label>
              <Select value={String(config.retention_count)} onValueChange={v => update({ retention_count: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 14, 30].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} {isAr ? 'نسخة' : 'backups'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>{isAr ? 'التنسيق' : 'Format'}</Label>
              <Select value={config.format} onValueChange={v => update({ format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="json"><span className="flex items-center gap-2"><FileJson className="h-4 w-4" /> JSON</span></SelectItem>
                  <SelectItem value="sql"><span className="flex items-center gap-2"><Database className="h-4 w-4" /> SQL</span></SelectItem>
                  <SelectItem value="csv"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> CSV</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isAr
              ? `سيتم إنشاء نسخة ${config.schedule === 'daily' ? 'يومياً' : config.schedule === 'weekly' ? 'كل يوم أحد' : 'في أول كل شهر'} الساعة ${HOURS_OPTIONS.find(o => o.value === config.scheduled_time)?.label || config.scheduled_time} (UTC) والاحتفاظ بآخر ${config.retention_count} نسخة. النسخ القديمة تحذف تلقائياً.`
              : `A backup will run ${config.schedule === 'daily' ? 'every day' : config.schedule === 'weekly' ? 'every Sunday' : 'on the 1st of each month'} at ${HOURS_OPTIONS.find(o => o.value === config.scheduled_time)?.label || config.scheduled_time} (UTC), keeping the last ${config.retention_count}. Older auto-backups are deleted automatically.`}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          {dirty && (
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Save className="h-4 w-4 me-1" />}
              {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== Main Backups Component ====================
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
  const [backupingSettings, setBackupingSettings] = useState(false);

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
    { key: 'course_categories', label: 'Course Categories', labelAr: 'تصنيفات الدورات' },
    { key: 'course_levels', label: 'Course Levels', labelAr: 'مستويات الدورات' },
    { key: 'course_tracks', label: 'Course Tracks', labelAr: 'مسارات الدورات' },
    { key: 'lessons', label: 'Lessons', labelAr: 'الدروس' },
    { key: 'lesson_sections', label: 'Lesson Sections', labelAr: 'أقسام الدروس' },
    { key: 'students', label: 'Students', labelAr: 'الطلاب' },
    { key: 'teachers', label: 'Teachers', labelAr: 'المعلمين' },
    { key: 'teacher_courses', label: 'Teacher Courses', labelAr: 'دورات المعلمين' },
    { key: 'profiles', label: 'Profiles', labelAr: 'الملفات الشخصية' },
    { key: 'user_roles', label: 'User Roles', labelAr: 'أدوار المستخدمين' },
    { key: 'subscriptions', label: 'Subscriptions', labelAr: 'الاشتراكات' },
    { key: 'invoices', label: 'Invoices', labelAr: 'الفواتير' },
    { key: 'timetable_entries', label: 'Timetable', labelAr: 'الجداول الزمنية' },
    { key: 'attendance', label: 'Attendance', labelAr: 'الحضور' },
    { key: 'session_reports', label: 'Session Reports', labelAr: 'تقارير الحصص' },
    { key: 'certificates', label: 'Certificates', labelAr: 'الشهادات' },
    { key: 'student_progress', label: 'Student Progress', labelAr: 'تقدم الطلاب' },
    { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات' },
    { key: 'notifications', label: 'Notifications', labelAr: 'الإشعارات' },
    { key: 'chats', label: 'Chats', labelAr: 'المحادثات' },
    { key: 'chat_messages', label: 'Chat Messages', labelAr: 'رسائل المحادثات' },
    { key: 'chat_members', label: 'Chat Members', labelAr: 'أعضاء المحادثات' },
    { key: 'support_tickets', label: 'Support Tickets', labelAr: 'تذاكر الدعم' },
    { key: 'support_departments', label: 'Support Departments', labelAr: 'أقسام الدعم' },
    { key: 'support_priorities', label: 'Support Priorities', labelAr: 'أولويات الدعم' },
    { key: 'pricing_packages', label: 'Pricing Packages', labelAr: 'باقات الأسعار' },
    { key: 'payout_requests', label: 'Payout Requests', labelAr: 'طلبات الصرف' },
    { key: 'expenses', label: 'Expenses', labelAr: 'المصروفات' },
    { key: 'expense_categories', label: 'Expense Categories', labelAr: 'تصنيفات المصروفات' },
    { key: 'ebooks', label: 'E-Books', labelAr: 'الكتب الإلكترونية' },
    { key: 'ebook_views', label: 'E-Book Views', labelAr: 'مشاهدات الكتب' },
    { key: 'ebook_downloads', label: 'E-Book Downloads', labelAr: 'تنزيلات الكتب' },
    { key: 'landing_content', label: 'Landing Content', labelAr: 'محتوى الصفحة' },
    { key: 'blog_posts', label: 'Blog Posts', labelAr: 'المقالات' },
    { key: 'website_pages', label: 'Website Pages', labelAr: 'صفحات الموقع' },
    { key: 'policies', label: 'Policies', labelAr: 'السياسات' },
    { key: 'app_settings', label: 'App Settings', labelAr: 'إعدادات التطبيق' },
    { key: 'payment_gateway_config', label: 'Payment Gateway', labelAr: 'بوابة الدفع' },
    { key: 'payment_gateway_config', label: 'Payment Gateway', labelAr: 'بوابة الدفع' },
    { key: 'audit_logs', label: 'Audit Logs', labelAr: 'سجل المراجعة' },
    { key: 'seed_sessions', label: 'Seed Sessions', labelAr: 'جلسات البيانات التجريبية' },
    { key: 'seed_records', label: 'Seed Records', labelAr: 'سجلات البيانات التجريبية' },
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

        {/* Run a Full Backup Now — standalone button */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">{isAr ? 'تشغيل نسخة احتياطية شاملة الآن' : 'Run a Full Backup Now'}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'إنشاء نسخة احتياطية فورية لجميع الجداول' : 'Instantly create a full backup of all database tables'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={async () => {
              setCreating(true);
              try {
                const { data, error } = await supabase.functions.invoke('manage-backups', { body: { action: 'test_auto_backup' } });
                if (error) throw error;
                if (data?.error) throw new Error(data.error);
                toast.success(isAr ? `تم إنشاء نسخة شاملة: ${data.fileName} (${data.totalRecords} سجل)` : `Full backup created: ${data.fileName} (${data.totalRecords} records)`);
                fetchBackups();
              } catch (err: any) { toast.error(err.message || 'Backup failed'); }
              finally { setCreating(false); }
            }} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Database className="h-4 w-4 me-1" />}
              {isAr ? 'إنشاء نسخة احتياطية كاملة' : 'Generate Full Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Backup App Settings Only */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">{isAr ? 'نسخ إعدادات التطبيق' : 'Backup App Settings'}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'نسخة احتياطية لإعدادات التطبيق، النسخ التلقائي، وبوابة الدفع فقط' : 'Export app settings, auto backup config, and payment gateway config only'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={async () => {
              setBackupingSettings(true);
              try {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-CA', { timeZone: defaultTimezone });
                const timeStr = now.toLocaleTimeString('en-GB', { timeZone: defaultTimezone, hour12: false }).replace(/:/g, '-');
                const name = `settings-backup-${dateStr}_${timeStr}`;
                const { data, error } = await supabase.functions.invoke('manage-backups', {
                  body: { action: 'create_backup', name, format: 'json', tables: ['app_settings', 'payment_gateway_config', 'landing_content', 'pricing_packages', 'policies'] },
                });
                if (error) throw error;
                if (data?.error) throw new Error(data.error);
                toast.success(isAr ? `تم نسخ الإعدادات: ${data.file}` : `Settings backup created: ${data.file}`);
                fetchBackups();
              } catch (err: any) { toast.error(err.message || 'Backup failed'); }
              finally { setBackupingSettings(false); }
            }} disabled={backupingSettings}>
              {backupingSettings ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Settings className="h-4 w-4 me-1" />}
              {isAr ? 'إنشاء نسخة إعدادات التطبيق' : 'Generate App Settings Backup'}
            </Button>
          </CardContent>
        </Card>
        <AutoBackupCard isAr={isAr} />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              {isAr ? 'إنشاء نسخة احتياطية' : 'Create Backup'}
            </DialogTitle>
            <DialogDescription>{isAr ? 'سيتم تصدير البيانات المحددة وحفظها كملف نسخة احتياطية' : 'Selected data will be exported and saved as a backup file'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Top Row: Name + Format side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-xs font-medium">{isAr ? 'اسم الملف' : 'File Name'}</Label>
                <Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder={isAr ? 'اسم النسخة الاحتياطية' : 'Backup name'} />
                <p className="text-[10px] text-muted-foreground">{isAr ? `المنطقة الزمنية: ${defaultTimezone}` : `Timezone: ${defaultTimezone}`}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">{isAr ? 'التنسيق' : 'Format'}</Label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'json', icon: FileJson, label: 'JSON' },
                    { value: 'sql', icon: Database, label: 'SQL' },
                    { value: 'csv', icon: FileText, label: 'CSV' },
                  ].map(fmt => {
                    const Icon = fmt.icon;
                    const isSelected = backupFormat === fmt.value;
                    return (
                      <button
                        key={fmt.value}
                        onClick={() => setBackupFormat(fmt.value as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{isAr ? 'تعليق (اختياري)' : 'Comment (optional)'}</Label>
              <Textarea value={backupComment} onChange={(e) => setBackupComment(e.target.value)} placeholder={isAr ? 'أضف تعليقاً على هذه النسخة...' : 'Add a comment for this backup...'} rows={2} className="resize-none" />
            </div>

            {/* Table Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? 'البيانات المشمولة' : 'Data to Include'}</Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-primary" onClick={selectAll}>{isAr ? 'تحديد الكل' : 'Select All'}</Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-muted-foreground" onClick={deselectAll}>{isAr ? 'إلغاء الكل' : 'None'}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto p-3 rounded-lg border border-border bg-muted/20">
                {ALL_BACKUP_TABLES.map(t => (
                  <label key={t.key} className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer text-xs transition-colors ${
                    selectedTables[t.key] ? 'bg-primary/5 text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                  }`}>
                    <Checkbox checked={selectedTables[t.key]} onCheckedChange={() => toggleTable(t.key)} />
                    <span>{isAr ? t.labelAr : t.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? `${Object.values(selectedTables).filter(Boolean).length} من ${ALL_BACKUP_TABLES.length} جدول محدد` : `${Object.values(selectedTables).filter(Boolean).length} of ${ALL_BACKUP_TABLES.length} tables selected`}
                </p>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">{backupFormat}</Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreate} disabled={creating || !backupName.trim()}>
              {creating && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
              <HardDrive className="h-4 w-4 me-1" />
              {isAr ? 'إنشاء الآن' : 'Create Backup'}
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
