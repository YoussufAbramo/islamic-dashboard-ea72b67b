import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getErrorByCode, categoryLabels } from '@/lib/errorMessages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, Clock, Code, HelpCircle, Lightbulb, MessageSquare, ShieldAlert, Database, Wifi, HardDrive, Info } from 'lucide-react';
import { format } from 'date-fns';

const categoryIcons: Record<string, any> = {
  auth: ShieldAlert,
  validation: AlertTriangle,
  database: Database,
  network: Wifi,
  storage: HardDrive,
  general: Info,
};

const categoryColors: Record<string, string> = {
  auth: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  validation: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  database: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  network: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  storage: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  general: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

const ErrorDetails = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Try to get error context from sessionStorage
  const storedRaw = sessionStorage.getItem('last_error_detail');
  const stored = storedRaw ? JSON.parse(storedRaw) : null;

  // Get static error detail from map
  const staticDetail = code ? getErrorByCode(code) : null;

  // Prefer stored context (has timestamp/rawMessage), fall back to static
  const detail = stored?.code === code ? stored : staticDetail;

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{isAr ? 'تفاصيل الخطأ غير متوفرة' : 'Error Details Not Available'}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {isAr
            ? 'لم يتم العثور على تفاصيل لهذا الخطأ. قد تكون الجلسة قد انتهت.'
            : 'No details found for this error. The session may have expired.'}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 me-2" />
          {isAr ? 'رجوع' : 'Go Back'}
        </Button>
      </div>
    );
  }

  const category = detail.category || 'general';
  const CatIcon = categoryIcons[category] || Info;
  const catLabel = categoryLabels[category] || categoryLabels.general;
  const catColor = categoryColors[category] || categoryColors.general;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isAr ? 'تفاصيل الخطأ' : 'Error Details'}</h1>
      </div>

      {/* Main Error Card */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${catColor}`}>
              <CatIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl">
                {isAr ? detail.titleAr : detail.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${catColor}`}>
                  {isAr ? catLabel.ar : catLabel.en}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  {detail.code}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              {isAr ? 'ما حدث' : 'What Happened'}
            </div>
            <p className="text-sm leading-relaxed p-4 rounded-lg bg-muted/50 border border-border">
              {isAr ? detail.messageAr : detail.message}
            </p>
          </div>

          {/* Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              {isAr ? 'ماذا تفعل' : 'What To Do'}
            </div>
            <p className="text-sm leading-relaxed p-4 rounded-lg bg-primary/5 border border-primary/10">
              {isAr ? detail.suggestionAr : detail.suggestion}
            </p>
          </div>

          {/* Raw Error (if available) */}
          {stored?.rawMessage && stored.rawMessage !== detail.code && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Code className="h-4 w-4" />
                {isAr ? 'رسالة الخطأ التقنية' : 'Technical Error Message'}
              </div>
              <pre className="text-xs p-4 rounded-lg bg-muted border border-border overflow-x-auto font-mono">
                {stored.rawMessage}
              </pre>
            </div>
          )}

          {/* Timestamp */}
          {stored?.timestamp && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <Clock className="h-3.5 w-3.5" />
              {isAr ? 'وقت الحدوث:' : 'Occurred at:'} {format(new Date(stored.timestamp), 'PPpp')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
          <ArrowLeft className="h-4 w-4 me-2" />
          {isAr ? 'رجوع' : 'Go Back'}
        </Button>
        <Button onClick={() => navigate('/dashboard/support')} className="flex-1">
          <MessageSquare className="h-4 w-4 me-2" />
          {isAr ? 'تواصل مع الدعم' : 'Contact Support'}
        </Button>
      </div>
    </div>
  );
};

export default ErrorDetails;
