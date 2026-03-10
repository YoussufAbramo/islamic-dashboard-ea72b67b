import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator as CalcIcon, DollarSign, Clock, CalendarDays, TrendingUp } from 'lucide-react';

const Calculator = () => {
  const { language } = useLanguage();
  const { currency } = useAppSettings();
  const isAr = language === 'ar';

  const [form, setForm] = useState({
    weekly_lessons: '3',
    lesson_duration: '60',
    subscription_type: 'monthly',
    price_rate: '',
    total_price: '',
  });

  const calcTotalHours = (weeklyLessons: string, lessonDuration: string, subType: string) => {
    const wl = parseInt(weeklyLessons) || 1;
    const ld = parseInt(lessonDuration) || 60;
    const weeks = subType === 'yearly' ? 52 : 4;
    return (wl * ld * weeks) / 60;
  };

  const totalHours = calcTotalHours(form.weekly_lessons, form.lesson_duration, form.subscription_type);
  const totalLessons = (parseInt(form.weekly_lessons) || 1) * (form.subscription_type === 'yearly' ? 52 : 4);

  const handleRateChange = (value: string) => {
    const rate = parseFloat(value) || 0;
    const total = rate > 0 ? (rate * totalHours).toFixed(2) : '';
    setForm(prev => ({ ...prev, price_rate: value, total_price: total }));
  };

  const handleTotalChange = (value: string) => {
    const total = parseFloat(value) || 0;
    const rate = totalHours > 0 && total > 0 ? (total / totalHours).toFixed(2) : '';
    setForm(prev => ({ ...prev, total_price: value, price_rate: rate }));
  };

  // Recalculate when lessons/duration/type changes
  useEffect(() => {
    if (form.price_rate) {
      const rate = parseFloat(form.price_rate) || 0;
      if (rate > 0) {
        const newTotal = (rate * totalHours).toFixed(2);
        setForm(prev => ({ ...prev, total_price: newTotal }));
      }
    }
  }, [form.weekly_lessons, form.lesson_duration, form.subscription_type]);

  const perLesson = totalLessons > 0 && parseFloat(form.total_price) > 0
    ? (parseFloat(form.total_price) / totalLessons).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <CalcIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'حاسبة الأسعار' : 'Price Calculator'}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? 'احسب تسعيرة الدروس بناءً على السعر بالساعة أو الإجمالي' : 'Calculate lesson pricing based on hourly rate or total price'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {isAr ? 'تفاصيل الجدول' : 'Schedule Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? 'الدروس الأسبوعية' : 'Weekly Lessons'}</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={form.weekly_lessons}
                  onChange={(e) => setForm(prev => ({ ...prev, weekly_lessons: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'مدة الدرس (دقيقة)' : 'Duration (min)'}</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={form.lesson_duration}
                  onChange={(e) => setForm(prev => ({ ...prev, lesson_duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'فترة الاشتراك' : 'Period'}</Label>
                <Select value={form.subscription_type} onValueChange={(v) => setForm(prev => ({ ...prev, subscription_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                    <SelectItem value="yearly">{isAr ? 'سنوي' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <CardTitle className="text-lg flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                {isAr ? 'التسعير' : 'Pricing'}
              </CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {isAr ? 'سعر الساعة' : 'Price Rate/hr'}
                    <span className="text-xs text-muted-foreground">({currency.symbol})</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_rate}
                      onChange={(e) => handleRateChange(e.target.value)}
                      placeholder="0.00"
                      className="ps-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {isAr ? 'السعر الإجمالي' : 'Total Price'}
                    <span className="text-xs text-muted-foreground">({currency.symbol}/{form.subscription_type === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')})</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.total_price}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      placeholder="0.00"
                      className="ps-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? 'ملخص الحسابات' : 'Calculation Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isAr ? 'إجمالي الدروس' : 'Total Lessons'}</span>
                  <Badge variant="secondary" className="text-sm">{totalLessons}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isAr ? 'إجمالي الساعات' : 'Total Hours'}</span>
                  <Badge variant="secondary" className="text-sm">{totalHours.toFixed(1)}h</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isAr ? 'سعر الدرس' : 'Per Lesson'}</span>
                  <Badge variant="outline" className="text-sm">{currency.symbol}{perLesson}</Badge>
                </div>
              </div>

              {parseFloat(form.total_price) > 0 && (
                <div className="pt-3 border-t border-primary/20">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? 'سعر الساعة' : 'Hourly Rate'}</p>
                    <p className="text-2xl font-bold text-primary">{currency.symbol}{form.price_rate || '0.00'}</p>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {isAr ? 'الإجمالي' : 'Total'} / {form.subscription_type === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')}
                    </p>
                    <p className="text-3xl font-bold">{currency.symbol}{form.total_price || '0.00'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {form.subscription_type === 'monthly' && parseFloat(form.total_price) > 0 && (
            <Card>
              <CardContent className="pt-4 text-center">
                <CalendarDays className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{isAr ? 'التقدير السنوي' : 'Yearly Estimate'}</p>
                <p className="text-xl font-bold">{currency.symbol}{(parseFloat(form.total_price) * 12).toFixed(2)}</p>
              </CardContent>
            </Card>
          )}

          {form.subscription_type === 'yearly' && parseFloat(form.total_price) > 0 && (
            <Card>
              <CardContent className="pt-4 text-center">
                <CalendarDays className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{isAr ? 'المعدل الشهري' : 'Monthly Average'}</p>
                <p className="text-xl font-bold">{currency.symbol}{(parseFloat(form.total_price) / 12).toFixed(2)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
