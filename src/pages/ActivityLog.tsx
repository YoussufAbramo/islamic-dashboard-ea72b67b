import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Clock, User, Settings, FileText, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockActivities = [
  { icon: User, action: 'User login', actionAr: 'تسجيل دخول', time: '2 min ago', timeAr: 'منذ دقيقتين' },
  { icon: Settings, action: 'Settings updated', actionAr: 'تحديث الإعدادات', time: '15 min ago', timeAr: 'منذ 15 دقيقة' },
  { icon: FileText, action: 'Invoice created', actionAr: 'إنشاء فاتورة', time: '1 hour ago', timeAr: 'منذ ساعة' },
  { icon: Shield, action: 'Role assigned', actionAr: 'تعيين دور', time: '3 hours ago', timeAr: 'منذ 3 ساعات' },
];

const ActivityLog = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{isAr ? 'قريباً' : 'Coming Soon'}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            {isAr
              ? 'سجل النشاطات سيكون متاحاً قريباً. ستتمكن من تتبع جميع الإجراءات والتغييرات في النظام.'
              : 'Activity Log will be available soon. You\'ll be able to track all actions and changes in the system.'}
          </p>
          <Badge variant="secondary" className="text-xs">{isAr ? 'قيد التطوير' : 'In Development'}</Badge>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          {isAr ? 'سجل النشاطات' : 'Activity Log'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? 'تتبع جميع الإجراءات في النظام' : 'Track all system actions and changes'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? 'النشاطات الأخيرة' : 'Recent Activities'}</CardTitle>
          <CardDescription>{isAr ? 'آخر الإجراءات في النظام' : 'Latest system actions'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockActivities.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{isAr ? activity.actionAr : activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isAr ? activity.timeAr : activity.time}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
