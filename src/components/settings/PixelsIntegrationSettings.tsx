import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, BarChart3, Tag, Eye, Search, Target, Camera, Video, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';

interface PixelConfig {
  google_analytics: string;
  google_tag_manager: string;
  meta_pixel: string;
  google_search_console: string;
  gosopro_pixel: string;
  snapchat_pixel: string;
  tiktok_pixel: string;
  clarity_pixel: string;
}

const defaultPixels: PixelConfig = {
  google_analytics: '',
  google_tag_manager: '',
  meta_pixel: '',
  google_search_console: '',
  gosopro_pixel: '',
  snapchat_pixel: '',
  tiktok_pixel: '',
  clarity_pixel: '',
};

const pixelFields = [
  { key: 'google_analytics' as const, label: 'Google Analytics', labelAr: 'Google Analytics', icon: BarChart3, placeholder: 'G-XXXXXXXXXX', description: 'Measurement ID from Google Analytics 4' },
  { key: 'google_tag_manager' as const, label: 'Google Tag Manager', labelAr: 'Google Tag Manager', icon: Tag, placeholder: 'GTM-XXXXXXX', description: 'Container ID from Google Tag Manager' },
  { key: 'meta_pixel' as const, label: 'Meta Pixel', labelAr: 'Meta Pixel', icon: Eye, placeholder: 'XXXXXXXXXXXXXXXX', description: 'Pixel ID from Meta Business Suite' },
  { key: 'google_search_console' as const, label: 'Google Search Console', labelAr: 'Google Search Console', icon: Search, placeholder: 'HTML tag verification content', description: 'Meta tag content for verification' },
  { key: 'gosopro_pixel' as const, label: 'GoSoPro.app Pixel', labelAr: 'GoSoPro.app Pixel', icon: Sparkles, placeholder: 'GSP-XXXXXXXXXX', description: 'Pixel ID from GoSoPro.app' },
  { key: 'snapchat_pixel' as const, label: 'Snapchat Pixel', labelAr: 'Snapchat Pixel', icon: Camera, placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', description: 'Pixel ID from Snapchat Ads Manager' },
  { key: 'tiktok_pixel' as const, label: 'TikTok Pixel', labelAr: 'TikTok Pixel', icon: Video, placeholder: 'XXXXXXXXXXXXXXXXXXXXX', description: 'Pixel ID from TikTok Ads Manager' },
  { key: 'clarity_pixel' as const, label: 'Microsoft Clarity', labelAr: 'Microsoft Clarity', icon: Target, placeholder: 'XXXXXXXXXX', description: 'Project ID from Microsoft Clarity' },
];

const PixelsIntegrationSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [pixels, setPixels] = useState<PixelConfig>(defaultPixels);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('content').eq('section_key', 'pixels_config').maybeSingle();
      if (data?.content) {
        setPixels({ ...defaultPixels, ...(data.content as any) });
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'pixels_config',
      content: pixels as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'section_key' });
    setSaving(false);
    if (error) { notifyError({ error: 'GENERAL_SAVE_FAILED', isAr }); return; }
    toast.success(isAr ? 'تم حفظ إعدادات البيكسل' : 'Pixel settings saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isAr ? 'تكامل البيكسل والتتبع' : 'Pixel & Tracking Integrations'}
          </CardTitle>
          <CardDescription>
            {isAr
              ? 'أضف معرفات التتبع والبيكسل لتحليل أداء الموقع'
              : 'Add tracking and pixel IDs to analyze website performance'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5">
            {pixelFields.map(field => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="font-medium">{field.label}</Label>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                    <Input
                      value={pixels[field.key]}
                      onChange={e => setPixels(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 me-1" />
              {saving ? '...' : (isAr ? 'حفظ الإعدادات' : 'Save Settings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PixelsIntegrationSettings;
