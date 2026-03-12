import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Columns3 } from 'lucide-react';
import { ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import ImagePickerField from '@/components/media/ImagePickerField';
import type { CopyrightConfig, CopyrightSlotContent } from '@/components/landing/CopyrightBar';

interface Props {
  config: CopyrightConfig;
  onChange: (config: CopyrightConfig) => void;
  policies: { slug: string; title: string; title_ar: string | null }[];
  websitePages: { slug: string; title: string; title_ar: string | null }[];
}

const LAYOUT_DESCRIPTIONS = [
  { value: 1, label: 'Copyright Center', labelAr: 'حقوق النشر في المنتصف', icon: '[ © ]' },
  { value: 2, label: 'Copyright Left, Content Right', labelAr: 'حقوق النشر يسار، محتوى يمين', icon: '[ © | ◻ ]' },
  { value: 3, label: 'Content Left, Copyright Right', labelAr: 'محتوى يسار، حقوق النشر يمين', icon: '[ ◻ | © ]' },
  { value: 4, label: 'Copyright Left, Secondary Center, Content Right', labelAr: 'حقوق النشر يسار، ثانوي وسط، محتوى يمين', icon: '[ © | ◇ | ◻ ]' },
  { value: 5, label: 'Content Left, Secondary Center, Copyright Right', labelAr: 'محتوى يسار، ثانوي وسط، حقوق النشر يمين', icon: '[ ◻ | ◇ | © ]' },
  { value: 6, label: 'Content Left, Copyright Center, Secondary Right', labelAr: 'محتوى يسار، حقوق النشر وسط، ثانوي يمين', icon: '[ ◻ | © | ◇ ]' },
];

const CopyrightSettingsEditor = ({ config, onChange, policies, websitePages }: Props) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const update = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const hasOther = [2, 3, 4, 5, 6].includes(config.layout);
  const hasSecondary = [4, 5, 6].includes(config.layout);

  const renderSlotEditor = (
    slotKey: 'other_content' | 'secondary_content',
    slotLabel: string,
  ) => {
    const slot: CopyrightSlotContent = config[slotKey] || { type: 'text' };

    const updateSlot = (field: string, value: any) => {
      update(slotKey, { ...slot, [field]: value });
    };

    const addLink = () => {
      const links = [...(slot.links || [])];
      links.push({ type: 'policy', slug: '', label: '', label_ar: '' });
      updateSlot('links', links);
    };

    const removeLink = (idx: number) => {
      const links = [...(slot.links || [])];
      links.splice(idx, 1);
      updateSlot('links', links);
    };

    const updateLink = (idx: number, field: string, value: string) => {
      const links = [...(slot.links || [])];
      links[idx] = { ...links[idx], [field]: value };
      updateSlot('links', links);
    };

    const selectPageOrPolicy = (idx: number, combined: string) => {
      // combined = "policy:slug" or "page:slug"
      const [type, slug] = combined.split(':');
      const source = type === 'policy' ? policies : websitePages;
      const found = source.find(p => p.slug === slug);
      const links = [...(slot.links || [])];
      links[idx] = {
        ...links[idx],
        type: type as 'policy' | 'page',
        slug,
        label: found?.title || slug,
        label_ar: found?.title_ar || found?.title || slug,
      };
      updateSlot('links', links);
    };

    return (
      <div className="rounded-lg border border-border p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{slotLabel}</Badge>
        </div>

        {/* Content type selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">{isAr ? 'نوع المحتوى' : 'Content Type'}</Label>
          <div className="flex gap-1.5">
            {(['image', 'text', 'links'] as const).map(t => (
              <button
                key={t}
                onClick={() => updateSlot('type', t)}
                className={`flex-1 h-8 rounded-md border-2 text-xs font-medium transition-all ${
                  slot.type === t
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t === 'image' ? (isAr ? 'صورة' : 'Image')
                  : t === 'text' ? (isAr ? 'نص' : 'Text')
                  : (isAr ? 'روابط' : 'Links')}
              </button>
            ))}
          </div>
        </div>

        {/* Type-specific editor */}
        {slot.type === 'image' && (
          <ImagePickerField
            label={isAr ? 'الصورة' : 'Image'}
            value={slot.image_url || ''}
            onChange={(url) => updateSlot('image_url', url)}
          />
        )}

        {slot.type === 'text' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Text (EN)</Label><Input value={slot.text || ''} onChange={e => updateSlot('text', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Text (AR)</Label><Input dir="rtl" value={slot.text_ar || ''} onChange={e => updateSlot('text_ar', e.target.value)} className="h-8 text-sm" /></div>
          </div>
        )}

        {slot.type === 'links' && (
          <div className="space-y-2">
            {(slot.links || []).map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={link.slug ? `${link.type}:${link.slug}` : ''}
                  onValueChange={(v) => selectPageOrPolicy(i, v)}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder={isAr ? 'اختر صفحة' : 'Select page'} />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.length > 0 && (
                      <>
                        <SelectItem value="__policies_header" disabled className="text-[10px] font-bold text-muted-foreground">
                          {isAr ? '── السياسات ──' : '── Policies ──'}
                        </SelectItem>
                        {policies.map(p => (
                          <SelectItem key={`policy:${p.slug}`} value={`policy:${p.slug}`}>
                            {isAr ? (p.title_ar || p.title) : p.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {websitePages.length > 0 && (
                      <>
                        <SelectItem value="__pages_header" disabled className="text-[10px] font-bold text-muted-foreground">
                          {isAr ? '── الصفحات ──' : '── Pages ──'}
                        </SelectItem>
                        {websitePages.map(p => (
                          <SelectItem key={`page:${p.slug}`} value={`page:${p.slug}`}>
                            {isAr ? (p.title_ar || p.title) : p.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => removeLink(i)}>
                  <Trash2 className={ACTION_ICON} />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addLink}>
              <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة رابط' : 'Add Link'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <hr className="border-border" />
      <Label className="text-sm font-medium">{isAr ? 'شريط حقوق النشر' : 'Copyright Bar'}</Label>

      {/* Layout selector */}
      <div className="space-y-2">
        <Label className="text-xs">{isAr ? 'التخطيط' : 'Layout'}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LAYOUT_DESCRIPTIONS.map(l => (
            <button
              key={l.value}
              onClick={() => update('layout', l.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-center ${
                config.layout === l.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <span className="text-xs font-mono text-muted-foreground">{l.icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${config.layout === l.value ? 'text-primary' : 'text-muted-foreground'}`}>
                {isAr ? l.labelAr : l.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Copyright text */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label className="text-xs">Copyright (EN)</Label><Input value={config.copyright_text || ''} onChange={e => update('copyright_text', e.target.value)} className="h-8 text-sm" placeholder="© 2026 All rights reserved." /></div>
        <div><Label className="text-xs">Copyright (AR)</Label><Input dir="rtl" value={config.copyright_text_ar || ''} onChange={e => update('copyright_text_ar', e.target.value)} className="h-8 text-sm" /></div>
      </div>

      {/* Other content slot */}
      {hasOther && renderSlotEditor('other_content', isAr ? 'المحتوى الإضافي' : 'Other Content')}

      {/* Secondary content slot */}
      {hasSecondary && renderSlotEditor('secondary_content', isAr ? 'المحتوى الثانوي' : 'Secondary Content')}
    </div>
  );
};

export default CopyrightSettingsEditor;
