import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Pencil, X, Search, Globe, Menu, Columns3,
  Star, Sparkles, Shield, Megaphone, BookOpen, Users, BarChart3, HelpCircle, Mail, Layers, CreditCard, Quote, Handshake, Settings2, Eye, EyeOff, LayoutTemplate, Check, PanelBottom, Sun, Moon, ImageIcon,
} from 'lucide-react';
import { HEADER_STYLES, type HeaderStyleKey } from '@/components/landing/LandingHeaders';
import ImagePickerField from '@/components/media/ImagePickerField';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DEFAULT_SECTION_ORDER, defaultSectionContent, defaultGeneralContent, defaultNavItems, defaultFooterContent, sectionMeta, type SectionKey, type NavItem, type FooterColumn } from '@/lib/landingDefaults';

const iconMap: Record<string, any> = {
  Star, Sparkles, Shield, Megaphone, BookOpen, Users, BarChart3, HelpCircle, Mail, Layers, CreditCard, Quote, Handshake,
};

// ─── Sortable section card ───
interface SortableCardProps {
  sectionKey: SectionKey;
  isAr: boolean;
  visible: boolean;
  expanded: boolean;
  onToggleVisible: () => void;
  onToggleExpand: () => void;
  children?: React.ReactNode;
}

const SortableSectionCard = ({ sectionKey, isAr, visible, expanded, onToggleVisible, onToggleExpand, children }: SortableCardProps) => {
  const meta = sectionMeta[sectionKey];
  const Icon = iconMap[meta.iconName] || BookOpen;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="font-medium text-sm text-foreground">{isAr ? meta.labelAr : meta.label}</div>
          {!visible && <Badge variant="secondary" className="text-xs">{isAr ? 'مخفي' : 'Hidden'}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleVisible} className="text-muted-foreground hover:text-foreground transition-colors" title={visible ? 'Hide' : 'Show'}>
            {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-border pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───
const LandingContentSettings = () => {
  const { language } = useLanguage();
  const { appLogo, darkLogo, favicon } = useAppSettings();
  const isAr = language === 'ar';
  const [content, setContent] = useState<Record<string, Record<string, any>>>({ ...defaultSectionContent });
  const [general, setGeneral] = useState<Record<string, any>>({ ...defaultGeneralContent });
  const [sectionsOrder, setSectionsOrder] = useState<SectionKey[]>([...DEFAULT_SECTION_ORDER]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'header' | 'sections' | 'footer' | 'seo'>('header');
  const [saving, setSaving] = useState(false);
  const [websitePages, setWebsitePages] = useState<{ slug: string; title: string; title_ar: string | null }[]>([]);
  const [policies, setPolicies] = useState<{ slug: string; title: string; title_ar: string | null }[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const load = async () => {
      const [{ data }, { data: pagesData }, { data: policiesData }] = await Promise.all([
        supabase.from('landing_content').select('*'),
        supabase.from('website_pages').select('slug, title, title_ar, status').eq('status', 'published'),
        supabase.from('policies').select('slug, title, title_ar, is_published').eq('is_published', true),
      ]);
      if (pagesData) setWebsitePages(pagesData as any);
      if (policiesData) setPolicies(policiesData as any);
      if (data) {
        const merged = { ...defaultSectionContent };
        let gen = { ...defaultGeneralContent };
        data.forEach((item: any) => {
          if (item.section_key === 'general') {
            gen = { ...defaultGeneralContent, ...item.content };
          } else {
            merged[item.section_key] = { ...(defaultSectionContent[item.section_key] || {}), ...item.content };
          }
        });
        setContent(merged);
        setGeneral(gen);
        if (gen.sections_order?.length) setSectionsOrder(gen.sections_order);
      }
    };
    load();
  }, []);

  const sectionsVisible: Record<string, boolean> = general.sections_visible || {};

  const updateField = (section: string, field: string, value: any) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const updateGeneralField = (field: string, value: any) => {
    setGeneral(prev => ({ ...prev, [field]: value }));
  };

  const toggleSectionVisibility = (key: string) => {
    const updated = { ...sectionsVisible, [key]: !(sectionsVisible[key] !== false) };
    setGeneral(prev => ({ ...prev, sections_visible: updated }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionsOrder.indexOf(active.id as SectionKey);
      const newIndex = sectionsOrder.indexOf(over.id as SectionKey);
      const newOrder = arrayMove(sectionsOrder, oldIndex, newIndex);
      setSectionsOrder(newOrder);
      setGeneral(prev => ({ ...prev, sections_order: newOrder }));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save general with order & visibility
      const generalPayload = { ...general, sections_order: sectionsOrder };
      const upserts = [
        { section_key: 'general', content: generalPayload, updated_at: new Date().toISOString() },
        ...sectionsOrder.map(key => ({
          section_key: key,
          content: content[key] || defaultSectionContent[key] || {},
          updated_at: new Date().toISOString(),
        })),
      ];
      const { error } = await supabase.from('landing_content').upsert(upserts, { onConflict: 'section_key' });
      if (error) throw error;
      toast.success(isAr ? 'تم حفظ جميع الأقسام بنجاح' : 'All sections saved successfully');
    } catch {
      notifyError({ error: 'GENERAL_SAVE_FAILED', isAr });
    }
    setSaving(false);
  };

  // ─── Array item helpers ───
  const addArrayItem = (section: string, field: string, template: Record<string, any>) => {
    const items = [...(content[section]?.[field] || []), template];
    updateField(section, field, items);
  };

  const removeArrayItem = (section: string, field: string, index: number) => {
    const items = [...(content[section]?.[field] || [])];
    items.splice(index, 1);
    updateField(section, field, items);
  };

  const updateArrayItem = (section: string, field: string, index: number, key: string, value: string) => {
    const items = [...(content[section]?.[field] || [])];
    items[index] = { ...items[index], [key]: value };
    updateField(section, field, items);
  };

  // ─── Section editors ───
  const renderEditor = (key: SectionKey) => {
    const s = content[key] || {};

    const TitleSubtitleFields = ({ sectionKey }: { sectionKey: string }) => (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Title (EN)</Label><Input value={s.title || ''} onChange={e => updateField(sectionKey, 'title', e.target.value)} /></div>
          <div><Label>Title (AR)</Label><Input dir="rtl" value={s.title_ar || ''} onChange={e => updateField(sectionKey, 'title_ar', e.target.value)} /></div>
        </div>
        {s.subtitle !== undefined && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Subtitle (EN)</Label><Textarea value={s.subtitle || ''} onChange={e => updateField(sectionKey, 'subtitle', e.target.value)} rows={2} /></div>
            <div><Label>Subtitle (AR)</Label><Textarea dir="rtl" value={s.subtitle_ar || ''} onChange={e => updateField(sectionKey, 'subtitle_ar', e.target.value)} rows={2} /></div>
          </div>
        )}
      </div>
    );

    switch (key) {
      case 'hero':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="hero" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>CTA Button (EN)</Label><Input value={s.cta || ''} onChange={e => updateField('hero', 'cta', e.target.value)} /></div>
              <div><Label>CTA Button (AR)</Label><Input dir="rtl" value={s.cta_ar || ''} onChange={e => updateField('hero', 'cta_ar', e.target.value)} /></div>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="partners" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الشركاء' : 'Partners'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('partners', 'items', { name: '', name_ar: '', logo_url: '' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Name (EN)</Label><Input value={item.name || ''} onChange={e => updateArrayItem('partners', 'items', i, 'name', e.target.value)} /></div>
                  <div><Label>Name (AR)</Label><Input dir="rtl" value={item.name_ar || ''} onChange={e => updateArrayItem('partners', 'items', i, 'name_ar', e.target.value)} /></div>
                </div>
                <ImagePickerField label={isAr ? 'شعار' : 'Logo'} value={item.logo_url || ''} onChange={(url) => updateArrayItem('partners', 'items', i, 'logo_url', url)} />
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('partners', 'items', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="features" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الميزات' : 'Features'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('features', 'items', { title: '', title_ar: '', desc: '', desc_ar: '', icon: 'Star' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Title (EN)</Label><Input value={item.title || ''} onChange={e => updateArrayItem('features', 'items', i, 'title', e.target.value)} /></div>
                  <div><Label>Title (AR)</Label><Input dir="rtl" value={item.title_ar || ''} onChange={e => updateArrayItem('features', 'items', i, 'title_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Description (EN)</Label><Textarea value={item.desc || ''} onChange={e => updateArrayItem('features', 'items', i, 'desc', e.target.value)} rows={2} /></div>
                  <div><Label>Description (AR)</Label><Textarea dir="rtl" value={item.desc_ar || ''} onChange={e => updateArrayItem('features', 'items', i, 'desc_ar', e.target.value)} rows={2} /></div>
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input value={item.icon || ''} onChange={e => updateArrayItem('features', 'items', i, 'icon', e.target.value)} placeholder="BookOpen, Users, Shield..." />
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('features', 'items', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="stats" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الأرقام' : 'Statistics'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('stats', 'items', { value: '', label: '', label_ar: '' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Value</Label><Input value={item.value || ''} onChange={e => updateArrayItem('stats', 'items', i, 'value', e.target.value)} placeholder="500+" /></div>
                  <div><Label>Label (EN)</Label><Input value={item.label || ''} onChange={e => updateArrayItem('stats', 'items', i, 'label', e.target.value)} /></div>
                  <div><Label>Label (AR)</Label><Input dir="rtl" value={item.label_ar || ''} onChange={e => updateArrayItem('stats', 'items', i, 'label_ar', e.target.value)} /></div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('stats', 'items', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'courses':
      case 'instructors':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey={key} />
            <div>
              <Label>{isAr ? 'الحد الأقصى للعرض' : 'Max Display'}</Label>
              <Input type="number" min={1} max={12} value={s.max_display || (key === 'courses' ? 6 : 4)} onChange={e => updateField(key, 'max_display', parseInt(e.target.value) || 4)} className="w-24" />
            </div>
            <p className="text-xs text-muted-foreground">{isAr ? 'يتم سحب البيانات تلقائياً من قاعدة البيانات' : 'Data is automatically pulled from the database'}</p>
          </div>
        );

      case 'whyus':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="whyus" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الأسباب' : 'Reasons'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('whyus', 'reasons', { title: '', title_ar: '', desc: '', desc_ar: '' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.reasons || []).map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Title (EN)</Label><Input value={r.title || ''} onChange={e => updateArrayItem('whyus', 'reasons', i, 'title', e.target.value)} /></div>
                  <div><Label>Title (AR)</Label><Input dir="rtl" value={r.title_ar || ''} onChange={e => updateArrayItem('whyus', 'reasons', i, 'title_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Description (EN)</Label><Textarea value={r.desc || ''} onChange={e => updateArrayItem('whyus', 'reasons', i, 'desc', e.target.value)} rows={2} /></div>
                  <div><Label>Description (AR)</Label><Textarea dir="rtl" value={r.desc_ar || ''} onChange={e => updateArrayItem('whyus', 'reasons', i, 'desc_ar', e.target.value)} rows={2} /></div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('whyus', 'reasons', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'howitworks':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="howitworks" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الخطوات' : 'Steps'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('howitworks', 'steps', { title: '', title_ar: '', desc: '', desc_ar: '' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.steps || []).map((step: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i + 1}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Title (EN)</Label><Input value={step.title || ''} onChange={e => updateArrayItem('howitworks', 'steps', i, 'title', e.target.value)} /></div>
                  <div><Label>Title (AR)</Label><Input dir="rtl" value={step.title_ar || ''} onChange={e => updateArrayItem('howitworks', 'steps', i, 'title_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Description (EN)</Label><Textarea value={step.desc || ''} onChange={e => updateArrayItem('howitworks', 'steps', i, 'desc', e.target.value)} rows={2} /></div>
                  <div><Label>Description (AR)</Label><Textarea dir="rtl" value={step.desc_ar || ''} onChange={e => updateArrayItem('howitworks', 'steps', i, 'desc_ar', e.target.value)} rows={2} /></div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('howitworks', 'steps', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="testimonials" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الآراء' : 'Testimonials'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('testimonials', 'items', { name: '', name_ar: '', role: '', role_ar: '', photo_url: '', text: '', text_ar: '', rating: 5 })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Name (EN)</Label><Input value={item.name || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'name', e.target.value)} /></div>
                  <div><Label>Name (AR)</Label><Input dir="rtl" value={item.name_ar || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'name_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Role (EN)</Label><Input value={item.role || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'role', e.target.value)} /></div>
                  <div><Label>Role (AR)</Label><Input dir="rtl" value={item.role_ar || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'role_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Text (EN)</Label><Textarea value={item.text || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'text', e.target.value)} rows={2} /></div>
                  <div><Label>Text (AR)</Label><Textarea dir="rtl" value={item.text_ar || ''} onChange={e => updateArrayItem('testimonials', 'items', i, 'text_ar', e.target.value)} rows={2} /></div>
                </div>
                <ImagePickerField label={isAr ? 'الصورة' : 'Photo'} value={item.photo_url || ''} onChange={(url) => updateArrayItem('testimonials', 'items', i, 'photo_url', url)} />
                <div className="w-24">
                  <Label>{isAr ? 'التقييم' : 'Rating'}</Label>
                  <Input type="number" min={1} max={5} value={item.rating || 5} onChange={e => updateArrayItem('testimonials', 'items', i, 'rating', e.target.value)} />
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('testimonials', 'items', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="faq" />
            <div className="flex items-center justify-between">
              <Label className="text-base">{isAr ? 'الأسئلة' : 'Questions'}</Label>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('faq', 'items', { question: '', question_ar: '', answer: '', answer_ar: '' })}>
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {(s.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Question (EN)</Label><Input value={item.question || ''} onChange={e => updateArrayItem('faq', 'items', i, 'question', e.target.value)} /></div>
                  <div><Label>Question (AR)</Label><Input dir="rtl" value={item.question_ar || ''} onChange={e => updateArrayItem('faq', 'items', i, 'question_ar', e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Answer (EN)</Label><Textarea value={item.answer || ''} onChange={e => updateArrayItem('faq', 'items', i, 'answer', e.target.value)} rows={2} /></div>
                  <div><Label>Answer (AR)</Label><Textarea dir="rtl" value={item.answer_ar || ''} onChange={e => updateArrayItem('faq', 'items', i, 'answer_ar', e.target.value)} rows={2} /></div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeArrayItem('faq', 'items', i)}><Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Remove'}</Button>
              </div>
            ))}
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-4">
            <TitleSubtitleFields sectionKey="newsletter" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Button Text (EN)</Label><Input value={s.button_text || ''} onChange={e => updateField('newsletter', 'button_text', e.target.value)} /></div>
              <div><Label>Button Text (AR)</Label><Input dir="rtl" value={s.button_text_ar || ''} onChange={e => updateField('newsletter', 'button_text_ar', e.target.value)} /></div>
            </div>
          </div>
        );

      case 'pricing':
      case 'cta':
        return <TitleSubtitleFields sectionKey={key} />;

      default:
        return <TitleSubtitleFields sectionKey={key} />;
    }
  };

  // ─── Nav menu item helpers ───
  const navItems: NavItem[] = general.nav_items || defaultNavItems;
  const navItemsLeft: NavItem[] | null = general.nav_items_left;
  const navItemsRight: NavItem[] | null = general.nav_items_right;
  const headerStyle: HeaderStyleKey = general.header_style || 'classic';
  const isCentered = headerStyle === 'centered';

  const updateNavItem = (listKey: string, index: number, field: string, value: string) => {
    const items = [...(general[listKey] || defaultNavItems)];
    items[index] = { ...items[index], [field]: value };
    updateGeneralField(listKey, items);
  };

  const addNavItem = (listKey: string) => {
    const items = [...(general[listKey] || (listKey === 'nav_items' ? defaultNavItems : []))];
    items.push({ label: '', label_ar: '', id: '' });
    updateGeneralField(listKey, items);
  };

  const removeNavItem = (listKey: string, index: number) => {
    const items = [...(general[listKey] || [])];
    items.splice(index, 1);
    updateGeneralField(listKey, items);
  };

  const renderNavItems = (listKey: string, items: NavItem[], title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <Button variant="outline" size="sm" onClick={() => addNavItem(listKey)}>
          <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-3">
          <div className="grid grid-cols-3 gap-2 flex-1">
            <div><Label className="text-xs">Label (EN)</Label><Input value={item.label || ''} onChange={e => updateNavItem(listKey, i, 'label', e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Label (AR)</Label><Input dir="rtl" value={item.label_ar || ''} onChange={e => updateNavItem(listKey, i, 'label_ar', e.target.value)} className="h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">{isAr ? 'الوجهة' : 'Target'}</Label>
              <Select value={item.id || ''} onValueChange={val => updateNavItem(listKey, i, 'id', val)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__group_sections" disabled className="text-xs font-semibold text-muted-foreground">{isAr ? '── أقسام الصفحة ──' : '── Page Sections ──'}</SelectItem>
                  <SelectItem value="top">{isAr ? 'الرئيسية (أعلى)' : 'Home (Top)'}</SelectItem>
                  {DEFAULT_SECTION_ORDER.map(sk => (
                    <SelectItem key={sk} value={sk}>{isAr ? sectionMeta[sk].labelAr : sectionMeta[sk].label}</SelectItem>
                  ))}
                  {websitePages.length > 0 && (
                    <>
                      <SelectItem value="__group_pages" disabled className="text-xs font-semibold text-muted-foreground">{isAr ? '── الصفحات الرئيسية ──' : '── Main Pages ──'}</SelectItem>
                      {websitePages.map(p => (
                        <SelectItem key={p.slug} value={`/page/${p.slug}`}>{isAr ? (p.title_ar || p.title) : p.title}</SelectItem>
                      ))}
                    </>
                  )}
                  {policies.length > 0 && (
                    <>
                      <SelectItem value="__group_policies" disabled className="text-xs font-semibold text-muted-foreground">{isAr ? '── السياسات ──' : '── Policies ──'}</SelectItem>
                      {policies.map(p => (
                        <SelectItem key={p.slug} value={`/policy/${p.slug}`}>{isAr ? (p.title_ar || p.title) : p.title}</SelectItem>
                      ))}
                    </>
                  )}
                  <SelectItem value="__group_other" disabled className="text-xs font-semibold text-muted-foreground">{isAr ? '── أخرى ──' : '── Other ──'}</SelectItem>
                  <SelectItem value="/blog">{isAr ? 'المدونة' : 'Blog'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-5 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeNavItem(listKey, i)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-lg">{isAr ? 'لا توجد عناصر' : 'No items'}</p>}
    </div>
  );

  // ─── Header Style tab ───
  const renderHeaderTab = () => (
    <div className="space-y-6">
      {/* Header Style Picker */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2"><LayoutTemplate className="h-4 w-4" />{isAr ? 'نمط الهيدر' : 'Header Style'}</h3>
        <p className="text-xs text-muted-foreground">{isAr ? 'اختر نمط شريط التنقل العلوي لصفحة الهبوط' : 'Choose the top navigation bar style for the landing page'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(HEADER_STYLES) as [HeaderStyleKey, typeof HEADER_STYLES[HeaderStyleKey]][]).map(([key, meta]) => {
            const isSelected = (general.header_style || 'classic') === key;
            return (
              <button
                key={key}
                onClick={() => {
                  updateGeneralField('header_style', key);
                  // Initialize split menus when switching to centered
                  if (key === 'centered' && !general.nav_items_left) {
                    const allItems = general.nav_items || defaultNavItems;
                    const mid = Math.ceil(allItems.length / 2);
                    updateGeneralField('nav_items_left', allItems.slice(0, mid));
                    updateGeneralField('nav_items_right', allItems.slice(mid));
                  }
                }}
                className={`relative flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-start ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 end-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="w-full h-8 rounded-md bg-muted/70 border border-border/50 flex items-center px-2 gap-1.5">
                  {key === 'classic' && (<><div className="h-3 w-3 rounded-sm bg-primary/60" /><div className="flex-1" /><div className="h-1.5 w-4 rounded-full bg-muted-foreground/30" /><div className="h-1.5 w-4 rounded-full bg-muted-foreground/30" /><div className="h-3 w-6 rounded-sm bg-primary/40" /></>)}
                  {key === 'centered' && (<><div className="h-1.5 w-4 rounded-full bg-muted-foreground/30" /><div className="flex-1" /><div className="h-3 w-3 rounded-sm bg-primary/60" /><div className="flex-1" /><div className="h-1.5 w-4 rounded-full bg-muted-foreground/30" /></>)}
                  {key === 'cta-focused' && (<><div className="h-3 w-3 rounded-sm bg-primary/60" /><div className="flex-1" /><div className="h-1.5 w-3 rounded-full bg-muted-foreground/30" /><div className="h-1.5 w-3 rounded-full bg-muted-foreground/30" /><div className="h-3 w-8 rounded-sm bg-primary" /></>)}
                </div>
                <div>
                  <p className="text-sm font-medium">{isAr ? meta.labelAr : meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? meta.descriptionAr : meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items Editor */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2"><Menu className="h-4 w-4" />{isAr ? 'عناصر القائمة' : 'Menu Items'}</h3>
        <p className="text-xs text-muted-foreground">
          {isCentered
            ? (isAr ? 'في النمط المركزي، يتم تقسيم القائمة إلى جزأين حول الشعار' : 'In centered style, the menu is split into two parts around the logo')
            : (isAr ? 'تحرير روابط التنقل التي تظهر في الهيدر' : 'Edit the navigation links shown in the header')}
        </p>

        {isCentered ? (
          <div className="space-y-5">
            {renderNavItems('nav_items_left', navItemsLeft || navItems.slice(0, Math.ceil(navItems.length / 2)), isAr ? 'القائمة اليسرى' : 'Left Menu')}
            <div className="border-t border-border" />
            {renderNavItems('nav_items_right', navItemsRight || navItems.slice(Math.ceil(navItems.length / 2)), isAr ? 'القائمة اليمنى' : 'Right Menu')}
          </div>
        ) : (
          renderNavItems('nav_items', navItems, isAr ? 'روابط التنقل' : 'Navigation Links')
        )}
      </div>
    </div>
  );

  // ─── SEO / General settings ───
  const renderSEO = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2"><Search className="h-4 w-4" />{isAr ? 'بيانات SEO' : 'SEO Meta Data'}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Meta Title (EN)</Label><Input value={general.meta_title || ''} onChange={e => updateGeneralField('meta_title', e.target.value)} placeholder="Islamic Education Platform" /></div>
          <div><Label>Meta Title (AR)</Label><Input dir="rtl" value={general.meta_title_ar || ''} onChange={e => updateGeneralField('meta_title_ar', e.target.value)} placeholder="منصة التعليم الإسلامي" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Meta Description (EN)</Label><Textarea value={general.meta_description || ''} onChange={e => updateGeneralField('meta_description', e.target.value)} rows={2} /></div>
          <div><Label>Meta Description (AR)</Label><Textarea dir="rtl" value={general.meta_description_ar || ''} onChange={e => updateGeneralField('meta_description_ar', e.target.value)} rows={2} /></div>
        </div>
        <div><Label>{isAr ? 'الكلمات المفتاحية' : 'Keywords'}</Label><Input value={general.meta_keywords || ''} onChange={e => updateGeneralField('meta_keywords', e.target.value)} placeholder="islamic, education, quran" /></div>
      </div>
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2"><Globe className="h-4 w-4" />{isAr ? 'بيانات المشاركة' : 'Open Graph'}</h3>
        <div><Label>OG Title</Label><Input value={general.og_title || ''} onChange={e => updateGeneralField('og_title', e.target.value)} /></div>
        <div><Label>OG Description</Label><Textarea value={general.og_description || ''} onChange={e => updateGeneralField('og_description', e.target.value)} rows={2} /></div>
        <ImagePickerField label={isAr ? 'صورة OG' : 'OG Image'} value={general.og_image || ''} onChange={(url) => updateGeneralField('og_image', url)} />
      </div>
    </div>
  );

  // ─── Footer editor ───
  const footer = general.footer || defaultFooterContent;
  const footerColumns: FooterColumn[] = footer.columns || defaultFooterContent.columns;
  const footerColumnsCount: number = footer.columns_count || 3;

  const updateFooterField = (field: string, value: any) => {
    updateGeneralField('footer', { ...footer, [field]: value });
  };

  const updateFooterColumn = (colIdx: number, field: string, value: any) => {
    const cols = [...footerColumns];
    cols[colIdx] = { ...cols[colIdx], [field]: value };
    updateFooterField('columns', cols);
  };

  const updateFooterColumnItem = (colIdx: number, itemIdx: number, field: string, value: string) => {
    const cols = [...footerColumns];
    const items = [...cols[colIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    cols[colIdx] = { ...cols[colIdx], items };
    updateFooterField('columns', cols);
  };

  const addFooterColumnItem = (colIdx: number) => {
    const cols = [...footerColumns];
    cols[colIdx] = { ...cols[colIdx], items: [...cols[colIdx].items, { label: '', label_ar: '', url: '' }] };
    updateFooterField('columns', cols);
  };

  const removeFooterColumnItem = (colIdx: number, itemIdx: number) => {
    const cols = [...footerColumns];
    const items = [...cols[colIdx].items];
    items.splice(itemIdx, 1);
    cols[colIdx] = { ...cols[colIdx], items };
    updateFooterField('columns', cols);
  };

  const handleColumnsCountChange = (count: number) => {
    const cols = [...footerColumns];
    while (cols.length < count) cols.push({ title: '', title_ar: '', items: [] });
    const brandingCol = footer.branding_column ?? 0;
    updateGeneralField('footer', {
      ...footer,
      columns_count: count,
      columns: cols.slice(0, count),
      branding_column: brandingCol >= count ? 0 : brandingCol,
    });
  };

  const logoSourceOptions = [
    { value: 'light', label: isAr ? 'الشعار الفاتح' : 'Light Logo', icon: Sun, preview: appLogo },
    { value: 'dark', label: isAr ? 'الشعار الداكن' : 'Dark Logo', icon: Moon, preview: darkLogo },
    { value: 'favicon', label: isAr ? 'أيقونة الموقع' : 'Favicon', icon: ImageIcon, preview: favicon },
  ];
  const currentLogoSource = footer.logo_source || 'dark';
  const brandingColumn: number = footer.branding_column ?? 0;

  const renderFooterTab = () => (
    <div className="space-y-5">
      {/* Logo source picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isAr ? 'شعار الفوتر' : 'Footer Logo'}</Label>
        <div className="flex gap-2">
          {logoSourceOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFooterField('logo_source', opt.value)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                currentLogoSource === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              {opt.preview ? (
                <img src={opt.preview} alt={opt.label} className="h-8 max-w-[80px] object-contain" />
              ) : (
                <opt.icon className={`h-6 w-6 ${currentLogoSource === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-xs font-medium ${currentLogoSource === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title & Description */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label className="text-xs">Title (EN)</Label><Input value={footer.title || ''} onChange={e => updateFooterField('title', e.target.value)} placeholder="App Name" className="h-9" /></div>
        <div><Label className="text-xs">Title (AR)</Label><Input dir="rtl" value={footer.title_ar || ''} onChange={e => updateFooterField('title_ar', e.target.value)} className="h-9" /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label className="text-xs">Description (EN)</Label><Textarea value={footer.description || ''} onChange={e => updateFooterField('description', e.target.value)} rows={2} className="text-sm" /></div>
        <div><Label className="text-xs">Description (AR)</Label><Textarea dir="rtl" value={footer.description_ar || ''} onChange={e => updateFooterField('description_ar', e.target.value)} rows={2} className="text-sm" /></div>
      </div>

      <hr className="border-border" />

      {/* Layout controls row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Columns count */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? 'عدد الأعمدة' : 'Columns'}</Label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handleColumnsCountChange(n)}
                className={`h-9 w-9 rounded-lg border-2 text-sm font-bold transition-all ${
                  footerColumnsCount === n
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Branding column picker */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{isAr ? 'عمود الهوية' : 'Branding in'}</Label>
          <div className="flex gap-1.5">
            {Array.from({ length: footerColumnsCount }, (_, i) => (
              <button
                key={i}
                onClick={() => updateFooterField('branding_column', i)}
                className={`h-9 px-3 rounded-lg border-2 text-xs font-medium transition-all ${
                  brandingColumn === i
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'
                }`}
              >
                {isAr ? `عمود ${i + 1}` : `Col ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Column editors */}
      <div className={`grid gap-3 ${footerColumnsCount === 1 ? 'grid-cols-1' : footerColumnsCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : footerColumnsCount === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {footerColumns.slice(0, footerColumnsCount).map((col, colIdx) => (
          <Collapsible key={colIdx} defaultOpen={colIdx === 0}>
            <div className="rounded-lg border border-border overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
                    {col.title || col.title_ar || (isAr ? `العمود ${colIdx + 1}` : `Column ${colIdx + 1}`)}
                    {brandingColumn === colIdx && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">{isAr ? 'هوية' : 'Branding'}</Badge>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{col.items.length} {isAr ? 'رابط' : 'links'}</Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 space-y-3 border-t border-border">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div><Label className="text-xs">Title (EN)</Label><Input value={col.title || ''} onChange={e => updateFooterColumn(colIdx, 'title', e.target.value)} className="h-8 text-sm" /></div>
                    <div><Label className="text-xs">Title (AR)</Label><Input dir="rtl" value={col.title_ar || ''} onChange={e => updateFooterColumn(colIdx, 'title_ar', e.target.value)} className="h-8 text-sm" /></div>
                  </div>

                  {col.items.length > 0 && (
                    <div className="space-y-1.5">
                      {col.items.map((link, linkIdx) => (
                        <div key={linkIdx} className="flex items-center gap-1.5 group">
                          <Input value={link.label || ''} onChange={e => updateFooterColumnItem(colIdx, linkIdx, 'label', e.target.value)} className="h-7 text-xs flex-1" placeholder="Label EN" />
                          <Input dir="rtl" value={link.label_ar || ''} onChange={e => updateFooterColumnItem(colIdx, linkIdx, 'label_ar', e.target.value)} className="h-7 text-xs flex-1" placeholder="Label AR" />
                          <Input value={link.url || ''} onChange={e => updateFooterColumnItem(colIdx, linkIdx, 'url', e.target.value)} className="h-7 text-xs flex-1 font-mono" placeholder="/path or #id" />
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" onClick={() => removeFooterColumnItem(colIdx, linkIdx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => addFooterColumnItem(colIdx)}>
                    <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة رابط' : 'Add Link'}
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <button onClick={() => setActiveTab('header')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'header' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <LayoutTemplate className="h-4 w-4" />
          {isAr ? 'الهيدر' : 'Header'}
        </button>
        <button onClick={() => setActiveTab('sections')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'sections' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <Layers className="h-4 w-4" />
          {isAr ? 'الأقسام' : 'Sections'}
        </button>
        <button onClick={() => setActiveTab('footer')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'footer' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <PanelBottom className="h-4 w-4" />
          {isAr ? 'الفوتر' : 'Footer'}
        </button>
        <button onClick={() => setActiveTab('seo')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'seo' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <Settings2 className="h-4 w-4" />
          {isAr ? 'SEO' : 'SEO'}
        </button>
      </div>

      {activeTab === 'header' ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'نمط الهيدر والقائمة' : 'Header Style & Menu'}</CardTitle>
            <CardDescription>{isAr ? 'اختر نمط الهيدر وعدّل عناصر القائمة' : 'Choose header style and customize menu items'}</CardDescription>
          </CardHeader>
          <CardContent>{renderHeaderTab()}</CardContent>
        </Card>
      ) : activeTab === 'footer' ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'بناء الفوتر' : 'Footer Builder'}</CardTitle>
            <CardDescription>{isAr ? 'صمم تذييل صفحة الهبوط بسهولة' : 'Design your landing page footer with ease'}</CardDescription>
          </CardHeader>
          <CardContent>{renderFooterTab()}</CardContent>
        </Card>
      ) : activeTab === 'seo' ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'إعدادات SEO' : 'SEO Settings'}</CardTitle>
            <CardDescription>{isAr ? 'إعدادات محركات البحث والمشاركة' : 'Search engine and social sharing settings'}</CardDescription>
          </CardHeader>
          <CardContent>{renderSEO()}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isAr ? 'اسحب لإعادة الترتيب • اضغط على العين للإظهار/الإخفاء • اضغط القلم للتحرير' : 'Drag to reorder • Click eye to show/hide • Click pencil to edit'}</p>
            <Badge variant="outline">{sectionsOrder.length} {isAr ? 'أقسام' : 'sections'}</Badge>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sectionsOrder.map(key => (
                  <SortableSectionCard
                    key={key}
                    sectionKey={key}
                    isAr={isAr}
                    visible={sectionsVisible[key] !== false}
                    expanded={expandedSection === key}
                    onToggleVisible={() => toggleSectionVisibility(key)}
                    onToggleExpand={() => setExpandedSection(expandedSection === key ? null : key)}
                  >
                    {renderEditor(key)}
                  </SortableSectionCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Save all button */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <Button onClick={handleSaveAll} disabled={saving} size="lg" className="shadow-lg">
          <Save className="h-4 w-4 me-2" />
          {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ جميع التغييرات' : 'Save All Changes')}
        </Button>
      </div>
    </div>
  );
};

export default LandingContentSettings;
