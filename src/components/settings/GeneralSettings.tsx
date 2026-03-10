import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Coins, MessageSquare, Globe, Building2, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const GeneralSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, currencies } = useAppSettings();
  const isAr = language === 'ar';

  const [teacherCanChat, setTeacherCanChat] = useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  const [tzSearch, setTzSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('app_teacher_can_chat', String(teacherCanChat));
  }, [teacherCanChat]);

  const timezones = useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf('timeZone') as string[];
    } catch {
      return ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Tokyo', 'Africa/Cairo', 'Australia/Sydney', 'Pacific/Auckland'];
    }
  }, []);

  const filteredTimezones = useMemo(() => {
    if (!tzSearch) return timezones.slice(0, 50);
    return timezones.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase())).slice(0, 50);
  }, [timezones, tzSearch]);

  return (
    <div className="space-y-6">
      {/* App Name & Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{isAr ? 'معلومات التطبيق' : 'App Information'}</CardTitle>
          <CardDescription>{isAr ? 'اسم التطبيق والوصف' : 'App name and description'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? 'اسم التطبيق' : 'App Name'}</Label>
            <Input value={pending.appName} onChange={(e) => updatePending({ appName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? 'وصف التطبيق' : 'App Description'}</Label>
            <Textarea value={pending.appDescription} onChange={(e) => updatePending({ appDescription: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

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
                    <SelectItem key={d} value={String(d)}>
                      {d} — {isAr ? 'مثال' : 'e.g.'} {pending.currency.symbol}{(1234.5678).toFixed(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />{isAr ? 'المنطقة الزمنية' : 'Default Timezone'}</CardTitle>
          <CardDescription>{isAr ? 'اختر المنطقة الزمنية الافتراضية للتطبيق' : 'Choose the default timezone for the app'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{isAr ? 'المنطقة الزمنية' : 'Timezone'}</Label>
            <div className="space-y-2">
              <Input
                placeholder={isAr ? 'ابحث عن منطقة زمنية...' : 'Search timezone...'}
                value={tzSearch}
                onChange={(e) => setTzSearch(e.target.value)}
              />
              <Select 
                value={pending.defaultTimezone} 
                onValueChange={(v) => updatePending({ defaultTimezone: v })}
              >
                <SelectTrigger><SelectValue placeholder={pending.defaultTimezone} /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {/* Always show current value first */}
                  {pending.defaultTimezone && !filteredTimezones.includes(pending.defaultTimezone) && (
                    <SelectItem key={pending.defaultTimezone} value={pending.defaultTimezone}>{pending.defaultTimezone}</SelectItem>
                  )}
                  {filteredTimezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{isAr ? 'المنطقة الزمنية المستخدمة في أسماء النسخ الاحتياطية والتقارير' : 'Timezone used for backup names and reports'}</p>
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
