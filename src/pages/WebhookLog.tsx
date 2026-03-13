import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

const WebhookLog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Placeholder log entries
  const logs = [
    { id: '1', endpoint: '/functions/v1/webhook/support_tickets', method: 'POST', status: 200, timestamp: new Date(Date.now() - 3600000).toISOString(), payload: '{"name":"Test","email":"test@example.com"}' },
    { id: '2', endpoint: '/functions/v1/webhook/support_tickets', method: 'POST', status: 400, timestamp: new Date(Date.now() - 7200000).toISOString(), payload: '{"name":"Missing fields"}' },
    { id: '3', endpoint: '/functions/v1/webhook/support_tickets', method: 'POST', status: 200, timestamp: new Date(Date.now() - 86400000).toISOString(), payload: '{"name":"Jane","email":"jane@test.com","subject":"Help"}' },
  ];

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status >= 400 && status < 500) return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return <Badge variant="outline" className="text-emerald-600 border-emerald-300">{status} OK</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="destructive">{status} Error</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <ComingSoonOverlay
      icon={Webhook}
      description="Webhook Log will track all incoming webhook requests and integration history."
      descriptionAr="سجل الويب هوك سيتتبع جميع طلبات الويب هوك الواردة وتاريخ التكامل."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            {isAr ? 'سجل الويب هوك' : 'Webhook Log'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'سجل جميع طلبات الويب هوك الواردة' : 'Log of all incoming webhook requests'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? 'الطلبات الأخيرة' : 'Recent Requests'}</CardTitle>
            <CardDescription>{isAr ? 'آخر طلبات الويب هوك المستلمة' : 'Latest webhook requests received'}</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? 'لا توجد سجلات' : 'No webhook logs yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-mono">{log.method}</Badge>
                        <span className="text-sm font-mono truncate">{log.endpoint}</span>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-w-full">
                        {log.payload}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ComingSoonOverlay>
  );
};

export default WebhookLog;
