import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2, Globe, Megaphone, Star, Sparkles, Settings2, Search } from 'lucide-react';
import ImagePickerField from '@/components/media/ImagePickerField';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ContentSection = 'general' | 'hero' | 'features' | 'whyus' | 'cta';

interface SectionTab {
  key: ContentSection;
  label: string;
  labelAr: string;
  icon: any;
}

const sectionTabs: SectionTab[] = [
  { key: 'general', label: 'General & SEO', labelAr: 'عام وSEO', icon: Settings2 },
  { key: 'hero', label: 'Hero Section', labelAr: 'القسم الرئيسي', icon: Star },
  { key: 'features', label: 'Features Section', labelAr: 'قسم الميزات', icon: Sparkles },
  { key: 'whyus', label: 'Why Us Section', labelAr: 'قسم لماذا نحن', icon: Globe },
  { key: 'cta', label: 'Call to Action', labelAr: 'دعوة للعمل', icon: Megaphone },
];

const defaultContent: Record<string, Record<string, any>> = {
  general: {
    meta_title: '',
    meta_title_ar: '',
    meta_description: '',
    meta_description_ar: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    sections_visible: {
      hero: true,
      features: true,
      whyus: true,
      pricing: true,
      cta: true,
    },
  },
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
  const [activeSection, setActiveSection] = useState<ContentSection>('general');
  const [content, setContent] = useState<Record<string, Record<string, any>>>(defaultContent);
  const [saving, setSaving] = useState(false);
  const [ogImageMode, setOgImageMode] = useState<'url' | 'upload'>('url');
  const ogImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('*');
      if (data) {
        const merged = { ...defaultContent };
        data.forEach((item: any) => {
          if (item.section_key === 'general') {
            merged.general = { ...defaultContent.general, ...item.content };
          } else {
            merged[item.section_key] = { ...defaultContent[item.section_key], ...item.content };
          }
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

  const updateSectionVisibility = (sectionId: string, visible: boolean) => {
    setContent(prev => ({
      ...prev,
      general: {
        ...prev.general,
        sections_visible: {
          ...prev.general.sections_visible,
          [sectionId]: visible,
        },
      },
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
      notifyError({ error: 'GENERAL_SAVE_FAILED', isAr });
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

  const sectionVisibility = content.general?.sections_visible || { hero: true, features: true, whyus: true, pricing: true, cta: true };

  const renderSection = () => {
    const s = content[activeSection];
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Section Visibility */}
            <div>
              <h3 className="font-medium mb-3">{isAr ? 'إظهار/إخفاء الأقسام' : 'Show/Hide Sections'}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'hero', label: 'Hero', labelAr: 'الرئيسي' },
                  { id: 'features', label: 'Features', labelAr: 'الميزات' },
                  { id: 'whyus', label: 'Why Us', labelAr: 'لماذا نحن' },
                  { id: 'pricing', label: 'Pricing', labelAr: 'الأسعار' },
                  { id: 'cta', label: 'CTA', labelAr: 'دعوة للعمل' },
                ].map(sec => (
                  <div key={sec.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border">
                    <span className="text-sm">{isAr ? sec.labelAr : sec.label}</span>
                    <Switch
                      checked={sectionVisibility[sec.id] !== false}
                      onCheckedChange={(v) => updateSectionVisibility(sec.id, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SEO Meta Data */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                {isAr ? 'بيانات SEO' : 'SEO Meta Data'}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Meta Title (EN)</Label><Input value={s.meta_title || ''} onChange={e => updateField('general', 'meta_title', e.target.value)} placeholder="Islamic Education Platform" /></div>
                <div><Label>Meta Title (AR)</Label><Input dir="rtl" value={s.meta_title_ar || ''} onChange={e => updateField('general', 'meta_title_ar', e.target.value)} placeholder="منصة التعليم الإسلامي" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Meta Description (EN)</Label><Textarea value={s.meta_description || ''} onChange={e => updateField('general', 'meta_description', e.target.value)} placeholder="Describe your platform..." rows={2} /></div>
                <div><Label>Meta Description (AR)</Label><Textarea dir="rtl" value={s.meta_description_ar || ''} onChange={e => updateField('general', 'meta_description_ar', e.target.value)} placeholder="وصف المنصة..." rows={2} /></div>
              </div>
              <div>
                <Label>{isAr ? 'الكلمات المفتاحية' : 'Keywords'}</Label>
                <Input value={s.meta_keywords || ''} onChange={e => updateField('general', 'meta_keywords', e.target.value)} placeholder="islamic, education, quran, learning" />
              </div>
            </div>

            {/* Open Graph - Separate box */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {isAr ? 'بيانات المشاركة (Open Graph)' : 'Open Graph (OG) Data'}
              </h3>
              <div><Label>OG Title</Label><Input value={s.og_title || ''} onChange={e => updateField('general', 'og_title', e.target.value)} placeholder="Title for social sharing" /></div>
              <div><Label>OG Description</Label><Textarea value={s.og_description || ''} onChange={e => updateField('general', 'og_description', e.target.value)} placeholder="Description for social sharing" rows={2} /></div>
              
              {/* OG Image with upload or URL */}
              <div className="space-y-3">
                <Label>{isAr ? 'صورة OG' : 'OG Image'}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={ogImageMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOgImageMode('url')}
                  >
                    <Link className="h-3.5 w-3.5 me-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={ogImageMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOgImageMode('upload')}
                  >
                    <Upload className="h-3.5 w-3.5 me-1" />
                    {isAr ? 'رفع' : 'Upload'}
                  </Button>
                </div>

                {ogImageMode === 'url' ? (
                  <Input
                    value={s.og_image || ''}
                    onChange={e => updateField('general', 'og_image', e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      ref={ogImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop();
                        const path = `branding/og-image-${Date.now()}.${ext}`;
                        const { uploadAndGetSignedUrl } = await import('@/lib/storage');
                        const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(path, file);
                        if (uploadErr) { notifyError({ error: 'STORAGE_UPLOAD_FAILED', isAr, rawMessage: uploadErr }); return; }
                        updateField('general', 'og_image', signedUrl);
                        toast.success(isAr ? 'تم رفع الصورة' : 'Image uploaded');
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => ogImageRef.current?.click()}>
                      <Upload className="h-4 w-4 me-1" />
                      {isAr ? 'اختر صورة' : 'Choose Image'}
                    </Button>
                  </div>
                )}

                {s.og_image && (
                  <div className="space-y-2">
                    <img src={s.og_image} alt="OG Preview" className="max-h-32 rounded-lg border border-border object-contain" />
                    <Button variant="ghost" size="sm" onClick={() => updateField('general', 'og_image', '')}>
                      {isAr ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
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
          <CardDescription>{isAr ? 'تعديل محتوى وإعدادات صفحة الهبوط' : 'Edit landing page content and settings'}</CardDescription>
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
