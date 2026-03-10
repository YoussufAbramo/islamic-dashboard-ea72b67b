import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Coins, MessageSquare, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

const GeneralSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, currencies } = useAppSettings();
  const isAr = language === 'ar';

  const [teacherCanChat, setTeacherCanChat] = useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('app_teacher_can_chat', String(teacherCanChat));
  }, [teacherCanChat]);

  return (
    <div className="space-y-6">
      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />{isAr ? 'العملة' : 'Currency'}</CardTitle>
          <CardDescription>{isAr ? 'اختر العملة الافتراضية وعدد الأرقام العشرية' : 'Choose the default currency and decimal places'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{isAr ? 'العملة' : 'Currency'}</Label>
              <Select value={pending.currency.name} onValueChange={(v) => { const c = currencies.find((c) => c.name === v); if (c) updatePending({ currency: c }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map((c) => <SelectItem key={c.name} value={c.name}>{c.symbol} — {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'عدد الأرقام العشرية' : 'Decimal Places'}</Label>
              <Select value={String(pending.currencyDecimals)} onValueChange={(v) => updatePending({ currencyDecimals: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} — {(1234.5678).toFixed(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{isAr ? 'مثال' : 'Example'}: {pending.currency.symbol}{(1234.56).toFixed(pending.currencyDecimals)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />{isAr ? 'صلاحيات المحادثة' : 'Chat Permissions'}</CardTitle>
          <CardDescription>{isAr ? 'التحكم في إمكانية بدء المعلمين للمحادثات' : 'Control whether teachers can initiate chats with students'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{isAr ? 'السماح للمعلمين ببدء محادثات' : 'Allow teachers to start chats'}</Label>
              <p className="text-sm text-muted-foreground">{isAr ? 'عند التفعيل، يمكن للمعلمين بدء محادثات مع طلابهم' : 'When enabled, teachers can initiate chats with their students'}</p>
            </div>
            <Switch checked={teacherCanChat} onCheckedChange={setTeacherCanChat} />
          </div>
        </CardContent>
      </Card>
      {/* Default Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />{isAr ? 'اللغة الافتراضية' : 'Default Language'}</CardTitle>
          <CardDescription>{isAr ? 'اختر اللغة الافتراضية للتطبيق' : 'Choose the default language for the app'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{isAr ? 'اللغة' : 'Language'}</Label>
            <Select value={pending.defaultLanguage} onValueChange={(v) => updatePending({ defaultLanguage: v as 'en' | 'ar' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{isAr ? 'اللغة التي سيتم استخدامها افتراضياً عند فتح التطبيق' : 'The language used by default when the app is opened'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
