import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, RefreshCw, Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { TableSkeleton } from '@/components/PageSkeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  changed_fields: string[] | null;
  created_at: string;
  user_profile?: { full_name: string; email: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  UPDATE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  DELETE: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

const TABLE_LABELS: Record<string, { en: string; ar: string }> = {
  students: { en: 'Students', ar: 'الطلاب' },
  teachers: { en: 'Teachers', ar: 'المعلمون' },
  courses: { en: 'Courses', ar: 'الدورات' },
  subscriptions: { en: 'Subscriptions', ar: 'الاشتراكات' },
  invoices: { en: 'Invoices', ar: 'الفواتير' },
  user_roles: { en: 'User Roles', ar: 'أدوار المستخدمين' },
  certificates: { en: 'Certificates', ar: 'الشهادات' },
  announcements: { en: 'Announcements', ar: 'الإعلانات' },
  support_tickets: { en: 'Support Tickets', ar: 'تذاكر الدعم' },
  profiles: { en: 'Profiles', ar: 'الملفات الشخصية' },
};

const AuditTrail = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (data && data.length > 0) {
      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set(data.map(l => l.user_id).filter(Boolean))] as string[];
      let profileMap: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name, email: p.email || '' }]));
        }
      }
      setLogs(data.map(l => ({ ...l, user_profile: l.user_id ? profileMap[l.user_id] || null : null })));
    } else {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = useMemo(() => {
    let result = logs.filter(log => {
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchTable = tableFilter === 'all' || log.table_name === tableFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        log.table_name.toLowerCase().includes(q) ||
        log.record_id?.toLowerCase().includes(q) ||
        log.user_profile?.full_name?.toLowerCase().includes(q) ||
        log.changed_fields?.some(f => f.toLowerCase().includes(q));
      return matchAction && matchTable && matchSearch;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [logs, actionFilter, tableFilter, search, sortOrder]);

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  const uniqueTables = [...new Set(logs.map(l => l.table_name))].sort();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss', isAr ? { locale: ar } : undefined);
    } catch { return dateStr; }
  };

  const getTableLabel = (name: string) => {
    const l = TABLE_LABELS[name];
    return l ? (isAr ? l.ar : l.en) : name;
  };

  const renderChangeSummary = (log: AuditLog) => {
    if (log.action === 'INSERT') return <span className="text-muted-foreground text-xs">{isAr ? 'سجل جديد' : 'New record'}</span>;
    if (log.action === 'DELETE') return <span className="text-muted-foreground text-xs">{isAr ? 'تم الحذف' : 'Deleted'}</span>;
    if (log.changed_fields && log.changed_fields.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {log.changed_fields.slice(0, 3).map(f => (
            <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">{f}</Badge>
          ))}
          {log.changed_fields.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">+{log.changed_fields.length - 3}</Badge>
          )}
        </div>
      );
    }
    return null;
  };

  const renderJsonDiff = (log: AuditLog) => {
    if (log.action === 'UPDATE' && log.old_data && log.new_data && log.changed_fields) {
      return (
        <div className="space-y-2">
          {log.changed_fields.map(field => (
            <div key={field} className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-mono font-semibold text-foreground">{field}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-500/5 rounded p-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{isAr ? 'القيمة القديمة' : 'Old value'}</p>
                  <p className="text-xs font-mono break-all text-red-600 dark:text-red-400">
                    {JSON.stringify(log.old_data[field], null, 2) ?? 'null'}
                  </p>
                </div>
                <div className="bg-emerald-500/5 rounded p-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{isAr ? 'القيمة الجديدة' : 'New value'}</p>
                  <p className="text-xs font-mono break-all text-emerald-600 dark:text-emerald-400">
                    {JSON.stringify(log.new_data[field], null, 2) ?? 'null'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    const data = log.new_data || log.old_data;
    if (data) {
      return (
        <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-64">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }
    return <p className="text-muted-foreground text-sm">{isAr ? 'لا توجد بيانات' : 'No data available'}</p>;
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'سجل التدقيق' : 'Audit Trail'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(p => p === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1 h-9">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? 'بحث في السجلات...' : 'Search logs...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 h-9">
            <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الإجراءات' : 'All Actions'}</SelectItem>
            <SelectItem value="INSERT">{isAr ? 'إنشاء' : 'Create'}</SelectItem>
            <SelectItem value="UPDATE">{isAr ? 'تعديل' : 'Update'}</SelectItem>
            <SelectItem value="DELETE">{isAr ? 'حذف' : 'Delete'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الجداول' : 'All Tables'}</SelectItem>
            {uniqueTables.map(t => (
              <SelectItem key={t} value={t}>{getTableLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || actionFilter !== 'all' || tableFilter !== 'all') && (
          <Badge variant="secondary" className="text-xs">
            {filtered.length} {isAr ? 'نتيجة' : 'results'}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي السجلات' : 'Total Logs'}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{logs.filter(l => l.action === 'INSERT').length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'إنشاء' : 'Creates'}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{logs.filter(l => l.action === 'UPDATE').length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'تعديل' : 'Updates'}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{logs.filter(l => l.action === 'DELETE').length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'حذف' : 'Deletes'}</p>
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">{isAr ? 'لا توجد سجلات تدقيق بعد' : 'No audit logs yet'}</p>
          <p className="text-sm mt-1">{isAr ? 'ستظهر السجلات تلقائياً عند إجراء أي تغييرات' : 'Logs will appear automatically when changes are made'}</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isAr ? 'المستخدم' : 'User'}</TableHead>
                  <TableHead className="w-[90px]">{isAr ? 'الإجراء' : 'Action'}</TableHead>
                  <TableHead>{isAr ? 'الجدول' : 'Table'}</TableHead>
                  <TableHead>{isAr ? 'التغييرات' : 'Changes'}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setDetailLog(log)}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{formatDate(log.created_at)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[150px]">{log.user_profile?.full_name || (isAr ? 'نظام' : 'System')}</p>
                        {log.user_profile?.email && <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{log.user_profile.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 border-none font-semibold ${ACTION_COLORS[log.action] || ''}`}>
                        {log.action === 'INSERT' ? (isAr ? 'إنشاء' : 'CREATE') : log.action === 'UPDATE' ? (isAr ? 'تعديل' : 'UPDATE') : (isAr ? 'حذف' : 'DELETE')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">{getTableLabel(log.table_name)}</Badge>
                    </TableCell>
                    <TableCell>{renderChangeSummary(log)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDetailLog(log); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailLog && (
                <>
                  <Badge className={`text-xs px-2 py-0.5 border-none ${ACTION_COLORS[detailLog.action] || ''}`}>
                    {detailLog.action}
                  </Badge>
                  <span className="font-mono text-sm">{getTableLabel(detailLog.table_name)}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailLog && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pe-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'المستخدم' : 'User'}</p>
                    <p className="font-medium">{detailLog.user_profile?.full_name || (isAr ? 'نظام' : 'System')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</p>
                    <p className="font-medium font-mono text-xs">{formatDate(detailLog.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'معرف السجل' : 'Record ID'}</p>
                    <p className="font-mono text-xs truncate">{detailLog.record_id || '—'}</p>
                  </div>
                  {detailLog.changed_fields && (
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'الحقول المتغيرة' : 'Changed Fields'}</p>
                      <p className="font-mono text-xs">{detailLog.changed_fields.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Data diff */}
                <div>
                  <p className="text-sm font-semibold mb-2">{isAr ? 'تفاصيل التغيير' : 'Change Details'}</p>
                  {renderJsonDiff(detailLog)}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditTrail;
