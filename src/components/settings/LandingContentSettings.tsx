import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, Globe, Megaphone, Star, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ContentSection = 'hero' | 'features' | 'whyus' | 'cta';

interface SectionTab {
  key: ContentSection;
  label: string;
  labelAr: string;
  icon: any;
}

const sectionTabs: SectionTab[] = [
  { key: 'hero', label: 'Hero Section', labelAr: 'القسم الرئيسي', icon: Star },
  { key: 'features', label: 'Features Section', labelAr: 'قسم الميزات', icon: Sparkles },
  { key: 'whyus', label: 'Why Us Section', labelAr: 'قسم لماذا نحن', icon: Globe },
  { key: 'cta', label: 'Call to Action', labelAr: 'دعوة للعمل', icon: Megaphone },
];

const defaultContent: Record<string, Record<string, any>> = {
  hero: { title: 'Islamic Education Platform', title_ar: 'منصة التعليم الإسلامي', subtitle: 'Empower your institution with a comprehensive learning management system designed for Islamic education', subtitle_ar: 'مكّن مؤسستك بنظام إدارة تعليمي شامل مصمم للتعليم الإسلامي', cta: 'Get Started', cta_ar: 'ابدأ الآن' },
  features: { title: 'Everything You Need', title_ar: 'كل ما تحتاجه', subtitle: 'A complete suite of tools for modern Islamic education', subtitle_ar: 'مجموعة كاملة من الأدوات للتعليم الإسلامي الحديث' },
  whyus: {
    title: 'Why Choose Us?', title_ar: 'لماذا تختارنا؟', subtitle: 'Built specifically for Islamic educational institutions', subtitle_ar: 'مصمم خصيصاً للمؤسسات التعليمية الإسلامية',
    reasons: [
      { title: 'Islamic-First Design', title_ar: 'تصميم إسلامي أولاً', desc: 'Every aspect designed with Islamic aesthetics and values in mind', desc_ar: 'كل جانب مصمم مع مراعاة الجماليات والقيم الإسلامية' },
      { title: 'Bilingual Support', title_ar: 'دعم ثنائي اللغة', desc: 'Full Arabic and English support with RTL layout', desc_ar: 'دعم كامل للعربية والإنجليزية مع تخطيط من اليمين لليسار' },
      { title: 'Comprehensive Tools', title_ar: 'أدوات شاملة', desc: 'From course management to financial reports, everything in one place', desc_ar: 'من إدارة الدورات إلى التقارير المالية، كل شيء في مكان واحد' },
      { title: 'Secure & Reliable', title_ar: 'آمن وموثوق', desc: 'Enterprise-grade security with role-based access control', desc_ar: 'أمان على مستوى المؤسسات مع التحكم في الوصول القائم على الأدوار' },
    ],
  },
  cta: { title: 'Ready to Transform Your Institution?', title_ar: 'هل أنت مستعد لتحويل مؤسستك؟', subtitle: 'Join hundreds of Islamic schools and academies already using our platform', subtitle_ar: 'انضم إلى مئات المدارس والأكاديميات الإسلامية التي تستخدم منصتنا بالفعل' },
};

const LandingContentSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeSection, setActiveSection] = useState<ContentSection>('hero');
  const [content, setContent] = useState<Record<string, Record<string, any>>>(defaultContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('*');
      if (data) {
        const merged = { ...defaultContent };
        data.forEach((item: any) => {
          merged[item.section_key] = { ...defaultContent[item.section_key], ...item.content };
        });
        setContent(merged);
      }
    };
    fetch();
  }, []);

  const updateField = (section: string, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async (section: ContentSection) => {
    setSaving(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: section,
      content: content[section],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSaving(false);
    if (error) {
      toast.error(isAr ? 'فشل الحفظ' : 'Failed to save');
    } else {
      toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
    }
  };

  const addReason = () => {
    const reasons = [...(content.whyus?.reasons || []), { title: '', title_ar: '', desc: '', desc_ar: '' }];
    updateField('whyus', 'reasons', reasons);
  };

  const removeReason = (index: number) => {
    const reasons = [...(content.whyus?.reasons || [])];
    reasons.splice(index, 1);
    updateField('whyus', 'reasons', reasons);
  };

  const updateReason = (index: number, field: string, value: string) => {
    const reasons = [...(content.whyus?.reasons || [])];
    reasons[index] = { ...reasons[index], [field]: value };
    updateField('whyus', 'reasons', reasons);
  };

  const renderSection = () => {
    const s = content[activeSection];
    switch (activeSection) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'}</Label><Input value={s.title || ''} onChange={e => updateField('hero', 'title', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label><Input dir="rtl" value={s.title_ar || ''} onChange={e => updateField('hero', 'title_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان الفرعي (EN)' : 'Subtitle (EN)'}</Label><Textarea value={s.subtitle || ''} onChange={e => updateField('hero', 'subtitle', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان الفرعي (AR)' : 'Subtitle (AR)'}</Label><Textarea dir="rtl" value={s.subtitle_ar || ''} onChange={e => updateField('hero', 'subtitle_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'زر CTA (EN)' : 'CTA Button (EN)'}</Label><Input value={s.cta || ''} onChange={e => updateField('hero', 'cta', e.target.value)} /></div>
              <div><Label>{isAr ? 'زر CTA (AR)' : 'CTA Button (AR)'}</Label><Input dir="rtl" value={s.cta_ar || ''} onChange={e => updateField('hero', 'cta_ar', e.target.value)} /></div>
            </div>
          </div>
        );
      case 'features':
      case 'cta':
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'}</Label><Input value={s.title || ''} onChange={e => updateField(activeSection, 'title', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label><Input dir="rtl" value={s.title_ar || ''} onChange={e => updateField(activeSection, 'title_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان الفرعي (EN)' : 'Subtitle (EN)'}</Label><Textarea value={s.subtitle || ''} onChange={e => updateField(activeSection, 'subtitle', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان الفرعي (AR)' : 'Subtitle (AR)'}</Label><Textarea dir="rtl" value={s.subtitle_ar || ''} onChange={e => updateField(activeSection, 'subtitle_ar', e.target.value)} /></div>
            </div>
          </div>
        );
      case 'whyus':
        return (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'}</Label><Input value={s.title || ''} onChange={e => updateField('whyus', 'title', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label><Input dir="rtl" value={s.title_ar || ''} onChange={e => updateField('whyus', 'title_ar', e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'العنوان الفرعي (EN)' : 'Subtitle (EN)'}</Label><Textarea value={s.subtitle || ''} onChange={e => updateField('whyus', 'subtitle', e.target.value)} /></div>
              <div><Label>{isAr ? 'العنوان الفرعي (AR)' : 'Subtitle (AR)'}</Label><Textarea dir="rtl" value={s.subtitle_ar || ''} onChange={e => updateField('whyus', 'subtitle_ar', e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">{isAr ? 'الأسباب' : 'Reasons'}</Label>
                <Button variant="outline" size="sm" onClick={addReason}><Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}</Button>
              </div>
              <Accordion type="multiple" className="space-y-2">
                {(s.reasons || []).map((r: any, i: number) => (
                  <AccordionItem key={i} value={`reason-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm">{r.title || `Reason ${i + 1}`}</AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><Label>Title (EN)</Label><Input value={r.title} onChange={e => updateReason(i, 'title', e.target.value)} /></div>
                        <div><Label>Title (AR)</Label><Input dir="rtl" value={r.title_ar} onChange={e => updateReason(i, 'title_ar', e.target.value)} /></div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><Label>Description (EN)</Label><Textarea value={r.desc} onChange={e => updateReason(i, 'desc', e.target.value)} /></div>
                        <div><Label>Description (AR)</Label><Textarea dir="rtl" value={r.desc_ar} onChange={e => updateReason(i, 'desc_ar', e.target.value)} /></div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeReason(i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted">
        {sectionTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {isAr ? tab.labelAr : tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? sectionTabs.find(t => t.key === activeSection)?.labelAr : sectionTabs.find(t => t.key === activeSection)?.label}</CardTitle>
          <CardDescription>{isAr ? 'تعديل محتوى هذا القسم من صفحة الهبوط' : 'Edit the content for this landing page section'}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderSection()}
          <div className="flex justify-end mt-6">
            <Button onClick={() => handleSave(activeSection)} disabled={saving}>
              <Save className="h-4 w-4 me-1" />
              {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ القسم' : 'Save Section')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingContentSettings;
