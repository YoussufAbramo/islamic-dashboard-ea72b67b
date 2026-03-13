import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, RotateCcw, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { useNavigate } from 'react-router-dom';

interface SystemResetCardProps {
  isAr: boolean;
}

const CONFIRMATION_PHRASE = 'RESET SYSTEM';

const SystemResetCard = ({ isAr }: SystemResetCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const isConfirmed = confirmInput === CONFIRMATION_PHRASE;

  const handleReset = async () => {
    setShowFinalConfirm(false);
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-data', {
        body: { action: 'system_reset', confirmation: CONFIRMATION_PHRASE },
      });
      const serverError = data?.error;
      if (error || serverError) throw new Error(serverError || error?.message);

      setResult(data);
      toast.success(
        isAr
          ? 'تم إعادة تعيين النظام بنجاح'
          : 'System reset completed successfully'
      );
    } catch (err: any) {
      notifyError({ error: 'DB_OPERATION_FAILED', isAr, rawMessage: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setConfirmInput('');
    if (result) {
      setResult(null);
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive text-base">
                {isAr ? 'إعادة تعيين النظام' : 'System Reset'}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isAr
                  ? 'إعادة النظام إلى حالة التثبيت الأولى — حذف جميع البيانات نهائياً'
                  : 'Restore to fresh install state — permanently erases all data'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Compact two-column info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* What's deleted */}
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {isAr ? 'سيتم حذفه' : 'Will be deleted'}
                </span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>{isAr ? 'جميع المستخدمين والدورات والاشتراكات' : 'All users, courses & subscriptions'}</li>
                <li>{isAr ? 'المحادثات والشهادات والتقارير' : 'Chats, certificates & reports'}</li>
                <li>{isAr ? 'الملفات المرفوعة وسجلات التدقيق' : 'Uploaded files & audit logs'}</li>
              </ul>
            </div>

            {/* What's preserved */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {isAr ? 'سيتم الاحتفاظ به' : 'Preserved'}
                </span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>{isAr ? 'حساب المدير الحالي ودوره' : 'Your admin account & role'}</li>
                <li>{isAr ? 'هيكل قاعدة البيانات' : 'Database schema & migrations'}</li>
                <li>{isAr ? 'ملفات النظام المحلية' : 'Local system assets'}</li>
              </ul>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 me-1.5" />
            {isAr ? 'بدء إعادة تعيين النظام' : 'Initiate System Reset'}
          </Button>
        </CardContent>
      </Card>

      {/* Step 1: Type confirmation phrase */}
      <Dialog open={showDialog && !showFinalConfirm} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {isAr ? 'تأكيد إعادة تعيين النظام' : 'Confirm System Reset'}
            </DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium text-destructive">
                  {isAr
                    ? 'سيتم حذف جميع البيانات بشكل دائم!'
                    : 'All data will be permanently deleted!'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr
                    ? 'يُنصح بإنشاء نسخة احتياطية قبل المتابعة.'
                    : 'It is recommended to create a backup before proceeding.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? `اكتب "${CONFIRMATION_PHRASE}" أدناه لتأكيد الإجراء:`
                    : `Type "${CONFIRMATION_PHRASE}" below to confirm:`}
                </p>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={CONFIRMATION_PHRASE}
                  className="font-mono text-center tracking-wider"
                  disabled={loading}
                  autoComplete="off"
                />
                {confirmInput.length > 0 && !isConfirmed && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {isAr ? 'العبارة غير صحيحة' : 'Phrase does not match'}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowFinalConfirm(true)}
                  disabled={!isConfirmed || loading}
                >
                  {isAr ? 'متابعة' : 'Proceed'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success result */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">
                  {isAr ? 'تم إعادة تعيين النظام بنجاح' : 'System Reset Complete'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr
                    ? `تم حذف ${result.total_deleted} سجل.`
                    : `${result.total_deleted} records deleted.`}
                </p>
              </div>

              {/* Deleted counts */}
              {result.counts && Object.keys(result.counts).length > 0 && (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {isAr ? 'تفاصيل الحذف:' : 'Deletion details:'}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(result.counts as Record<string, number>)
                        .filter(([, v]) => (v as number) > 0)
                        .map(([key, val]) => (
                          <div key={key} className="text-[10px] bg-muted/50 rounded px-2 py-1 flex items-center justify-between">
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-mono font-medium">{val as number}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </ScrollArea>
              )}

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">
                    {isAr ? 'تحذيرات:' : 'Warnings:'}
                  </p>
                  {result.errors.map((err: string, i: number) => (
                    <p key={i} className="text-[10px] text-destructive/80 font-mono">{err}</p>
                  ))}
                </div>
              )}

              <Separator />

              <DialogFooter>
                <Button size="sm" onClick={handleClose}>
                  {isAr ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2: Final confirmation AlertDialog */}
      <AlertDialog open={showFinalConfirm} onOpenChange={(open) => { if (!open) setShowFinalConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {isAr ? 'تأكيد نهائي' : 'Final Confirmation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {isAr
                  ? 'أنت على وشك حذف جميع بيانات النظام نهائياً. هذا الإجراء لا يمكن التراجع عنه بأي شكل.'
                  : 'You are about to permanently erase ALL system data. This action is absolutely irreversible.'}
              </span>
              <span className="block font-semibold text-destructive">
                {isAr ? 'هل أنت متأكد تماماً أنك تريد المتابعة؟' : 'Are you absolutely sure you want to proceed?'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{isAr ? 'لا، إلغاء' : 'No, Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReset}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
              {loading
                ? (isAr ? 'جاري إعادة التعيين...' : 'Resetting...')
                : (isAr ? 'نعم، إعادة تعيين النظام' : 'Yes, Reset System')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemResetCard;
