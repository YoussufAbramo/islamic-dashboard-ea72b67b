import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Save, ChevronDown, ExternalLink } from 'lucide-react';
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

interface PixelEnabledConfig {
  google_analytics: boolean;
  google_tag_manager: boolean;
  meta_pixel: boolean;
  google_search_console: boolean;
  gosopro_pixel: boolean;
  snapchat_pixel: boolean;
  tiktok_pixel: boolean;
  clarity_pixel: boolean;
}

const defaultPixels: PixelConfig = {
  google_analytics: '', google_tag_manager: '', meta_pixel: '',
  google_search_console: '', gosopro_pixel: '', snapchat_pixel: '',
  tiktok_pixel: '', clarity_pixel: '',
};

const defaultEnabled: PixelEnabledConfig = {
  google_analytics: false, google_tag_manager: false, meta_pixel: false,
  google_search_console: false, gosopro_pixel: false, snapchat_pixel: false,
  tiktok_pixel: false, clarity_pixel: false,
};

// Brand logo components
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MetaLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#0081FB"/>
  </svg>
);

const SnapchatLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M12.206 1c.864 0 3.633.104 5.089 3.128.536 1.112.405 3.007.3 4.503l-.014.212c-.01.163-.02.322-.024.479.085.044.182.07.285.07.15 0 .303-.04.493-.126a.73.73 0 01.292-.063c.2 0 .392.075.553.208.204.17.307.402.307.643 0 .438-.393.712-.655.85-.08.04-.163.08-.22.115-.317.182-.746.43-.876.934-.074.286-.02.588.162.897l.015.03c.88 1.765.965 3.186.268 4.098-.622.814-1.758 1.124-3.254 1.124-.47 0-.957-.04-1.417-.078l-.247-.02c-.208-.017-.415-.034-.62-.034-.254 0-.482.025-.699.077a2.893 2.893 0 01-.699.268c-.04.005-.083.008-.128.008-.108 0-.21-.016-.27-.028a2.952 2.952 0 01-.698-.268 2.386 2.386 0 00-.698-.077c-.206 0-.413.017-.62.034l-.248.02c-.46.038-.948.078-1.417.078-1.497 0-2.632-.31-3.254-1.124-.697-.912-.612-2.333.268-4.098l.016-.03c.181-.309.235-.611.161-.897-.13-.504-.559-.752-.876-.934a3.077 3.077 0 01-.22-.116c-.262-.137-.655-.411-.655-.849 0-.241.103-.473.307-.643a.814.814 0 01.553-.208.73.73 0 01.292.063c.19.086.343.126.493.126.103 0 .2-.026.285-.07a10.76 10.76 0 01-.024-.479l-.014-.212c-.105-1.496-.236-3.391.3-4.503C8.573 1.104 11.342 1 12.206 1z" fill="#FFFC00" stroke="#333" strokeWidth=".5"/>
  </svg>
);

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.27 8.27 0 004.76 1.5v-3.45a4.85 4.85 0 01-1-.11z" fill="#000"/>
  </svg>
);

const ClarityLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 7.5 12 11.82 4.18 7.5 12 4.18zM3 8.58l8 4v8.84l-8-4V8.58zm10 12.84v-8.84l8-4v8.84l-8 4z" fill="#0078D4"/>
  </svg>
);

const GoSoProLogo = () => (
  <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
    <span className="text-[8px] font-bold text-white">GSP</span>
  </div>
);

const pixelGroups = [
  {
    groupLabel: 'Google',
    groupLabelAr: 'جوجل',
    logo: GoogleLogo,
    fields: [
      { key: 'google_analytics' as const, label: 'Google Analytics', placeholder: 'G-XXXXXXXXXX', description: 'Measurement ID from Google Analytics 4' },
      { key: 'google_tag_manager' as const, label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX', description: 'Container ID from Google Tag Manager' },
      { key: 'google_search_console' as const, label: 'Google Search Console', placeholder: 'HTML tag verification content', description: 'Meta tag content for verification' },
    ],
  },
  {
    groupLabel: 'Social & Ads',
    groupLabelAr: 'التواصل والإعلانات',
    fields: [
      { key: 'meta_pixel' as const, label: 'Meta Pixel', logo: MetaLogo, placeholder: 'XXXXXXXXXXXXXXXX', description: 'Pixel ID from Meta Business Suite' },
      { key: 'snapchat_pixel' as const, label: 'Snapchat Pixel', logo: SnapchatLogo, placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', description: 'Pixel ID from Snapchat Ads Manager' },
      { key: 'tiktok_pixel' as const, label: 'TikTok Pixel', logo: TikTokLogo, placeholder: 'XXXXXXXXXXXXXXXXXXXXX', description: 'Pixel ID from TikTok Ads Manager' },
    ],
  },
  {
    groupLabel: 'Analytics & Other',
    groupLabelAr: 'التحليلات وأخرى',
    fields: [
      { key: 'gosopro_pixel' as const, label: 'GoSoPro.app Pixel', logo: GoSoProLogo, placeholder: 'GSP-XXXXXXXXXX', description: 'Pixel ID from GoSoPro.app', link: 'https://gosopro.app/' },
      { key: 'clarity_pixel' as const, label: 'Microsoft Clarity', logo: ClarityLogo, placeholder: 'XXXXXXXXXX', description: 'Project ID from Microsoft Clarity' },
    ],
  },
];

const PixelsIntegrationSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [pixels, setPixels] = useState<PixelConfig>(defaultPixels);
  const [enabled, setEnabled] = useState<PixelEnabledConfig>(defaultEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('landing_content').select('content').eq('section_key', 'pixels_config').maybeSingle();
      if (data?.content) {
        const content = data.content as any;
        setPixels({ ...defaultPixels, ...content });
        if (content._enabled) setEnabled({ ...defaultEnabled, ...content._enabled });
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('landing_content').upsert({
      section_key: 'pixels_config', content: { ...pixels, _enabled: enabled } as any, updated_at: new Date().toISOString(),
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
            <GoogleLogo />
            {isAr ? 'تكامل البيكسل والتتبع' : 'Pixel & Tracking Integrations'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'أضف معرفات التتبع والبيكسل لتحليل أداء الموقع' : 'Add tracking and pixel IDs to analyze website performance'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {pixelGroups.map(group => {
              const GroupLogo = group.logo;
              const activeCount = group.fields.filter(f => enabled[f.key]).length;
              const allEnabled = activeCount === group.fields.length;
              const toggleGroup = (e: React.MouseEvent) => {
                e.stopPropagation();
                const newVal = !allEnabled;
                setEnabled(prev => {
                  const updated = { ...prev };
                  group.fields.forEach(f => { updated[f.key] = newVal; });
                  return updated;
                });
              };
              return (
                <Collapsible key={group.groupLabel} defaultOpen={group.groupLabel === 'Google'}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {GroupLogo && <GroupLogo />}
                      <span className="font-medium text-sm">{isAr ? group.groupLabelAr : group.groupLabel}</span>
                      {activeCount > 0 ? (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {activeCount}/{group.fields.length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">({group.fields.length})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div onClick={toggleGroup}>
                        <Switch checked={allEnabled} />
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-3 pt-3 ps-2">
                      {group.fields.map(field => {
                        const Logo = (field as any).logo || GroupLogo;
                        const isEnabled = enabled[field.key];
                        return (
                          <div key={field.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'}`}>
                            {Logo && (
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Logo />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium">{field.label}</Label>
                                {(field as any).link && (
                                  <a href={(field as any).link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{field.description}</p>
                            </div>
                            <Input
                              value={pixels[field.key]}
                              onChange={e => setPixels(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="h-8 text-sm font-mono max-w-[280px]"
                              disabled={!isEnabled}
                            />
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={v => setEnabled(prev => ({ ...prev, [field.key]: v }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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
