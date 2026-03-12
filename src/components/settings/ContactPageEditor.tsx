import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';

interface Department {
  value: string;
  label: string;
  label_ar: string;
}

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
  departments: Department[];
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactPageEditor = ({ open, onOpenChange }: Props) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [content, setContent] = useState<ContactContent>(defaultContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('content').eq('section_key', 'contact_page').maybeSingle();
      if (data?.content) setContent({ ...defaultContent, ...(data.content as any) });
    };
    fetch();
  }, [open]);

  const set = (key: keyof ContactContent, val: any) => setContent(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'contact_page',
      content: content as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSaving(false);
    if (error) { notifyError({ error: 'GENERAL_SAVE_FAILED', isAr }); return; }
    toast.success(isAr ? 'تم حفظ صفحة التواصل' : 'Contact page saved');
  };

  const addDepartment = () => {
    set('departments', [...content.departments, { value: `dept_${Date.now()}`, label: '', label_ar: '' }]);
  };

  const updateDepartment = (idx: number, key: keyof Department, val: string) => {
    const deps = [...content.departments];
    deps[idx] = { ...deps[idx], [key]: val };
    set('departments', deps);
  };

  const removeDepartment = (idx: number) => {
    set('departments', content.departments.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAr ? 'تعديل صفحة التواصل' : 'Edit Contact Page'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold">{isAr ? 'العنوان الرئيسي' : 'Hero Section'}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Heading (EN)</Label><Input value={content.heading} onChange={e => set('heading', e.target.value)} /></div>
              <div><Label className="text-xs">Heading (AR)</Label><Input dir="rtl" value={content.heading_ar} onChange={e => set('heading_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Subheading (EN)</Label><Textarea value={content.subheading} onChange={e => set('subheading', e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Subheading (AR)</Label><Textarea dir="rtl" value={content.subheading_ar} onChange={e => set('subheading_ar', e.target.value)} rows={2} /></div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{isAr ? 'معلومات التواصل' : 'Contact Information'}</h4>
              <div className="flex items-center gap-2">
                <Label className="text-xs">{isAr ? 'إظهار البطاقة' : 'Show Card'}</Label>
                <Switch checked={content.show_info_card} onCheckedChange={v => set('show_info_card', v)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={content.info_email} onChange={e => set('info_email', e.target.value)} placeholder="support@example.com" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={content.info_phone} onChange={e => set('info_phone', e.target.value)} placeholder="+1 234 567 890" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Address (EN)</Label><Input value={content.info_address} onChange={e => set('info_address', e.target.value)} /></div>
              <div><Label className="text-xs">Address (AR)</Label><Input dir="rtl" value={content.info_address_ar} onChange={e => set('info_address_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Hours (EN)</Label><Input value={content.info_hours} onChange={e => set('info_hours', e.target.value)} /></div>
              <div><Label className="text-xs">Hours (AR)</Label><Input dir="rtl" value={content.info_hours_ar} onChange={e => set('info_hours_ar', e.target.value)} /></div>
            </div>
          </div>

          {/* Form Title */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold">{isAr ? 'عنوان النموذج' : 'Form Title'}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Title (EN)</Label><Input value={content.form_title} onChange={e => set('form_title', e.target.value)} /></div>
              <div><Label className="text-xs">Title (AR)</Label><Input dir="rtl" value={content.form_title_ar} onChange={e => set('form_title_ar', e.target.value)} /></div>
            </div>
          </div>

          {/* Departments */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{isAr ? 'الأقسام' : 'Departments'}</h4>
              <Button variant="outline" size="sm" onClick={addDepartment}>
                <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            <div className="space-y-2">
              {content.departments.map((dept, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <Input value={dept.value} onChange={e => updateDepartment(idx, 'value', e.target.value)} className="h-8 text-xs flex-1 font-mono" placeholder="value" />
                  <Input value={dept.label} onChange={e => updateDepartment(idx, 'label', e.target.value)} className="h-8 text-xs flex-1" placeholder="Label EN" />
                  <Input dir="rtl" value={dept.label_ar} onChange={e => updateDepartment(idx, 'label_ar', e.target.value)} className="h-8 text-xs flex-1" placeholder="Label AR" />
                  <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => removeDepartment(idx)}>
                    <Trash2 className={ACTION_ICON} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 me-1" />
              {saving ? '...' : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactPageEditor;
