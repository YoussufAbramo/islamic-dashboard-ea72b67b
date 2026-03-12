import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calculator as CalcIcon, DollarSign, Clock, CalendarDays, TrendingUp, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { cn } from '@/lib/utils';
import SchedulePicker from '@/components/SchedulePicker';

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

  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subForm, setSubForm] = useState({ student_id: '', course_id: '', teacher_id: '', schedule_days: [] as string[], schedule_time: '' });
  const [studentOpen, setStudentOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const calcTotalHours = (weeklyLessons: string, lessonDuration: string, subType: string) => {
    const wl = parseInt(weeklyLessons) || 1;
    const ld = parseInt(lessonDuration) || 60;
    const weeks = subType === 'yearly' ? 52 : subType === 'quarterly' ? 12 : 4;
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

  useEffect(() => {
    if (form.price_rate) {
      const rate = parseFloat(form.price_rate) || 0;
      if (rate > 0) {
        const newTotal = (rate * totalHours).toFixed(2);
        setForm(prev => ({ ...prev, total_price: newTotal }));
      }
    }
  }, [form.weekly_lessons, form.lesson_duration, form.subscription_type]);

  const fetchFormData = async () => {
    const [sRes, cRes, tRes] = await Promise.all([
      supabase.from('students').select('id, profiles:students_user_id_profiles_fkey(full_name)'),
      supabase.from('courses').select('id, title'),
      supabase.from('teachers').select('id, profiles:teachers_user_id_profiles_fkey(full_name)'),
    ]);
    setStudents(sRes.data || []);
    setCourses(cRes.data || []);
    setTeachers(tRes.data || []);
  };

  const handleCreateSubscription = async () => {
    if (!subForm.student_id || !subForm.course_id) {
      notifyError({ error: 'VAL_SELECT_STUDENT_COURSE', isAr });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('subscriptions').insert({
      student_id: subForm.student_id,
      course_id: subForm.course_id,
      teacher_id: subForm.teacher_id || null,
      subscription_type: form.subscription_type,
      weekly_lessons: parseInt(form.weekly_lessons) || 1,
      lesson_duration: parseInt(form.lesson_duration) || 60,
      price: parseFloat(form.total_price) || 0,
      status: 'active',
      schedule_days: subForm.schedule_days,
      schedule_time: subForm.schedule_time || null,
    });
    setCreating(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم إنشاء الاشتراك بنجاح' : 'Subscription created successfully');
    setCreateSubOpen(false);
    setSubForm({ student_id: '', course_id: '', teacher_id: '', schedule_days: [], schedule_time: '' });
  };

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
                <Input type="number" min="1" max="30" value={form.weekly_lessons} onChange={(e) => setForm(prev => ({ ...prev, weekly_lessons: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'مدة الدرس (دقيقة)' : 'Duration (min)'}</Label>
                <Input type="number" min="15" step="15" value={form.lesson_duration} onChange={(e) => setForm(prev => ({ ...prev, lesson_duration: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'فترة الاشتراك' : 'Period'}</Label>
                <Select value={form.subscription_type} onValueChange={(v) => setForm(prev => ({ ...prev, subscription_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                    <SelectItem value="quarterly">{isAr ? '3 أشهر' : '3-Month'}</SelectItem>
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
                  <Label className="flex items-center gap-1">{isAr ? 'سعر الساعة' : 'Price Rate/hr'} <span className="text-xs text-muted-foreground">({currency.symbol})</span></Label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                    <Input type="number" min="0" step="0.01" value={form.price_rate} onChange={(e) => handleRateChange(e.target.value)} placeholder="0.00" className="ps-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">{isAr ? 'السعر الإجمالي' : 'Total Price'} <span className="text-xs text-muted-foreground">({currency.symbol}/{form.subscription_type === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')})</span></Label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
                    <Input type="number" min="0" step="0.01" value={form.total_price} onChange={(e) => handleTotalChange(e.target.value)} placeholder="0.00" className="ps-8" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? 'الإجمالي' : 'Total'} / {form.subscription_type === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')}</p>
                    <p className="text-3xl font-bold">{currency.symbol}{form.total_price || '0.00'}</p>
                  </div>
                </div>
              )}
              {parseFloat(form.total_price) > 0 && (
                <Button className="w-full mt-2" onClick={() => { fetchFormData(); setCreateSubOpen(true); }}>
                  <Plus className="h-4 w-4 me-2" />{isAr ? 'إنشاء اشتراك' : 'Create Subscription'}
                </Button>
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

      {/* Create Subscription Dialog */}
      <Dialog open={createSubOpen} onOpenChange={setCreateSubOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إنشاء اشتراك من الحاسبة' : 'Create Subscription from Calculator'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'النوع' : 'Type'}</span><span className="font-medium">{form.subscription_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'دروس أسبوعية' : 'Weekly Lessons'}</span><span className="font-medium">{form.weekly_lessons}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'مدة الدرس' : 'Duration'}</span><span className="font-medium">{form.lesson_duration} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'السعر' : 'Price'}</span><span className="font-medium font-bold">{currency.symbol}{form.total_price}</span></div>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'الطالب' : 'Student'} *</Label>
              <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {subForm.student_id ? students.find(s => s.id === subForm.student_id)?.profiles?.full_name || '...' : (isAr ? 'اختر طالب' : 'Select student')}
                    <ChevronsUpDown className="ms-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder={isAr ? 'بحث...' : 'Search...'} /><CommandList><CommandEmpty>{isAr ? 'لا نتائج' : 'No results'}</CommandEmpty><CommandGroup>
                    {students.map(s => <CommandItem key={s.id} value={s.profiles?.full_name || s.id} onSelect={() => { setSubForm(f => ({...f, student_id: s.id})); setStudentOpen(false); }}><Check className={cn("me-2 h-4 w-4", subForm.student_id === s.id ? "opacity-100" : "opacity-0")} />{s.profiles?.full_name}</CommandItem>)}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'الدورة' : 'Course'} *</Label>
              <Popover open={courseOpen} onOpenChange={setCourseOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {subForm.course_id ? courses.find(c => c.id === subForm.course_id)?.title || '...' : (isAr ? 'اختر دورة' : 'Select course')}
                    <ChevronsUpDown className="ms-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder={isAr ? 'بحث...' : 'Search...'} /><CommandList><CommandEmpty>{isAr ? 'لا نتائج' : 'No results'}</CommandEmpty><CommandGroup>
                    {courses.map(c => <CommandItem key={c.id} value={c.title} onSelect={() => { setSubForm(f => ({...f, course_id: c.id})); setCourseOpen(false); }}><Check className={cn("me-2 h-4 w-4", subForm.course_id === c.id ? "opacity-100" : "opacity-0")} />{c.title}</CommandItem>)}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'المعلم (اختياري)' : 'Teacher (optional)'}</Label>
              <Popover open={teacherOpen} onOpenChange={setTeacherOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {subForm.teacher_id ? teachers.find(t => t.id === subForm.teacher_id)?.profiles?.full_name || '...' : (isAr ? 'اختر معلم' : 'Select teacher')}
                    <ChevronsUpDown className="ms-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command><CommandInput placeholder={isAr ? 'بحث...' : 'Search...'} /><CommandList><CommandEmpty>{isAr ? 'لا نتائج' : 'No results'}</CommandEmpty><CommandGroup>
                    {teachers.map(t => <CommandItem key={t.id} value={t.profiles?.full_name || t.id} onSelect={() => { setSubForm(f => ({...f, teacher_id: t.id})); setTeacherOpen(false); }}><Check className={cn("me-2 h-4 w-4", subForm.teacher_id === t.id ? "opacity-100" : "opacity-0")} />{t.profiles?.full_name}</CommandItem>)}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Schedule Picker */}
            <div className="border-t pt-3">
              <SchedulePicker
                selectedDays={subForm.schedule_days}
                onDaysChange={(days) => setSubForm(f => ({ ...f, schedule_days: days }))}
                time={subForm.schedule_time}
                onTimeChange={(time) => setSubForm(f => ({ ...f, schedule_time: time }))}
                maxDays={parseInt(form.weekly_lessons, 10) || undefined}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSubOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreateSubscription} disabled={creating}>{creating ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء الاشتراك' : 'Create Subscription')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calculator;
