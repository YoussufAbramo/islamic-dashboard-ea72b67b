import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Search, Globe, FileText, Code, Share2, ShieldCheck, Type, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import ImagePickerField from '@/components/media/ImagePickerField';
import { defaultGeneralContent } from '@/lib/landingDefaults';

interface SeoConfig {
  // Basic SEO
  default_og_image: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  google_verification: string;
  bing_verification: string;
  json_ld_org_name: string;
  json_ld_org_url: string;
  auto_sitemap: boolean;
  social_twitter: string;
  social_facebook: string;
  // Meta Defaults
  meta_title_default: string;
  meta_description_default: string;
  title_separator: string;
  title_template: string;
  // Expanded Structured Data
  json_ld_org_logo: string;
  json_ld_org_description: string;
  json_ld_org_type: string;
  json_ld_contact_email: string;
  json_ld_contact_phone: string;
  json_ld_custom: string;
  // OG Defaults
  og_type: string;
  og_title_default: string;
  og_description_default: string;
  og_locale: string;
  twitter_card_type: string;
  // Expanded Social
  social_instagram: string;
  social_youtube: string;
  social_linkedin: string;
  social_tiktok: string;
  // Custom Head & Robots
  custom_head_injection: string;
  custom_robots_rules: string;
  // Extra Verification
  yandex_verification: string;
  pinterest_verification: string;
}

const defaultSeo: SeoConfig = {
  default_og_image: '',
  canonical_url: '',
  robots_index: true,
  robots_follow: true,
  google_verification: '',
  bing_verification: '',
  json_ld_org_name: '',
  json_ld_org_url: '',
  auto_sitemap: true,
  social_twitter: '',
  social_facebook: '',
  meta_title_default: '',
  meta_description_default: '',
  title_separator: '|',
  title_template: '%page% | %site%',
  json_ld_org_logo: '',
  json_ld_org_description: '',
  json_ld_org_type: 'Organization',
  json_ld_contact_email: '',
  json_ld_contact_phone: '',
  json_ld_custom: '',
  og_type: 'website',
  og_title_default: '',
  og_description_default: '',
  og_locale: 'en_US',
  twitter_card_type: 'summary_large_image',
  social_instagram: '',
  social_youtube: '',
  social_linkedin: '',
  social_tiktok: '',
  custom_head_injection: '',
  custom_robots_rules: '',
  yandex_verification: '',
  pinterest_verification: '',
};

const SeoSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [seo, setSeo] = useState<SeoConfig>(defaultSeo);
  const [landing, setLanding] = useState<Record<string, any>>({ ...defaultGeneralContent });
  const [blogSeo, setBlogSeo] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [savingLanding, setSavingLanding] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [seoRes, landingRes, blogRes] = await Promise.all([
        supabase.from('landing_content').select('content').eq('section_key', 'seo_global_config').maybeSingle(),
        supabase.from('landing_content').select('content').eq('section_key', 'general').maybeSingle(),
        supabase.from('landing_content').select('content').eq('section_key', 'blog_seo').maybeSingle(),
      ]);
      if (seoRes.data?.content) setSeo({ ...defaultSeo, ...(seoRes.data.content as any) });
      if (landingRes.data?.content) setLanding({ ...defaultGeneralContent, ...(landingRes.data.content as any) });
      if (blogRes.data?.content) setBlogSeo(blogRes.data.content as any);
    };
    fetchAll();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'seo_global_config',
      content: seo as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSaving(false);
    if (error) { notifyError({ error: 'GENERAL_SAVE_FAILED', isAr }); return; }
    toast.success(isAr ? 'تم حفظ إعدادات SEO' : 'SEO settings saved');
  };

  const handleSaveLanding = async () => {
    setSavingLanding(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'general',
      content: landing as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSavingLanding(false);
    if (error) { notifyError({ error: 'GENERAL_SAVE_FAILED', isAr }); return; }
    toast.success(isAr ? 'تم حفظ بيانات SEO للصفحة الرئيسية' : 'Landing page SEO saved');
  };

  const setLandingField = (key: string, val: string) => setLanding(p => ({ ...p, [key]: val }));
  const setBlogSeoField = (key: string, val: string) => setBlogSeo(p => ({ ...p, [key]: val }));

  const handleSaveBlog = async () => {
    setSavingBlog(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'blog_seo',
      content: blogSeo as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSavingBlog(false);
    if (error) { notifyError({ error: 'GENERAL_SAVE_FAILED', isAr }); return; }
    toast.success(isAr ? 'تم حفظ بيانات SEO للمدونة' : 'Blog SEO saved');
  };

  const set = (key: keyof SeoConfig) => (val: string | boolean) => setSeo(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">

      {/* 0. Landing Page SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {isAr ? 'SEO الصفحة الرئيسية' : 'Landing Page SEO'}
          </CardTitle>
          <CardDescription>{isAr ? 'بيانات SEO والمشاركة الخاصة بصفحة الهبوط' : 'SEO metadata and social sharing for your landing page'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2"><Search className="h-3.5 w-3.5" />{isAr ? 'بيانات SEO' : 'SEO Meta Data'}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Meta Title (EN)</Label><Input value={landing.meta_title || ''} onChange={e => setLandingField('meta_title', e.target.value)} placeholder="Islamic Education Platform" /></div>
              <div><Label>Meta Title (AR)</Label><Input dir="rtl" value={landing.meta_title_ar || ''} onChange={e => setLandingField('meta_title_ar', e.target.value)} placeholder="منصة التعليم الإسلامي" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Meta Description (EN)</Label><Textarea value={landing.meta_description || ''} onChange={e => setLandingField('meta_description', e.target.value)} rows={2} /></div>
              <div><Label>Meta Description (AR)</Label><Textarea dir="rtl" value={landing.meta_description_ar || ''} onChange={e => setLandingField('meta_description_ar', e.target.value)} rows={2} /></div>
            </div>
            <div><Label>{isAr ? 'الكلمات المفتاحية' : 'Keywords'}</Label><Input value={landing.meta_keywords || ''} onChange={e => setLandingField('meta_keywords', e.target.value)} placeholder="islamic, education, quran" /></div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{isAr ? 'بيانات المشاركة' : 'Open Graph'}</h4>
            <div><Label>OG Title</Label><Input value={landing.og_title || ''} onChange={e => setLandingField('og_title', e.target.value)} /></div>
            <div><Label>OG Description</Label><Textarea value={landing.og_description || ''} onChange={e => setLandingField('og_description', e.target.value)} rows={2} /></div>
            <ImagePickerField label={isAr ? 'صورة OG' : 'OG Image'} value={landing.og_image || ''} onChange={(url) => setLandingField('og_image', url)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveLanding} disabled={savingLanding} size="sm">
              <Save className="h-4 w-4 me-1" />
              {savingLanding ? '...' : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 0.5. Blog SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? 'SEO المدونة' : 'Blog SEO'}
          </CardTitle>
          <CardDescription>{isAr ? 'بيانات SEO الخاصة بصفحة أرشيف المدونة' : 'SEO metadata for the blog archive page'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2"><Search className="h-3.5 w-3.5" />{isAr ? 'بيانات SEO' : 'SEO Meta Data'}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Meta Title (EN)</Label><Input value={blogSeo.meta_title || ''} onChange={e => setBlogSeoField('meta_title', e.target.value)} placeholder="Blog - Our Latest Articles" /></div>
              <div><Label>Meta Title (AR)</Label><Input dir="rtl" value={blogSeo.meta_title_ar || ''} onChange={e => setBlogSeoField('meta_title_ar', e.target.value)} placeholder="المدونة - أحدث المقالات" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Meta Description (EN)</Label><Textarea value={blogSeo.meta_description || ''} onChange={e => setBlogSeoField('meta_description', e.target.value)} rows={2} placeholder="Read our latest articles and insights..." /></div>
              <div><Label>Meta Description (AR)</Label><Textarea dir="rtl" value={blogSeo.meta_description_ar || ''} onChange={e => setBlogSeoField('meta_description_ar', e.target.value)} rows={2} placeholder="اقرأ أحدث مقالاتنا..." /></div>
            </div>
            <div><Label>{isAr ? 'الكلمات المفتاحية' : 'Keywords'}</Label><Input value={blogSeo.meta_keywords || ''} onChange={e => setBlogSeoField('meta_keywords', e.target.value)} placeholder="blog, articles, islamic education" /></div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{isAr ? 'بيانات المشاركة' : 'Open Graph'}</h4>
            <div><Label>OG Title</Label><Input value={blogSeo.og_title || ''} onChange={e => setBlogSeoField('og_title', e.target.value)} placeholder="Blog" /></div>
            <div><Label>OG Description</Label><Textarea value={blogSeo.og_description || ''} onChange={e => setBlogSeoField('og_description', e.target.value)} rows={2} /></div>
            <ImagePickerField label={isAr ? 'صورة OG' : 'OG Image'} value={blogSeo.og_image || ''} onChange={(url) => setBlogSeoField('og_image', url)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveBlog} disabled={savingBlog} size="sm">
              <Save className="h-4 w-4 me-1" />
              {savingBlog ? '...' : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            {isAr ? 'إعدادات العنوان والوصف الافتراضية' : 'Meta Defaults'}
          </CardTitle>
          <CardDescription>{isAr ? 'العنوان والوصف الافتراضي لجميع الصفحات' : 'Default title & description applied to all pages'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{isAr ? 'العنوان الافتراضي' : 'Default Meta Title'}</Label>
            <Input value={seo.meta_title_default} onChange={e => set('meta_title_default')(e.target.value)} placeholder={isAr ? 'اسم موقعك' : 'Your Site Name'} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'الوصف الافتراضي' : 'Default Meta Description'}</Label>
            <Textarea value={seo.meta_description_default} onChange={e => set('meta_description_default')(e.target.value)} placeholder={isAr ? 'وصف مختصر للموقع...' : 'A brief description of your site...'} rows={3} />
            <p className="text-xs text-muted-foreground">{isAr ? 'يُفضل أن يكون أقل من 160 حرف' : 'Recommended under 160 characters'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'فاصل العنوان' : 'Title Separator'}</Label>
              <Select value={seo.title_separator} onValueChange={set('title_separator')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="|">|</SelectItem>
                  <SelectItem value="-">-</SelectItem>
                  <SelectItem value="·">·</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                  <SelectItem value="›">›</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'قالب العنوان' : 'Title Template'}</Label>
              <Input value={seo.title_template} onChange={e => set('title_template')(e.target.value)} placeholder="%page% | %site%" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">{isAr ? 'استخدم %page% و %site%' : 'Use %page% and %site% placeholders'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. General SEO (existing, trimmed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {isAr ? 'إعدادات SEO الأساسية' : 'Core SEO Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{isAr ? 'عنوان الموقع الأساسي (Canonical URL)' : 'Canonical URL'}</Label>
            <Input value={seo.canonical_url} onChange={e => set('canonical_url')(e.target.value)} placeholder="https://yourdomain.com" className="font-mono text-sm" />
          </div>
          <ImagePickerField
            label={isAr ? 'صورة OG الافتراضية' : 'Default OG Image'}
            value={seo.default_og_image}
            onChange={set('default_og_image') as (url: string) => void}
          />
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label>{isAr ? 'السماح بالفهرسة' : 'Allow Indexing'}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">robots: index</p>
              </div>
              <Switch checked={seo.robots_index} onCheckedChange={set('robots_index')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{isAr ? 'السماح بتتبع الروابط' : 'Allow Link Following'}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">robots: follow</p>
              </div>
              <Switch checked={seo.robots_follow} onCheckedChange={set('robots_follow')} />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <Label>{isAr ? 'خريطة الموقع التلقائية' : 'Auto Sitemap'}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{isAr ? 'إنشاء ملف sitemap.xml تلقائياً' : 'Automatically generate sitemap.xml'}</p>
            </div>
            <Switch checked={seo.auto_sitemap} onCheckedChange={set('auto_sitemap')} />
          </div>
        </CardContent>
      </Card>

      {/* 3. Open Graph Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {isAr ? 'إعدادات Open Graph و Twitter' : 'Open Graph & Twitter Defaults'}
          </CardTitle>
          <CardDescription>{isAr ? 'التحكم بظهور الروابط عند المشاركة' : 'Control how links appear when shared on social media'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'نوع OG' : 'OG Type'}</Label>
              <Select value={seo.og_type} onValueChange={set('og_type')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">website</SelectItem>
                  <SelectItem value="article">article</SelectItem>
                  <SelectItem value="product">product</SelectItem>
                  <SelectItem value="profile">profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'اللغة (Locale)' : 'OG Locale'}</Label>
              <Select value={seo.og_locale} onValueChange={set('og_locale')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_US">en_US</SelectItem>
                  <SelectItem value="ar_SA">ar_SA</SelectItem>
                  <SelectItem value="ar_EG">ar_EG</SelectItem>
                  <SelectItem value="en_GB">en_GB</SelectItem>
                  <SelectItem value="fr_FR">fr_FR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'نوع بطاقة Twitter' : 'Twitter Card Type'}</Label>
              <Select value={seo.twitter_card_type} onValueChange={set('twitter_card_type')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">summary</SelectItem>
                  <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                  <SelectItem value="app">app</SelectItem>
                  <SelectItem value="player">player</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'عنوان OG الافتراضي' : 'Default OG Title'}</Label>
            <Input value={seo.og_title_default} onChange={e => set('og_title_default')(e.target.value)} placeholder={isAr ? 'يُستخدم إذا لم تحدد الصفحة عنواناً' : 'Used when page has no specific OG title'} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'وصف OG الافتراضي' : 'Default OG Description'}</Label>
            <Textarea value={seo.og_description_default} onChange={e => set('og_description_default')(e.target.value)} rows={2} placeholder={isAr ? 'وصف مختصر...' : 'Brief description...'} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Structured Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? 'البيانات المنظمة (JSON-LD)' : 'Structured Data (JSON-LD)'}
          </CardTitle>
          <CardDescription>{isAr ? 'بيانات المنظمة لمحركات البحث' : 'Organization data for search engines'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'اسم المنظمة' : 'Organization Name'}</Label>
              <Input value={seo.json_ld_org_name} onChange={e => set('json_ld_org_name')(e.target.value)} placeholder="My Organization" />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'نوع المنظمة' : 'Organization Type'}</Label>
              <Select value={seo.json_ld_org_type} onValueChange={set('json_ld_org_type')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="EducationalOrganization">EducationalOrganization</SelectItem>
                  <SelectItem value="LocalBusiness">LocalBusiness</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="NonprofitOrganization">NonprofitOrganization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'رابط المنظمة' : 'Organization URL'}</Label>
            <Input value={seo.json_ld_org_url} onChange={e => set('json_ld_org_url')(e.target.value)} placeholder="https://yourdomain.com" className="font-mono text-sm" />
          </div>
          <ImagePickerField
            label={isAr ? 'شعار المنظمة' : 'Organization Logo'}
            value={seo.json_ld_org_logo}
            onChange={set('json_ld_org_logo') as (url: string) => void}
          />
          <div className="space-y-1.5">
            <Label>{isAr ? 'وصف المنظمة' : 'Organization Description'}</Label>
            <Textarea value={seo.json_ld_org_description} onChange={e => set('json_ld_org_description')(e.target.value)} rows={2} placeholder={isAr ? 'وصف مختصر للمنظمة' : 'Brief organization description'} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'بريد التواصل' : 'Contact Email'}</Label>
              <Input type="email" value={seo.json_ld_contact_email} onChange={e => set('json_ld_contact_email')(e.target.value)} placeholder="info@example.com" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'رقم التواصل' : 'Contact Phone'}</Label>
              <Input value={seo.json_ld_contact_phone} onChange={e => set('json_ld_contact_phone')(e.target.value)} placeholder="+1-234-567-8900" className="font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'JSON-LD مخصص (متقدم)' : 'Custom JSON-LD (Advanced)'}</Label>
            <Textarea value={seo.json_ld_custom} onChange={e => set('json_ld_custom')(e.target.value)} rows={5} placeholder='{"@context":"https://schema.org",...}' className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">{isAr ? 'أضف بيانات منظمة مخصصة بصيغة JSON-LD' : 'Add custom structured data in JSON-LD format'}</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Social Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isAr ? 'روابط التواصل الاجتماعي' : 'Social Media Profiles'}
          </CardTitle>
          <CardDescription>{isAr ? 'تُستخدم في البيانات المنظمة وروابط الموقع' : 'Used in structured data and site links'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Twitter / X</Label>
              <Input value={seo.social_twitter} onChange={e => set('social_twitter')(e.target.value)} placeholder="@username" />
            </div>
            <div className="space-y-1.5">
              <Label>Facebook</Label>
              <Input value={seo.social_facebook} onChange={e => set('social_facebook')(e.target.value)} placeholder="https://facebook.com/page" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Instagram</Label>
              <Input value={seo.social_instagram} onChange={e => set('social_instagram')(e.target.value)} placeholder="https://instagram.com/username" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>YouTube</Label>
              <Input value={seo.social_youtube} onChange={e => set('social_youtube')(e.target.value)} placeholder="https://youtube.com/@channel" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input value={seo.social_linkedin} onChange={e => set('social_linkedin')(e.target.value)} placeholder="https://linkedin.com/company/name" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>TikTok</Label>
              <Input value={seo.social_tiktok} onChange={e => set('social_tiktok')(e.target.value)} placeholder="https://tiktok.com/@username" className="font-mono text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Verification Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isAr ? 'رموز التحقق' : 'Verification Codes'}
          </CardTitle>
          <CardDescription>{isAr ? 'أكواد التحقق من ملكية الموقع لمحركات البحث' : 'Site ownership verification for search engines & platforms'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Google</Label>
              <Input value={seo.google_verification} onChange={e => set('google_verification')(e.target.value)} placeholder="content value" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Bing</Label>
              <Input value={seo.bing_verification} onChange={e => set('bing_verification')(e.target.value)} placeholder="content value" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Yandex</Label>
              <Input value={seo.yandex_verification} onChange={e => set('yandex_verification')(e.target.value)} placeholder="content value" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Pinterest</Label>
              <Input value={seo.pinterest_verification} onChange={e => set('pinterest_verification')(e.target.value)} placeholder="content value" className="font-mono text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Custom Head & Robots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            {isAr ? 'حقن أكواد مخصصة' : 'Custom Code Injection'}
          </CardTitle>
          <CardDescription>{isAr ? 'أضف أكواد مخصصة في رأس الصفحة أو قواعد robots.txt' : 'Inject custom code into <head> or robots.txt rules'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{isAr ? 'أكواد مخصصة في <head>' : 'Custom <head> Injection'}</Label>
            <Textarea value={seo.custom_head_injection} onChange={e => set('custom_head_injection')(e.target.value)} rows={5} placeholder={'<meta name="custom" content="value" />\n<script>...</script>'} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">{isAr ? 'تُضاف قبل إغلاق وسم </head>' : 'Injected before </head> closing tag'}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? 'قواعد robots.txt مخصصة' : 'Custom robots.txt Rules'}</Label>
            <Textarea value={seo.custom_robots_rules} onChange={e => set('custom_robots_rules')(e.target.value)} rows={4} placeholder={'Disallow: /admin/\nDisallow: /api/'} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">{isAr ? 'قواعد إضافية تُضاف لملف robots.txt' : 'Additional rules appended to robots.txt'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-1" />
          {saving ? '...' : (isAr ? 'حفظ الإعدادات' : 'Save Settings')}
        </Button>
      </div>
    </div>
  );
};

export default SeoSettings;
