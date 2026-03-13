import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getActions, clearActions, type ActionEntry } from '@/lib/actionsQueue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/EmptyState';
import { Search, Trash2, Plus, Pencil, Minus, Zap, Eye, RefreshCw, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const typeConfig: Record<string, { icon: any; label: string; labelAr: string; color: string }> = {
  add: { icon: Plus, label: 'Add', labelAr: 'إضافة', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  modify: { icon: Pencil, label: 'Modify', labelAr: 'تعديل', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  delete: { icon: Minus, label: 'Delete', labelAr: 'حذف', color: 'bg-destructive/15 text-destructive border-destructive/30' },
  other: { icon: Zap, label: 'Action', labelAr: 'إجراء', color: 'bg-primary/15 text-primary border-primary/30' },
};

const ActionsQueue = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ActionEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadActions = () => setActions(getActions());

  useEffect(() => {
    loadActions();
    const handler = () => loadActions();
    window.addEventListener('actions-queue-update', handler);
    return () => window.removeEventListener('actions-queue-update', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = actions;
    if (typeFilter !== 'all') list = list.filter(a => a.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.summary.toLowerCase().includes(q) ||
        a.entity.toLowerCase().includes(q) ||
        (a.details || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [actions, typeFilter, search]);

  const stats = useMemo(() => ({
    total: actions.length,
    add: actions.filter(a => a.type === 'add').length,
    modify: actions.filter(a => a.type === 'modify').length,
    delete: actions.filter(a => a.type === 'delete').length,
  }), [actions]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{isAr ? 'سجل العمليات' : 'Actions Queue'}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="add">{isAr ? 'إضافة' : 'Add'}</SelectItem>
              <SelectItem value="modify">{isAr ? 'تعديل' : 'Modify'}</SelectItem>
              <SelectItem value="delete">{isAr ? 'حذف' : 'Delete'}</SelectItem>
              <SelectItem value="other">{isAr ? 'أخرى' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadActions} className="h-9 w-9"><RefreshCw className="h-4 w-4" /></Button>
          {actions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmClear(true)}>
              <Trash2 className="h-4 w-4 me-1" />{isAr ? 'مسح' : 'Clear'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, color: 'text-foreground' },
          { label: isAr ? 'إضافة' : 'Added', value: stats.add, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: isAr ? 'تعديل' : 'Modified', value: stats.modify, color: 'text-amber-600 dark:text-amber-400' },
          { label: isAr ? 'حذف' : 'Deleted', value: stats.delete, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={cn('text-xl font-bold', s.color)}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListOrdered} title={isAr ? 'لا توجد عمليات مسجلة' : 'No actions recorded'} description={isAr ? 'ستظهر العمليات هنا عند إجراء أي تغيير' : 'Actions will appear here when you make changes'} />
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const cfg = typeConfig[a.type] || typeConfig.other;
            const Icon = cfg.icon;
            return (
              <Card key={a.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(a)}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className={cn('flex items-center justify-center h-8 w-8 rounded-full shrink-0 border', cfg.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.summary}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.entity}{a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn('text-[10px] border', cfg.color)}>{isAr ? cfg.labelAr : cfg.label}</Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(a.timestamp)}</span>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'تفاصيل العملية' : 'Action Details'}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const cfg = typeConfig[selected.type] || typeConfig.other;
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('border', cfg.color)}>{isAr ? cfg.labelAr : cfg.label}</Badge>
                  <span className="text-xs text-muted-foreground">{formatTime(selected.timestamp)}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{selected.summary}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? 'الكيان' : 'Entity'}: {selected.entity}</p>
                  {selected.entityId && <p className="text-xs text-muted-foreground">ID: {selected.entityId}</p>}
                </div>
                {selected.details && (
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">{selected.details}</pre>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'مسح السجل' : 'Clear Actions'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من مسح جميع العمليات المسجلة؟' : 'Are you sure you want to clear all recorded actions?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearActions(); loadActions(); setConfirmClear(false); }}>{isAr ? 'مسح' : 'Clear'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActionsQueue;
