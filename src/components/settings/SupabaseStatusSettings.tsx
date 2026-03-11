import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, ExternalLink, XCircle, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type Status = 'checking' | 'connected' | 'error';

const SupabaseStatusSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';

  const [status, setStatus] = useState<Status>(supabaseUrl ? 'checking' : 'error');

  useEffect(() => {
    if (!supabaseUrl) { setStatus('error'); return; }
    supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
      .then(({ error }) => setStatus(error ? 'error' : 'connected'));
  }, [supabaseUrl]);

  const badgeClass =
    status === 'connected' ? 'bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600' :
    status === 'error' ? 'bg-destructive hover:bg-destructive text-destructive-foreground border-destructive' :
    'bg-muted hover:bg-muted text-muted-foreground border-border';

  const StatusIcon = status === 'connected' ? CheckCircle : status === 'error' ? XCircle : CircleDashed;
  const label =
    status === 'connected' ? (isAr ? 'متصل' : 'Connected') :
    status === 'error' ? (isAr ? 'خطأ' : 'Error') :
    (isAr ? 'جارٍ الفحص...' : 'Checking...');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">{isAr ? 'اتصال Supabase' : 'Supabase Connection'}</CardTitle>
            <CardDescription>{isAr ? 'حالة الاتصال بقاعدة البيانات' : 'Database connection status'}</CardDescription>
          </div>
          <Badge className={`ms-auto gap-1 ${badgeClass}`}>
            <StatusIcon className="h-3 w-3" />
            {label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <span className="text-sm text-muted-foreground">{isAr ? 'عنوان المشروع' : 'Project URL'}</span>
            <span className="text-sm font-mono break-all">{supabaseUrl || '—'}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <span className="text-sm text-muted-foreground">{isAr ? 'معرف المشروع' : 'Project ID'}</span>
            <span className="text-sm font-mono">{projectId || '—'}</span>
          </div>
        </div>
        {status === 'connected' && projectId && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}>
            <ExternalLink className="h-3.5 w-3.5" />
            {isAr ? 'فتح لوحة Supabase' : 'Open Supabase Dashboard'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseStatusSettings;
