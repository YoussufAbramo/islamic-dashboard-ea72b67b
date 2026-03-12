import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import CopyrightText from '@/components/CopyrightText';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import DOMPurify from 'dompurify';

const ticketSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  department: z.string().min(1),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

interface ContactContent {
  heading: string;
  heading_ar: string;
  subheading: string;
  subheading_ar: string;
  info_email: string;
  info_phone: string;
  info_address: string;
  info_address_ar: string;
  info_hours: string;
  info_hours_ar: string;
  form_title: string;
  form_title_ar: string;
  departments: { value: string; label: string; label_ar: string }[];
  show_info_card: boolean;
}

const defaultContent: ContactContent = {
  heading: 'Get in Touch',
  heading_ar: 'تواصل معنا',
  subheading: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  subheading_ar: 'يسعدنا سماع رأيك. أرسل لنا رسالة وسنرد عليك في أقرب وقت ممكن.',
  info_email: 'support@example.com',
  info_phone: '+1 234 567 890',
  info_address: '123 Education Street, City',
  info_address_ar: '١٢٣ شارع التعليم، المدينة',
  info_hours: 'Mon - Fri: 9:00 AM - 5:00 PM',
  info_hours_ar: 'الإثنين - الجمعة: ٩:٠٠ ص - ٥:٠٠ م',
  form_title: 'Send a Message',
  form_title_ar: 'أرسل رسالة',
  departments: [
    { value: 'general', label: 'General Inquiry', label_ar: 'استفسار عام' },
    { value: 'technical', label: 'Technical Support', label_ar: 'دعم فني' },
    { value: 'billing', label: 'Billing', label_ar: 'الفواتير' },
  ],
  show_info_card: true,
};

const PublicContact = () => {
  const { language } = useLanguage();
  const { pending } = useAppSettings();
  const isAr = language === 'ar';
  const [content, setContent] = useState<ContactContent>(defaultContent);
  const [dbDepartments, setDbDepartments] = useState<{ name: string; name_ar: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', department: '', message: '',
  });

  const appName = pending.appName || 'Islamic Dashboard';

  useEffect(() => {
    const fetchData = async () => {
      const [{ data }, { data: deptData }] = await Promise.all([
        supabase.from('landing_content').select('content').eq('section_key', 'contact_page').maybeSingle(),
        supabase.from('support_departments').select('name, name_ar').eq('is_active', true).order('sort_order'),
      ]);
      if (data?.content) setContent({ ...defaultContent, ...(data.content as any) });
      if (deptData && deptData.length > 0) {
        setDbDepartments(deptData as any);
        setForm(prev => ({ ...prev, department: (deptData[0] as any).name.toLowerCase() }));
      } else {
        setForm(prev => ({ ...prev, department: defaultContent.departments[0]?.value || 'general' }));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ticketSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      name: DOMPurify.sanitize(form.name),
      email: DOMPurify.sanitize(form.email),
      phone: DOMPurify.sanitize(form.phone || ''),
      subject: DOMPurify.sanitize(form.subject),
      department: form.department,
      message: DOMPurify.sanitize(form.message),
      priority: 'medium',
      status: 'open',
    });
    setSubmitting(false);

    if (error) {
      toast.error(isAr ? 'حدث خطأ أثناء الإرسال' : 'Failed to submit. Please try again.');
      return;
    }

    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', department: 'general', message: '' });
  };

  const t = (en: string, ar: string) => isAr ? ar : en;

  const infoItems = [
    { icon: Mail, label: content.info_email, show: !!content.info_email },
    { icon: Phone, label: content.info_phone, show: !!content.info_phone },
    { icon: MapPin, label: isAr ? content.info_address_ar || content.info_address : content.info_address, show: !!content.info_address },
    { icon: Clock, label: isAr ? content.info_hours_ar || content.info_hours : content.info_hours, show: !!content.info_hours },
  ].filter(i => i.show);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            {appName}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            {isAr ? content.heading_ar : content.heading}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr ? content.subheading_ar : content.subheading}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className={`grid gap-8 ${content.show_info_card ? 'lg:grid-cols-5' : ''}`}>
          
          {/* Info card */}
          {content.show_info_card && (
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden border-primary/10">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-semibold text-lg text-foreground">
                    {t('Contact Information', 'معلومات التواصل')}
                  </h3>
                  <div className="space-y-5">
                    {infoItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="pt-2">
                          <p className="text-sm text-foreground">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form */}
          <div className={content.show_info_card ? 'lg:col-span-3' : ''}>
            <Card className="shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {t('Message Sent!', 'تم إرسال الرسالة!')}
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      {t(
                        "Thank you for reaching out. We'll get back to you as soon as possible.",
                        'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.'
                      )}
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4">
                      {t('Send Another Message', 'إرسال رسالة أخرى')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-foreground mb-6">
                      {isAr ? content.form_title_ar : content.form_title}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>{t('Full Name', 'الاسم الكامل')} *</Label>
                          <Input
                            value={form.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder={t('John Doe', 'أدخل اسمك')}
                            maxLength={100}
                          />
                          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('Email', 'البريد الإلكتروني')} *</Label>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={e => handleChange('email', e.target.value)}
                            placeholder="email@example.com"
                            maxLength={255}
                          />
                          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>{t('Phone', 'الهاتف')}</Label>
                          <Input
                            value={form.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            placeholder="+1 234 567 890"
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('Department', 'القسم')} *</Label>
                          <Select value={form.department} onValueChange={v => handleChange('department', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dbDepartments.length > 0
                                ? dbDepartments.map(d => (
                                    <SelectItem key={d.name} value={d.name.toLowerCase()}>
                                      {isAr ? (d.name_ar || d.name) : d.name}
                                    </SelectItem>
                                  ))
                                : content.departments.map(d => (
                                    <SelectItem key={d.value} value={d.value}>
                                      {isAr ? d.label_ar : d.label}
                                    </SelectItem>
                                  ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t('Subject', 'الموضوع')} *</Label>
                        <Input
                          value={form.subject}
                          onChange={e => handleChange('subject', e.target.value)}
                          placeholder={t('How can we help?', 'كيف يمكننا مساعدتك؟')}
                          maxLength={200}
                        />
                        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t('Message', 'الرسالة')} *</Label>
                        <Textarea
                          value={form.message}
                          onChange={e => handleChange('message', e.target.value)}
                          placeholder={t('Describe your inquiry in detail...', 'اشرح استفسارك بالتفصيل...')}
                          rows={5}
                          maxLength={2000}
                        />
                        <div className="flex justify-between">
                          {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                          <p className="text-xs text-muted-foreground ms-auto">{form.message.length}/2000</p>
                        </div>
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                        <Send className="h-4 w-4 me-2" />
                        {submitting ? t('Sending...', 'جارٍ الإرسال...') : t('Send Message', 'إرسال الرسالة')}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <CopyrightText />
        </div>
      </div>
    </div>
  );
};

export default PublicContact;
