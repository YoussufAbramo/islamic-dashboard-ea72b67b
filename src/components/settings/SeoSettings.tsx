import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Search, Globe, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';

interface SeoConfig {
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
};

const SeoSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [seo, setSeo] = useState<SeoConfig>(defaultSeo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('content').eq('section_key', 'seo_global_config').maybeSingle();
      if (data?.content) setSeo({ ...defaultSeo, ...(data.content as any) });
    };
    fetch();
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

  return (
    <div className="space-y-6">
      {/* General SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {isAr ? 'إعدادات SEO المتقدمة' : 'Advanced SEO Settings'}
          </CardTitle>
          <CardDescription>{isAr ? 'تحكم في إعدادات تحسين محركات البحث للموقع' : 'Control search engine optimization settings for your site'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Canonical URL */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{isAr ? 'عنوان الموقع الأساسي (Canonical URL)' : 'Canonical URL'}</Label>
            <Input value={seo.canonical_url} onChange={e => setSeo(p => ({ ...p, canonical_url: e.target.value }))} placeholder="https://yourdomain.com" className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">{isAr ? 'عنوان URL الأساسي لمنع المحتوى المكرر' : 'Base URL to prevent duplicate content issues'}</p>
          </div>

          {/* Default OG Image */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" />{isAr ? 'صورة OG الافتراضية' : 'Default OG Image'}</Label>
            <Input value={seo.default_og_image} onChange={e => setSeo(p => ({ ...p, default_og_image: e.target.value }))} placeholder="https://yourdomain.com/og-image.jpg" className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">{isAr ? 'الصورة الافتراضية عند مشاركة الصفحات على وسائل التواصل' : 'Default image when pages are shared on social media'}</p>
          </div>

          {/* Robots */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label>{isAr ? 'السماح بالفهرسة' : 'Allow Indexing'}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">robots: index</p>
              </div>
              <Switch checked={seo.robots_index} onCheckedChange={v => setSeo(p => ({ ...p, robots_index: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{isAr ? 'السماح بتتبع الروابط' : 'Allow Link Following'}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">robots: follow</p>
              </div>
              <Switch checked={seo.robots_follow} onCheckedChange={v => setSeo(p => ({ ...p, robots_follow: v }))} />
            </div>
          </div>

          {/* Verification */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'تحقق Google' : 'Google Verification'}</Label>
              <Input value={seo.google_verification} onChange={e => setSeo(p => ({ ...p, google_verification: e.target.value }))} placeholder="content value" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'تحقق Bing' : 'Bing Verification'}</Label>
              <Input value={seo.bing_verification} onChange={e => setSeo(p => ({ ...p, bing_verification: e.target.value }))} placeholder="content value" className="font-mono text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structured Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? 'البيانات المنظمة (JSON-LD)' : 'Structured Data (JSON-LD)'}
          </CardTitle>
          <CardDescription>{isAr ? 'إعدادات المنظمة للبيانات المنظمة' : 'Organization settings for structured data'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'اسم المنظمة' : 'Organization Name'}</Label>
              <Input value={seo.json_ld_org_name} onChange={e => setSeo(p => ({ ...p, json_ld_org_name: e.target.value }))} placeholder="My Organization" />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'رابط المنظمة' : 'Organization URL'}</Label>
              <Input value={seo.json_ld_org_url} onChange={e => setSeo(p => ({ ...p, json_ld_org_url: e.target.value }))} placeholder="https://yourdomain.com" className="font-mono text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isAr ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Twitter / X</Label>
              <Input value={seo.social_twitter} onChange={e => setSeo(p => ({ ...p, social_twitter: e.target.value }))} placeholder="@username" />
            </div>
            <div className="space-y-1.5">
              <Label>Facebook</Label>
              <Input value={seo.social_facebook} onChange={e => setSeo(p => ({ ...p, social_facebook: e.target.value }))} placeholder="https://facebook.com/page" className="font-mono text-sm" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <Label>{isAr ? 'خريطة الموقع التلقائية' : 'Auto Sitemap'}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{isAr ? 'إنشاء ملف sitemap.xml تلقائياً' : 'Automatically generate sitemap.xml'}</p>
            </div>
            <Switch checked={seo.auto_sitemap} onCheckedChange={v => setSeo(p => ({ ...p, auto_sitemap: v }))} />
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
