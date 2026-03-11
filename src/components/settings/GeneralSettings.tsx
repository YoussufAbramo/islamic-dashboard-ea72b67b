import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Coins, MessageSquare, Globe, Building2, Clock, Check, ChevronsUpDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

const GeneralSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, currencies } = useAppSettings();
  const isAr = language === 'ar';

  const [teacherCanChat, setTeacherCanChat] = useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  const [tzOpen, setTzOpen] = useState(false);

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

      {/* Default Timezone & Time Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />{isAr ? 'المنطقة الزمنية وتنسيق الوقت' : 'Timezone & Time Format'}</CardTitle>
          <CardDescription>{isAr ? 'اختر المنطقة الزمنية وتنسيق عرض الوقت' : 'Choose timezone and time display format'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{isAr ? 'المنطقة الزمنية' : 'Timezone'}</Label>
              <Popover open={tzOpen} onOpenChange={setTzOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {pending.defaultTimezone || 'UTC'}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={isAr ? 'ابحث عن منطقة زمنية...' : 'Search timezone...'} />
                    <CommandList>
                      <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results'}</CommandEmpty>
                      <CommandGroup>
                        {timezones.map((tz) => (
                          <CommandItem key={tz} value={tz} onSelect={() => { updatePending({ defaultTimezone: tz }); setTzOpen(false); }}>
                            <Check className={cn("me-2 h-4 w-4", pending.defaultTimezone === tz ? "opacity-100" : "opacity-0")} />
                            {tz}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">{isAr ? 'المنطقة الزمنية المستخدمة في أسماء النسخ الاحتياطية والتقارير' : 'Timezone used for backup names and reports'}</p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'تنسيق الوقت' : 'Time Format'}</Label>
              <Select value={pending.timeFormat} onValueChange={(v) => updatePending({ timeFormat: v as '12h' | '24h' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">{isAr ? '12 ساعة (AM/PM)' : '12-hour (AM/PM)'} — 2:30 PM</SelectItem>
                  <SelectItem value="24h">{isAr ? '24 ساعة' : '24-hour'} — 14:30</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{isAr ? 'تنسيق عرض الوقت في التطبيق' : 'How time is displayed across the app'}</p>
            </div>
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
