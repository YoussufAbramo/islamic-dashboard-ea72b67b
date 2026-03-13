import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ContentEditor from '@/components/ContentEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GripVertical, Type, Image, Video, Music,
  ChevronUp, ChevronDown, Loader2, Save, FileEdit, ChevronsUpDown,
  ListOrdered, BookOpen, Brain, RotateCcw, ClipboardList,
  Headphones, CheckCircle2, CheckSquare, ArrowUpDown, TextCursorInput, ToggleLeft, Ear,
  Minus, FileStack, Columns,
} from 'lucide-react';

// ─── Block Types ───
export type BlockType =
  | 'text' | 'image' | 'video' | 'audio'
  | 'divider' | 'page_break' | 'split_screen'
  | 'table_of_content' | 'read_listen' | 'memorization' | 'revision' | 'homework'
  | 'exercise_listen_choose' | 'exercise_text_match' | 'exercise_choose_correct'
  | 'exercise_choose_multiple' | 'exercise_rearrange' | 'exercise_missing_text' | 'exercise_true_false';

export interface ContentBlock {
  id: string;
  type: BlockType;
  // text / rich content blocks
  html?: string;
  // image
  image_url?: string;
  image_caption?: string;
  image_alt?: string;
  // video
  video_type?: 'url' | 'youtube' | 'vimeo' | 'embed';
  video_url?: string;
  video_caption?: string;
  video_embed?: string;
  // audio
  audio_url?: string;
  audio_caption?: string;
  // exercise fields
  question?: string;
  question_ar?: string;
  options?: { text: string; text_ar?: string; is_correct?: boolean }[];
  correct_answer?: boolean; // for true/false
  items?: { text: string; text_ar?: string }[]; // for rearrange
  sentence?: string; // for missing_text
  sentence_ar?: string;
  missing_word?: string;
  missing_word_ar?: string;
  pairs?: { left: string; left_ar?: string; right: string; right_ar?: string }[]; // for text_match
  // table of content
  toc_header_en?: string;
  toc_header_ar?: string;
  toc_style?: 'default' | 'striped' | 'bordered' | 'minimal';
  toc_size?: 'sm' | 'md' | 'lg' | 'xl';
  toc_rows?: { en: string; ar: string }[];
}
const generateId = () => Math.random().toString(36).substring(2, 10);

interface BlockMetaItem {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  color: string;
  group: 'media' | 'content' | 'exercise';
}

const blockMeta: Record<BlockType, BlockMetaItem> = {
  // Media
  text:  { icon: Type, label: 'Text', labelAr: 'نص', color: 'text-blue-500', group: 'media' },
  image: { icon: Image, label: 'Image', labelAr: 'صورة', color: 'text-green-500', group: 'media' },
  video: { icon: Video, label: 'Video', labelAr: 'فيديو', color: 'text-red-500', group: 'media' },
  audio: { icon: Music, label: 'Audio', labelAr: 'صوت', color: 'text-amber-500', group: 'media' },
  // Content Types
  table_of_content: { icon: ListOrdered, label: 'Table of Content', labelAr: 'فهرس المحتويات', color: 'text-indigo-500', group: 'content' },
  read_listen:      { icon: BookOpen, label: 'Read & Listen', labelAr: 'قراءة واستماع', color: 'text-teal-500', group: 'content' },
  memorization:     { icon: Brain, label: 'Memorization', labelAr: 'حفظ', color: 'text-purple-500', group: 'content' },
  revision:         { icon: RotateCcw, label: 'Revision', labelAr: 'مراجعة', color: 'text-cyan-500', group: 'content' },
  homework:         { icon: ClipboardList, label: 'Homework', labelAr: 'واجب', color: 'text-orange-500', group: 'content' },
  // Exercises
  exercise_listen_choose:   { icon: Ear, label: 'Listen & Choose', labelAr: 'استمع واختر', color: 'text-pink-500', group: 'exercise' },
  exercise_text_match:      { icon: ArrowUpDown, label: 'Text Match', labelAr: 'مطابقة النص', color: 'text-violet-500', group: 'exercise' },
  exercise_choose_correct:  { icon: CheckCircle2, label: 'Choose Correct', labelAr: 'اختر الصحيح', color: 'text-emerald-500', group: 'exercise' },
  exercise_choose_multiple: { icon: CheckSquare, label: 'Choose Multiple', labelAr: 'اختر متعدد', color: 'text-sky-500', group: 'exercise' },
  exercise_rearrange:       { icon: ArrowUpDown, label: 'Rearrange', labelAr: 'إعادة ترتيب', color: 'text-lime-500', group: 'exercise' },
  exercise_missing_text:    { icon: TextCursorInput, label: 'Missing Text', labelAr: 'نص ناقص', color: 'text-rose-500', group: 'exercise' },
  exercise_true_false:      { icon: ToggleLeft, label: 'True / False', labelAr: 'صح / خطأ', color: 'text-fuchsia-500', group: 'exercise' },
};

const blockGroups: { key: string; label: string; labelAr: string; types: BlockType[] }[] = [
  { key: 'media', label: '📁 Media', labelAr: '📁 الوسائط', types: ['text', 'image', 'video', 'audio'] },
  { key: 'content', label: '📖 Content', labelAr: '📖 المحتوى', types: ['table_of_content', 'read_listen', 'memorization', 'revision', 'homework'] },
  { key: 'exercise', label: '✏️ Exercises', labelAr: '✏️ التمارين', types: ['exercise_listen_choose', 'exercise_text_match', 'exercise_choose_correct', 'exercise_choose_multiple', 'exercise_rearrange', 'exercise_missing_text', 'exercise_true_false'] },
];

// ─── Exercise Option Editor ───
const OptionsEditor = ({ block, isAr, onChange }: { block: ContentBlock; isAr: boolean; onChange: (b: ContentBlock) => void }) => {
  const options = block.options || [];
  const isMultiple = block.type === 'exercise_choose_multiple';

  const addOption = () => {
    onChange({ ...block, options: [...options, { text: '', text_ar: '', is_correct: false }] });
  };
  const removeOption = (idx: number) => {
    const next = [...options];
    next.splice(idx, 1);
    onChange({ ...block, options: next });
  };
  const updateOption = (idx: number, field: string, value: any) => {
    const next = [...options];
    if (field === 'is_correct' && !isMultiple) {
      // Single correct: uncheck others
      next.forEach((o, i) => { o.is_correct = i === idx; });
    } else {
      next[idx] = { ...next[idx], [field]: value };
    }
    onChange({ ...block, options: next });
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{isAr ? 'الخيارات' : 'Options'}</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type={isMultiple ? 'checkbox' : 'radio'}
            name={`opt-${block.id}`}
            checked={!!opt.is_correct}
            onChange={() => updateOption(i, 'is_correct', !opt.is_correct)}
            className="shrink-0"
          />
          <Input
            value={opt.text}
            onChange={(e) => updateOption(i, 'text', e.target.value)}
            placeholder={isAr ? `خيار ${i + 1}` : `Option ${i + 1}`}
            className="h-7 text-xs flex-1"
          />
          <Input
            value={opt.text_ar || ''}
            onChange={(e) => updateOption(i, 'text_ar', e.target.value)}
            placeholder="عربي"
            dir="rtl"
            className="h-7 text-xs w-28"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeOption(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={addOption}>
        <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة خيار' : 'Add Option'}
      </Button>
    </div>
  );
};

// ─── Pairs Editor (for text_match) ───
const PairsEditor = ({ block, isAr, onChange }: { block: ContentBlock; isAr: boolean; onChange: (b: ContentBlock) => void }) => {
  const pairs = block.pairs || [];
  const addPair = () => onChange({ ...block, pairs: [...pairs, { left: '', right: '', left_ar: '', right_ar: '' }] });
  const removePair = (idx: number) => { const next = [...pairs]; next.splice(idx, 1); onChange({ ...block, pairs: next }); };
  const updatePair = (idx: number, field: string, value: string) => { const next = [...pairs]; next[idx] = { ...next[idx], [field]: value }; onChange({ ...block, pairs: next }); };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{isAr ? 'الأزواج المتطابقة' : 'Matching Pairs'}</Label>
      {pairs.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <Input value={p.left} onChange={(e) => updatePair(i, 'left', e.target.value)} placeholder={isAr ? 'يسار' : 'Left'} className="h-7 text-xs" />
          <span className="text-muted-foreground text-xs">↔</span>
          <Input value={p.right} onChange={(e) => updatePair(i, 'right', e.target.value)} placeholder={isAr ? 'يمين' : 'Right'} className="h-7 text-xs" />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removePair(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={addPair}>
        <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة زوج' : 'Add Pair'}
      </Button>
    </div>
  );
};

// ─── Items Editor (for rearrange) ───
const ItemsEditor = ({ block, isAr, onChange }: { block: ContentBlock; isAr: boolean; onChange: (b: ContentBlock) => void }) => {
  const items = block.items || [];
  const addItem = () => onChange({ ...block, items: [...items, { text: '', text_ar: '' }] });
  const removeItem = (idx: number) => { const next = [...items]; next.splice(idx, 1); onChange({ ...block, items: next }); };
  const updateItem = (idx: number, field: string, value: string) => { const next = [...items]; next[idx] = { ...next[idx], [field]: value }; onChange({ ...block, items: next }); };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{isAr ? 'العناصر بالترتيب الصحيح' : 'Items in correct order'}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
          <Input value={item.text} onChange={(e) => updateItem(i, 'text', e.target.value)} placeholder={isAr ? `عنصر ${i + 1}` : `Item ${i + 1}`} className="h-7 text-xs flex-1" />
          <Input value={item.text_ar || ''} onChange={(e) => updateItem(i, 'text_ar', e.target.value)} placeholder="عربي" dir="rtl" className="h-7 text-xs w-28" />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeItem(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={addItem}>
        <Plus className="h-3 w-3 me-1" />{isAr ? 'إضافة عنصر' : 'Add Item'}
      </Button>
    </div>
  );
};

// ─── Single Block Editor ───
const BlockEditor = ({
  block, isAr, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block: ContentBlock;
  isAr: boolean;
  onChange: (updated: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const meta = blockMeta[block.type];
  const Icon = meta.icon;
  const [collapsed, setCollapsed] = useState(false);

  const renderQuestionField = () => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs">{isAr ? 'السؤال (EN)' : 'Question (EN)'}</Label>
        <Input value={block.question || ''} onChange={(e) => onChange({ ...block, question: e.target.value })} className="mt-1 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">{isAr ? 'السؤال (AR)' : 'Question (AR)'}</Label>
        <Input value={block.question_ar || ''} onChange={(e) => onChange({ ...block, question_ar: e.target.value })} dir="rtl" className="mt-1 h-8 text-sm" />
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-card group relative">
      <div
        className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" onClick={(e) => e.stopPropagation()} />
        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
        <span className="text-xs font-medium text-muted-foreground">
          {isAr ? meta.labelAr : meta.label}
        </span>
        <div className="ms-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}>
            <ChevronsUpDown className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className={cn("grid transition-all duration-300 ease-out", collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
        <div className="overflow-hidden">
      <div className="p-3 space-y-3">
        {/* ── Media blocks ── */}
        {block.type === 'text' && (
          <ContentEditor
            value={block.html || ''}
            onChange={(val) => onChange({ ...block, html: val })}
            placeholder={isAr ? 'اكتب المحتوى هنا...' : 'Write content here...'}
            minHeight="150px"
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isAr ? 'رابط الصورة' : 'Image URL'}</Label>
              <Input placeholder="https://..." value={block.image_url || ''} onChange={(e) => onChange({ ...block, image_url: e.target.value })} className="mt-1" />
            </div>
            {block.image_url && (
              <div className="rounded-lg border overflow-hidden bg-muted/30">
                <img src={block.image_url} alt={block.image_alt || ''} className="max-h-48 mx-auto object-contain" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label><Input value={block.image_caption || ''} onChange={(e) => onChange({ ...block, image_caption: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">{isAr ? 'النص البديل' : 'Alt Text'}</Label><Input value={block.image_alt || ''} onChange={(e) => onChange({ ...block, image_alt: e.target.value })} className="mt-1" /></div>
            </div>
          </div>
        )}

        {block.type === 'video' && (() => {
          const vType = block.video_type || 'url';
          const getEmbedUrl = (url: string, type: string) => {
            if (type === 'youtube') {
              const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
              return m ? `https://www.youtube.com/embed/${m[1]}` : url;
            }
            if (type === 'vimeo') {
              const m = url.match(/vimeo\.com\/(\d+)/);
              return m ? `https://player.vimeo.com/video/${m[1]}` : url;
            }
            return url;
          };
          return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">{isAr ? 'نوع الفيديو' : 'Video Type'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'url' as const, label: isAr ? 'رابط مباشر' : 'Direct URL' },
                  { value: 'youtube' as const, label: 'YouTube' },
                  { value: 'vimeo' as const, label: 'Vimeo' },
                  { value: 'embed' as const, label: isAr ? 'كود تضمين' : 'Embed Code' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...block, video_type: opt.value })}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium border transition-colors",
                      vType === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {vType !== 'embed' ? (
              <div>
                <Label className="text-xs">
                  {vType === 'youtube' ? (isAr ? 'رابط YouTube' : 'YouTube URL')
                    : vType === 'vimeo' ? (isAr ? 'رابط Vimeo' : 'Vimeo URL')
                    : (isAr ? 'رابط الفيديو' : 'Video URL')}
                </Label>
                <Input
                  placeholder={vType === 'youtube' ? 'https://youtube.com/watch?v=...' : vType === 'vimeo' ? 'https://vimeo.com/...' : 'https://...'}
                  value={block.video_url || ''}
                  onChange={(e) => onChange({ ...block, video_url: e.target.value })}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {vType === 'youtube' ? (isAr ? 'الصق رابط فيديو YouTube' : 'Paste a YouTube video link')
                    : vType === 'vimeo' ? (isAr ? 'الصق رابط فيديو Vimeo' : 'Paste a Vimeo video link')
                    : (isAr ? 'يدعم MP4 أو روابط مباشرة للفيديو' : 'Supports MP4 or direct video URLs')}
                </p>
              </div>
            ) : (
              <div>
                <Label className="text-xs">{isAr ? 'كود التضمين' : 'Embed Code'}</Label>
                <textarea
                  placeholder={isAr ? '<iframe src="..." ...></iframe>' : '<iframe src="..." ...></iframe>'}
                  value={block.video_embed || ''}
                  onChange={(e) => onChange({ ...block, video_embed: e.target.value })}
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{isAr ? 'الصق كود iframe أو كود التضمين' : 'Paste an iframe or embed code snippet'}</p>
              </div>
            )}

            {block.video_url && vType !== 'embed' && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                {vType === 'url' ? (
                  <video src={block.video_url} controls className="w-full h-full" />
                ) : (
                  <iframe src={getEmbedUrl(block.video_url, vType)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                )}
              </div>
            )}

            {block.video_embed && vType === 'embed' && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border" dangerouslySetInnerHTML={{ __html: block.video_embed }} />
            )}

            <div><Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label><Input value={block.video_caption || ''} onChange={(e) => onChange({ ...block, video_caption: e.target.value })} className="mt-1" /></div>
          </div>
          );
        })()}

        {block.type === 'audio' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isAr ? 'رابط الصوت' : 'Audio URL'}</Label>
              <Input placeholder="https://..." value={block.audio_url || ''} onChange={(e) => onChange({ ...block, audio_url: e.target.value })} className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">{isAr ? 'يدعم MP3, WAV, OGG' : 'Supports MP3, WAV, OGG'}</p>
            </div>
            {block.audio_url && (
              <div className="p-3 rounded-lg border bg-muted/30"><audio src={block.audio_url} controls className="w-full" /></div>
            )}
            <div><Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label><Input value={block.audio_caption || ''} onChange={(e) => onChange({ ...block, audio_caption: e.target.value })} className="mt-1" /></div>
          </div>
        )}

        {/* ── Table of Content (structured rows) ── */}
        {block.type === 'table_of_content' && (() => {
          const rows = block.toc_rows || [];
          const updateRow = (idx: number, field: 'en' | 'ar', val: string) => {
            const updated = [...rows];
            updated[idx] = { ...updated[idx], [field]: val };
            onChange({ ...block, toc_rows: updated });
          };
          const addRow = () => onChange({ ...block, toc_rows: [...rows, { en: '', ar: '' }] });
          const removeRow = (idx: number) => onChange({ ...block, toc_rows: rows.filter((_, i) => i !== idx) });
          const moveRow = (from: number, to: number) => {
            if (to < 0 || to >= rows.length) return;
            const updated = [...rows];
            const [item] = updated.splice(from, 1);
            updated.splice(to, 0, item);
            onChange({ ...block, toc_rows: updated });
          };
          return (
            <div className="space-y-3">
              {/* Style & Size selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">{isAr ? 'نمط الجدول' : 'Table Style'}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: 'default' as const, label: isAr ? 'افتراضي' : 'Default' },
                      { value: 'striped' as const, label: isAr ? 'مخطط' : 'Striped' },
                      { value: 'bordered' as const, label: isAr ? 'محاط' : 'Bordered' },
                      { value: 'minimal' as const, label: isAr ? 'بسيط' : 'Minimal' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange({ ...block, toc_style: opt.value })}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
                          (block.toc_style || 'default') === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">{isAr ? 'حجم الجدول' : 'Table Size'}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: 'sm' as const, label: 'S' },
                      { value: 'md' as const, label: 'M' },
                      { value: 'lg' as const, label: 'L' },
                      { value: 'xl' as const, label: 'XL' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange({ ...block, toc_size: opt.value })}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors min-w-[32px]",
                          (block.toc_size || 'md') === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{isAr ? 'عناوين الأعمدة' : 'Column Headers'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">English Header</Label>
                    <Input dir="ltr" value={block.toc_header_en || ''} onChange={(e) => onChange({ ...block, toc_header_en: e.target.value })} placeholder="English" className="mt-0.5 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">عنوان العربية</Label>
                    <Input dir="rtl" value={block.toc_header_ar || ''} onChange={(e) => onChange({ ...block, toc_header_ar: e.target.value })} placeholder="العربية" className="mt-0.5 text-xs" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isAr ? 'صفوف جدول المحتويات' : 'Table of Content Rows'}</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addRow}>
                  <Plus className="h-3 w-3" />
                  {isAr ? 'إضافة صف' : 'Add Row'}
                </Button>
              </div>
              {rows.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? 'لا توجد صفوف. أضف صفًا للبدء.' : 'No rows yet. Add a row to get started.'}</p>
                </div>
              )}
              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">{isAr ? `صف ${idx + 1}` : `Row ${idx + 1}`}</span>
                      <div className="flex items-center gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => moveRow(idx, idx - 1)}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={idx === rows.length - 1} onClick={() => moveRow(idx, idx + 1)}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive/60 hover:text-destructive" onClick={() => removeRow(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">English</Label>
                        <Input dir="ltr" value={row.en} onChange={(e) => updateRow(idx, 'en', e.target.value)} placeholder="English content..." className="mt-0.5 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">العربية</Label>
                        <Input dir="rtl" value={row.ar} onChange={(e) => updateRow(idx, 'ar', e.target.value)} placeholder="المحتوى بالعربية..." className="mt-0.5 text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Content type blocks (rich text based) ── */}
        {(block.type === 'read_listen' || block.type === 'memorization' || block.type === 'revision' || block.type === 'homework') && (
          <div className="space-y-3">
            <ContentEditor
              value={block.html || ''}
              onChange={(val) => onChange({ ...block, html: val })}
              placeholder={isAr ? 'اكتب المحتوى هنا...' : 'Write content here...'}
              minHeight="150px"
            />
            {(block.type === 'read_listen' || block.type === 'memorization') && (
              <div>
                <Label className="text-xs">{isAr ? 'رابط الصوت (اختياري)' : 'Audio URL (optional)'}</Label>
                <Input placeholder="https://..." value={block.audio_url || ''} onChange={(e) => onChange({ ...block, audio_url: e.target.value })} className="mt-1" />
                {block.audio_url && <div className="p-2 mt-2 rounded border bg-muted/30"><audio src={block.audio_url} controls className="w-full" /></div>}
              </div>
            )}
          </div>
        )}

        {/* ── Exercise: Listen & Choose ── */}
        {block.type === 'exercise_listen_choose' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isAr ? 'رابط الصوت' : 'Audio URL'}</Label>
              <Input placeholder="https://..." value={block.audio_url || ''} onChange={(e) => onChange({ ...block, audio_url: e.target.value })} className="mt-1" />
              {block.audio_url && <div className="p-2 mt-2 rounded border bg-muted/30"><audio src={block.audio_url} controls className="w-full" /></div>}
            </div>
            {renderQuestionField()}
            <OptionsEditor block={block} isAr={isAr} onChange={onChange} />
          </div>
        )}

        {/* ── Exercise: Choose Correct / Choose Multiple ── */}
        {(block.type === 'exercise_choose_correct' || block.type === 'exercise_choose_multiple') && (
          <div className="space-y-3">
            {renderQuestionField()}
            <OptionsEditor block={block} isAr={isAr} onChange={onChange} />
          </div>
        )}

        {/* ── Exercise: True / False ── */}
        {block.type === 'exercise_true_false' && (
          <div className="space-y-3">
            {renderQuestionField()}
            <div>
              <Label className="text-xs">{isAr ? 'الإجابة الصحيحة' : 'Correct Answer'}</Label>
              <RadioGroup
                value={block.correct_answer === true ? 'true' : block.correct_answer === false ? 'false' : ''}
                onValueChange={(v) => onChange({ ...block, correct_answer: v === 'true' })}
                className="flex gap-4 mt-1"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="true" id={`${block.id}-true`} />
                  <Label htmlFor={`${block.id}-true`} className="text-xs">{isAr ? 'صح' : 'True'}</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="false" id={`${block.id}-false`} />
                  <Label htmlFor={`${block.id}-false`} className="text-xs">{isAr ? 'خطأ' : 'False'}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* ── Exercise: Text Match ── */}
        {block.type === 'exercise_text_match' && (
          <div className="space-y-3">
            {renderQuestionField()}
            <PairsEditor block={block} isAr={isAr} onChange={onChange} />
          </div>
        )}

        {/* ── Exercise: Rearrange ── */}
        {block.type === 'exercise_rearrange' && (
          <div className="space-y-3">
            {renderQuestionField()}
            <p className="text-[10px] text-muted-foreground">{isAr ? 'أدخل العناصر بالترتيب الصحيح. سيتم خلطها للطالب.' : 'Enter items in the correct order. They will be shuffled for the student.'}</p>
            <ItemsEditor block={block} isAr={isAr} onChange={onChange} />
          </div>
        )}

        {/* ── Exercise: Missing Text ── */}
        {block.type === 'exercise_missing_text' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'الجملة (EN)' : 'Sentence (EN)'}</Label>
                <Input value={block.sentence || ''} onChange={(e) => onChange({ ...block, sentence: e.target.value })} placeholder="The ___ is blue" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? 'الجملة (AR)' : 'Sentence (AR)'}</Label>
                <Input value={block.sentence_ar || ''} onChange={(e) => onChange({ ...block, sentence_ar: e.target.value })} dir="rtl" className="mt-1 h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'الكلمة المفقودة (EN)' : 'Missing Word (EN)'}</Label>
                <Input value={block.missing_word || ''} onChange={(e) => onChange({ ...block, missing_word: e.target.value })} placeholder="sky" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? 'الكلمة المفقودة (AR)' : 'Missing Word (AR)'}</Label>
                <Input value={block.missing_word_ar || ''} onChange={(e) => onChange({ ...block, missing_word_ar: e.target.value })} dir="rtl" className="mt-1 h-8 text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

// ─── Add Block Buttons ───
const AddBlockButtons = ({ isAr, onAdd, prominent }: { isAr: boolean; onAdd: (type: BlockType) => void; prominent?: boolean }) => (
  <div className="space-y-4">
    {blockGroups.map(group => (
      <div key={group.key} className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground">{isAr ? group.labelAr : group.label}</span>
        <div className={cn("grid gap-2", prominent ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4")}>
          {group.types.map(type => {
            const meta = blockMeta[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onAdd(type)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed transition-all hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                  prominent ? "p-4" : "p-2.5"
                )}
              >
                <Icon className={cn(prominent ? "h-5 w-5" : "h-4 w-4", meta.color)} />
                <span className={cn("font-medium text-center leading-tight", prominent ? "text-xs" : "text-[10px]")}>{isAr ? meta.labelAr : meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main LessonBuilder Dialog ───
interface LessonBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: { id: string; title: string; title_ar: string | null; content: any } | null;
  isAr: boolean;
  onSaved: () => void;
}

const LessonBuilder = ({ open, onOpenChange, lesson, isAr, onSaved }: LessonBuilderProps) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const initialized = useRef<string | null>(null);

  // Initialize blocks when lesson changes
  if (lesson && initialized.current !== lesson.id) {
    initialized.current = lesson.id;
    const content = lesson.content || {};
    if (Array.isArray(content.blocks) && content.blocks.length > 0) {
      setBlocks(content.blocks.map((b: any) => ({ ...b, id: b.id || generateId() })));
    } else {
      // Migrate legacy content to blocks
      const migrated: ContentBlock[] = [];
      if (content.text || content.body || content.html || content.description) {
        migrated.push({ id: generateId(), type: 'text', html: content.text || content.body || content.html || content.description || '' });
      }
      if (content.video_url || content.videoUrl) {
        migrated.push({ id: generateId(), type: 'video', video_url: content.video_url || content.videoUrl || '' });
      }
      if (content.audio_url || content.audioUrl) {
        migrated.push({ id: generateId(), type: 'audio', audio_url: content.audio_url || content.audioUrl || '' });
      }
      if (content.image_url || content.imageUrl) {
        migrated.push({ id: generateId(), type: 'image', image_url: content.image_url || content.imageUrl || '' });
      }
      setBlocks(migrated);
    }
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) { initialized.current = null; setBlocks([]); }
    onOpenChange(v);
  };

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: ContentBlock = { id: generateId(), type };
    if (type === 'text' || type === 'table_of_content' || type === 'read_listen' || type === 'memorization' || type === 'revision' || type === 'homework') {
      newBlock.html = '';
    }
    if (type === 'exercise_choose_correct' || type === 'exercise_choose_multiple' || type === 'exercise_listen_choose') {
      newBlock.options = [];
    }
    if (type === 'exercise_text_match') { newBlock.pairs = []; }
    if (type === 'exercise_rearrange') { newBlock.items = []; }
    setBlocks(prev => [...prev, newBlock]);
  }, []);

  const updateBlock = useCallback((id: string, updated: ContentBlock) => {
    setBlocks(prev => prev.map(b => b.id === id ? updated : b));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      const newContent = { blocks: blocks as any[] };
      const { error } = await supabase.from('lessons').update({ content: newContent as any }).eq('id', lesson.id);
      if (error) throw error;
      toast.success(isAr ? 'تم حفظ المحتوى' : 'Content saved');
      onSaved();
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, [lesson, blocks, isAr, onSaved]);

  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="truncate block">{isAr ? 'محرر الدرس' : 'Lesson Builder'}</span>
              <span className="text-xs font-normal text-muted-foreground truncate block">
                {isAr && lesson.title_ar ? lesson.title_ar : lesson.title}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {blocks.length} {isAr ? 'كتلة' : blocks.length === 1 ? 'block' : 'blocks'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Content blocks */}
          <div className="flex-1 min-w-0 overflow-y-auto border-e">
            <div className="p-5 space-y-3">
              {blocks.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <FileEdit className="h-12 w-12 mx-auto text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'اختر عنصرًا من اليمين للبدء' : 'Pick an element from the right panel to get started'}
                  </p>
                </div>
              ) : (
                blocks.map((block, idx) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    isAr={isAr}
                    onChange={(updated) => updateBlock(block.id, updated)}
                    onRemove={() => removeBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: Element palette */}
          <div className="w-56 shrink-0 overflow-y-auto bg-muted/20">
            <div className="p-3 space-y-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {isAr ? 'العناصر' : 'Elements'}
              </p>
              {blockGroups.map(group => (
                <div key={group.key} className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground/70 px-1">{isAr ? group.labelAr : group.label}</span>
                  <div className="space-y-1">
                    {group.types.map(type => {
                      const meta = blockMeta[type];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addBlock(type)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md border border-transparent text-start text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                        >
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} />
                          <span className="truncate">{isAr ? meta.labelAr : meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? 'حفظ الدرس' : 'Save Lesson'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonBuilder;
