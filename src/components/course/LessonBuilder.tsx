import { useState, useCallback, useRef, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import SortableList from '@/components/course/SortableList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ContentEditor from '@/components/ContentEditor';
import QuranQuoteEditor from '@/components/course/QuranQuoteEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GripVertical, Type, Image, Video, Music,
  ChevronUp, ChevronDown, Loader2, Save, FileEdit, ChevronsUpDown,
  ListOrdered, BookOpen, Brain, RotateCcw, ClipboardList,
  Headphones, CheckCircle2, CheckSquare, ArrowUpDown, TextCursorInput, ToggleLeft, Ear,
  Minus, FileStack, Columns, Lock, Ban, ArrowLeftRight, Pencil, ChevronDown as ChevronDownIcon,
  Sparkles, SquareDashedBottom, SquareDashedBottomCode,
} from 'lucide-react';

// ─── Block Types ───
export type BlockType =
  | 'text' | 'image' | 'video' | 'audio'
  | 'divider' | 'page_break' | 'split_screen'
  | 'group_start' | 'group_end'
  | 'table_of_content' | 'read_listen' | 'memorization' | 'revision' | 'homework'
  | 'exercise_listen_choose' | 'exercise_text_match' | 'exercise_choose_correct'
  | 'exercise_choose_multiple' | 'exercise_rearrange' | 'exercise_missing_text' | 'exercise_true_false'
  | 'quran_quote' | 'quran_symbol' | 'surah_nameplate' | 'surah_name' | 'besmellah';

export interface ContentBlock {
  id: string;
  type: BlockType;
  // custom name override (per-block rename)
  custom_name?: string;
  // text / rich content blocks
  html?: string;
  // image
  image_url?: string;
  image_caption?: string;
  image_alt?: string;
  image_fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
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
  correct_answer?: boolean;
  items?: { text: string; text_ar?: string }[];
  sentence?: string;
  sentence_ar?: string;
  missing_word?: string;
  missing_word_ar?: string;
  pairs?: { left: string; left_ar?: string; right: string; right_ar?: string }[];
  // table of content
  toc_header_en?: string;
  toc_header_ar?: string;
  toc_style?: 'default' | 'striped' | 'bordered' | 'minimal';
  toc_size?: 'sm' | 'md' | 'lg' | 'xl';
  toc_rows?: { en: string; ar: string }[];
  // divider
  divider_width?: number;
  divider_style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge';
  divider_thickness?: number;
  divider_color?: string;
  divider_text?: string;
  divider_opacity?: number; // 15, 20, 25, 30
  page_label?: string;
  page_label_ar?: string;
  // split screen
  split_left_html?: string;
  split_right_html?: string;
  split_active_side?: 'left' | 'right';
  // split screen sub-block side assignment
  split_side?: 'left' | 'right';
  // Quran elements
  quran_text?: string;
  quran_surah_number?: number;
  quran_surah_name?: string;
  quran_surah_name_en?: string;
  quran_ayah_from?: number;
  quran_ayah_to?: number;
  quran_reference?: string; // e.g. "2:255" or "2:255-260"
  selected_symbol?: string;
  symbol_font?: string;
  surah_name_mode?: 'name_only' | 'surat_name';
  font_size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge' | number;
  quran_font_size?: number; // px, 12–100
}
const generateId = () => Math.random().toString(36).substring(2, 10);

interface BlockMetaItem {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  color: string;
  group: 'media' | 'content' | 'exercise' | 'layout' | 'quran';
}

const blockMeta: Record<BlockType, BlockMetaItem> = {
  // Media
  text:  { icon: Type, label: 'Text', labelAr: 'نص', color: 'text-blue-500', group: 'media' },
  image: { icon: Image, label: 'Image', labelAr: 'صورة', color: 'text-green-500', group: 'media' },
  video: { icon: Video, label: 'Video', labelAr: 'فيديو', color: 'text-red-500', group: 'media' },
  audio: { icon: Music, label: 'Audio', labelAr: 'صوت', color: 'text-amber-500', group: 'media' },
  // Layout
  divider: { icon: Minus, label: 'Divider', labelAr: 'فاصل', color: 'text-gray-400', group: 'layout' },
  page_break: { icon: FileStack, label: 'New Page', labelAr: 'صفحة جديدة', color: 'text-yellow-500', group: 'layout' },
  split_screen: { icon: Columns, label: 'Split Page', labelAr: 'صفحة مقسمة', color: 'text-cyan-600', group: 'layout' },
  table_of_content: { icon: ListOrdered, label: 'Table of Content', labelAr: 'فهرس المحتويات', color: 'text-indigo-500', group: 'layout' },
  group_start: { icon: SquareDashedBottom, label: 'Box Start', labelAr: 'بداية إطار', color: 'text-violet-500', group: 'layout' },
  group_end: { icon: SquareDashedBottomCode, label: 'Box End', labelAr: 'نهاية إطار', color: 'text-violet-400', group: 'layout' },
  // Content Types
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
  // Quran
  quran_quote:              { icon: BookOpen, label: 'Quran Quote', labelAr: 'اقتباس قرآني', color: 'text-emerald-600', group: 'quran' },
  quran_symbol:             { icon: Sparkles, label: 'Quran Symbol', labelAr: 'رمز قرآني', color: 'text-amber-600', group: 'quran' },
  surah_nameplate:          { icon: FileStack, label: 'Surah Nameplate', labelAr: 'لوحة اسم السورة', color: 'text-teal-600', group: 'quran' },
  surah_name:               { icon: Type, label: 'Surah Name', labelAr: 'اسم السورة', color: 'text-cyan-600', group: 'quran' },
  besmellah:                { icon: BookOpen, label: 'Besmellah', labelAr: 'بسملة', color: 'text-green-600', group: 'quran' },
};

// Reordered: Layout → Quran → Content → Media → Exercises
const blockGroups: { key: string; label: string; labelAr: string; types: BlockType[] }[] = [
  { key: 'layout', label: '🧩 Layout', labelAr: '🧩 التخطيط', types: ['table_of_content', 'divider', 'page_break', 'split_screen', 'group_start', 'group_end'] },
  { key: 'quran', label: '📿 Quran', labelAr: '📿 القرآن', types: ['quran_quote', 'quran_symbol', 'surah_nameplate', 'surah_name', 'besmellah'] },
  { key: 'content', label: '📖 Content', labelAr: '📖 المحتوى', types: ['read_listen', 'memorization', 'revision', 'homework'] },
  { key: 'media', label: '📁 Media', labelAr: '📁 الوسائط', types: ['text', 'image', 'video', 'audio'] },
  { key: 'exercise', label: '✏️ Exercises', labelAr: '✏️ التمارين', types: ['exercise_listen_choose', 'exercise_text_match', 'exercise_choose_correct', 'exercise_choose_multiple', 'exercise_rearrange', 'exercise_missing_text', 'exercise_true_false'] },
];

// BETA types (all except: page_break, split_screen, text, video, image, divider, table_of_content, quran types)
const nonBetaTypes: BlockType[] = ['page_break', 'split_screen', 'text', 'video', 'image', 'divider', 'table_of_content', 'group_start', 'group_end', 'quran_quote', 'quran_symbol', 'surah_nameplate', 'surah_name', 'besmellah'];

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
  block, isAr, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, pageNumber, isBeta, onTransfer, animating,
}: {
  block: ContentBlock;
  isAr: boolean;
  onChange: (updated: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  pageNumber?: number;
  isBeta?: boolean;
  onTransfer?: (toSide: 'left' | 'right') => void;
  animating?: 'up' | 'down' | 'transfer-out' | 'transfer-in' | null;
}) => {
  const meta = blockMeta[block.type];
  const Icon = meta.icon;
  const [collapsed, setCollapsed] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  const blockHasContent = () => {
    const b = block;
    if (b.html && b.html.replace(/<[^>]*>/g, '').trim()) return true;
    if (b.image_url || b.video_url || b.video_embed || b.audio_url) return true;
    if (b.question || b.question_ar) return true;
    if (b.options && b.options.length > 0) return true;
    if (b.pairs && b.pairs.length > 0) return true;
    if (b.items && b.items.length > 0) return true;
    if (b.sentence || b.missing_word) return true;
    if (b.toc_rows && b.toc_rows.length > 0) return true;
    if (b.split_left_html || b.split_right_html) return true;
    if (b.divider_text) return true;
    if (b.quran_text || b.selected_symbol) return true;
    return false;
  };

  const handleDelete = () => {
    if (blockHasContent()) {
      setConfirmDelete(true);
    } else {
      onRemove();
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const animationClass = animating === 'up'
    ? 'animate-slide-up'
    : animating === 'down'
      ? 'animate-slide-down'
      : animating === 'transfer-out'
        ? 'animate-transfer-out'
        : animating === 'transfer-in'
          ? 'animate-transfer-in'
          : '';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = block.custom_name || (isAr ? meta.labelAr : meta.label);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(block.custom_name || '');
    setIsRenaming(true);
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    onChange({ ...block, custom_name: trimmed || undefined });
    setIsRenaming(false);
  };

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
    <div ref={setNodeRef} style={style} className={cn("rounded-lg border bg-card group relative", animationClass)}>
      <div
        className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />

        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false); }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium bg-background border rounded px-1.5 py-0.5 w-32 outline-none focus:ring-1 focus:ring-primary"
            placeholder={isAr ? meta.labelAr : meta.label}
          />
        ) : (
          <span
            className="text-xs font-medium text-muted-foreground cursor-text"
            onDoubleClick={handleDoubleClick}
            title={isAr ? 'انقر مزدوج لإعادة التسمية' : 'Double-click to rename'}
          >
            {displayName}
            {block.type === 'page_break' && pageNumber != null && (
              <span className="ms-1.5 text-[11px] font-semibold text-foreground/60">#{pageNumber}</span>
            )}
          </span>
        )}

        {block.custom_name && (
          <Pencil className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
        )}

        {isBeta && (
          <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-600 border-amber-400/40 font-bold uppercase tracking-wider">
            Beta
          </Badge>
        )}
        <div className="ms-auto flex items-center gap-0.5">
          {onTransfer && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                    e.stopPropagation();
                    onTransfer(block.split_side === 'left' ? 'right' : 'left');
                  }}>
                    <ArrowLeftRight className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isAr
                    ? `نقل إلى ${block.split_side === 'left' ? 'اليمين' : 'اليسار'}`
                    : `Move to ${block.split_side === 'left' ? 'Right' : 'Left'}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}>
            <ChevronsUpDown className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {confirmDelete && (
        <div className="px-3 py-2.5 border-b bg-destructive/5 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-3 w-3 text-destructive" />
            </div>
            <p className="text-xs font-medium text-destructive">
              {isAr ? 'هذا العنصر يحتوي على محتوى. هل أنت متأكد من الحذف؟' : 'This element has content. Are you sure you want to delete it?'}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-3" onClick={() => setConfirmDelete(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" size="sm" className="h-7 text-xs px-3 gap-1" onClick={onRemove}>
              <Trash2 className="h-3 w-3" />
              {isAr ? 'حذف' : 'Delete'}
            </Button>
          </div>
        </div>
      )}

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
                <img src={block.image_url} alt={block.image_alt || ''} className={cn("max-h-48 mx-auto w-full", `object-${block.image_fit || 'contain'}`)} />
              </div>
            )}
            <div>
              <Label className="text-xs mb-1.5 block">{isAr ? 'ملاءمة الصورة' : 'Image Fit'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'contain' as const, label: 'Contain' },
                  { value: 'cover' as const, label: 'Cover' },
                  { value: 'fill' as const, label: 'Fill' },
                  { value: 'none' as const, label: 'None' },
                  { value: 'scale-down' as const, label: 'Scale Down' },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => onChange({ ...block, image_fit: opt.value })}
                    className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
                      (block.image_fit || 'contain') === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}>{opt.label}</button>
                ))}
              </div>
            </div>
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

        {/* ── Divider ── */}
        {block.type === 'divider' && (() => {
          const op = (block.divider_opacity || 15) / 100;
          const colorMapFn = (opacity: number): Record<string, string> => ({
            border: `hsl(var(--border) / ${opacity})`,
            primary: `hsl(var(--primary) / ${opacity})`,
            muted: `hsl(var(--muted-foreground) / ${opacity})`,
            destructive: `hsl(var(--destructive) / ${opacity})`,
            gold: `hsl(var(--gold, 45 80% 50%) / ${opacity})`,
          });
          const cm = colorMapFn(op);
          const borderColor = cm[block.divider_color || 'border'] || cm.border;

          const chipBtn = (active: boolean) => cn(
            "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
            active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          );

          return (
            <div className="space-y-4">
              {/* Live Preview */}
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg border border-dashed bg-muted/10" style={{ width: `${block.divider_width || 100}%`, margin: '0 auto' }}>
                <hr className="flex-1" style={{ borderStyle: block.divider_style || 'solid', borderWidth: `${block.divider_thickness || 1}px 0 0 0`, borderColor }} />
                {block.divider_text && (
                  <span className="shrink-0 text-muted-foreground whitespace-nowrap text-xs">{block.divider_text}</span>
                )}
                {block.divider_text && (
                  <hr className="flex-1" style={{ borderStyle: block.divider_style || 'solid', borderWidth: `${block.divider_thickness || 1}px 0 0 0`, borderColor }} />
                )}
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Style */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'النمط' : 'Style'}</Label>
                  <div className="flex flex-wrap gap-1">
                    {(['solid', 'dashed', 'dotted', 'double'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => onChange({ ...block, divider_style: s })}
                        className={chipBtn((block.divider_style || 'solid') === s)}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'العرض' : 'Width'}</Label>
                  <div className="flex flex-wrap gap-1">
                    {[25, 50, 75, 100].map((w) => (
                      <button key={w} type="button" onClick={() => onChange({ ...block, divider_width: w })}
                        className={chipBtn((block.divider_width || 100) === w)}>{w}%</button>
                    ))}
                  </div>
                </div>

                {/* Thickness */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'السُمك' : 'Thickness'}</Label>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4].map((t) => (
                      <button key={t} type="button" onClick={() => onChange({ ...block, divider_thickness: t })}
                        className={chipBtn((block.divider_thickness || 1) === t)}>{t}px</button>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'الشفافية' : 'Opacity'}</Label>
                  <div className="flex flex-wrap gap-1">
                    {[15, 20, 25, 30].map((o) => (
                      <button key={o} type="button" onClick={() => onChange({ ...block, divider_opacity: o })}
                        className={chipBtn((block.divider_opacity || 15) === o)}>{o}%</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'اللون' : 'Color'}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { value: 'border', label: isAr ? 'افتراضي' : 'Default', css: 'hsl(var(--border))' },
                    { value: 'primary', label: isAr ? 'رئيسي' : 'Primary', css: 'hsl(var(--primary))' },
                    { value: 'muted', label: isAr ? 'باهت' : 'Muted', css: 'hsl(var(--muted-foreground))' },
                    { value: 'destructive', label: isAr ? 'أحمر' : 'Red', css: 'hsl(var(--destructive))' },
                    { value: 'gold', label: isAr ? 'ذهبي' : 'Gold', css: 'hsl(45 80% 50%)' },
                  ] as const).map((c) => (
                    <button key={c.value} type="button" onClick={() => onChange({ ...block, divider_color: c.value })}
                      className={cn("flex items-center gap-1.5", chipBtn((block.divider_color || 'border') === c.value))}>
                      <span className="h-2.5 w-2.5 rounded-full shrink-0 border" style={{ background: c.css }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider Text */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAr ? 'نص الفاصل' : 'Divider Text'}</Label>
                <Input
                  placeholder={isAr ? 'اختياري — مثال: القسم الأول' : 'Optional — e.g. Section One'}
                  value={block.divider_text || ''}
                  onChange={(e) => onChange({ ...block, divider_text: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          );
        })()}

        {/* ── Page Break ── */}
        {block.type === 'page_break' && (
          <div className="flex items-center justify-center gap-2 py-2 border rounded-lg bg-muted/20 border-dashed">
            <FileStack className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">{isAr ? 'فاصل صفحة — المحتوى التالي يظهر في صفحة جديدة' : 'Page Break — Content below appears on a new page'}</span>
          </div>
        )}

        {/* ── Group Start ── */}
        {block.type === 'group_start' && (
          <div className="flex items-center justify-center gap-2 py-2 border rounded-lg bg-violet-500/5 border-dashed border-violet-500/30">
            <SquareDashedBottom className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">{isAr ? 'بداية إطار — العناصر التالية ستظهر داخل إطار مشترك' : 'Box Start — Elements below will appear inside a shared border'}</span>
          </div>
        )}

        {/* ── Group End ── */}
        {block.type === 'group_end' && (
          <div className="flex items-center justify-center gap-2 py-2 border rounded-lg bg-violet-500/5 border-dashed border-violet-500/30">
            <SquareDashedBottomCode className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-muted-foreground">{isAr ? 'نهاية إطار — ينتهي هنا الإطار المشترك' : 'Box End — Ends the shared border here'}</span>
          </div>
        )}

        {/* ── Split Screen ── */}
        {block.type === 'split_screen' && (() => {
          const activeSide = block.split_active_side || 'left';
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">{isAr ? 'تعديل الجانب' : 'Edit Side'}</Label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => onChange({ ...block, split_active_side: 'left' })}
                    className={cn("px-3 py-1 rounded-md text-xs font-medium border transition-colors",
                      activeSide === 'left' ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}>{isAr ? 'يسار' : 'Left'}</button>
                  <button type="button" onClick={() => onChange({ ...block, split_active_side: 'right' })}
                    className={cn("px-3 py-1 rounded-md text-xs font-medium border transition-colors",
                      activeSide === 'right' ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}>{isAr ? 'يمين' : 'Right'}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-0.5 rounded-lg border overflow-hidden bg-border">
                <div className={cn("bg-card p-1 transition-opacity", activeSide !== 'left' && "opacity-40")}>
                  <div className="text-[10px] font-medium text-center text-muted-foreground mb-1">{isAr ? 'يسار' : 'Left'}</div>
                  {activeSide === 'left' ? (
                    <ContentEditor
                      value={block.split_left_html || ''}
                      onChange={(val) => onChange({ ...block, split_left_html: val })}
                      placeholder={isAr ? 'محتوى الجانب الأيسر...' : 'Left side content...'}
                      minHeight="120px"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none p-2 min-h-[120px] text-xs">
                      {block.split_left_html ? <div dangerouslySetInnerHTML={{ __html: block.split_left_html }} /> : <p className="text-muted-foreground italic text-[10px]">{isAr ? 'فارغ' : 'Empty'}</p>}
                    </div>
                  )}
                </div>
                <div className={cn("bg-card p-1 transition-opacity", activeSide !== 'right' && "opacity-40")}>
                  <div className="text-[10px] font-medium text-center text-muted-foreground mb-1">{isAr ? 'يمين' : 'Right'}</div>
                  {activeSide === 'right' ? (
                    <ContentEditor
                      value={block.split_right_html || ''}
                      onChange={(val) => onChange({ ...block, split_right_html: val })}
                      placeholder={isAr ? 'محتوى الجانب الأيمن...' : 'Right side content...'}
                      minHeight="120px"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none p-2 min-h-[120px] text-xs">
                      {block.split_right_html ? <div dangerouslySetInnerHTML={{ __html: block.split_right_html }} /> : <p className="text-muted-foreground italic text-[10px]">{isAr ? 'فارغ' : 'Empty'}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Table of Content ── */}
        {block.type === 'table_of_content' && (() => {
          const rows = block.toc_rows || [];
          const addRow = () => onChange({ ...block, toc_rows: [...rows, { en: '', ar: '' }] });
          const removeRow = (idx: number) => { const next = [...rows]; next.splice(idx, 1); onChange({ ...block, toc_rows: next }); };
          const updateRow = (idx: number, field: 'en' | 'ar', value: string) => { const next = [...rows]; next[idx] = { ...next[idx], [field]: value }; onChange({ ...block, toc_rows: next }); };
          const moveRow = (from: number, to: number) => { const next = arrayMove(rows, from, to); onChange({ ...block, toc_rows: next }); };

          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">{isAr ? 'نمط الجدول' : 'Table Style'}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: 'default' as const, label: isAr ? 'افتراضي' : 'Default' },
                      { value: 'striped' as const, label: isAr ? 'مخطط' : 'Striped' },
                      { value: 'bordered' as const, label: isAr ? 'محدد' : 'Bordered' },
                      { value: 'minimal' as const, label: isAr ? 'بسيط' : 'Minimal' },
                    ] as const).map((opt) => (
                      <button key={opt.value} type="button" onClick={() => onChange({ ...block, toc_style: opt.value })}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
                          (block.toc_style || 'default') === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">{isAr ? 'حجم الخط' : 'Font Size'}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: 'sm' as const, label: isAr ? 'صغير' : 'Small' },
                      { value: 'md' as const, label: isAr ? 'متوسط' : 'Medium' },
                      { value: 'lg' as const, label: isAr ? 'كبير' : 'Large' },
                      { value: 'xl' as const, label: isAr ? 'كبير جدًا' : 'X-Large' },
                    ] as const).map((opt) => (
                      <button key={opt.value} type="button" onClick={() => onChange({ ...block, toc_size: opt.value })}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors",
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

        {/* ── Quran Quote ── */}
        {block.type === 'quran_quote' && (
          <QuranQuoteEditor block={block} isAr={isAr} onChange={onChange} />
        )}

        {/* ── Quran Symbol ── */}
        {block.type === 'quran_symbol' && (() => {
          const quranSymbolsFont = [
            { char: '\u06DD', label: isAr ? 'نهاية الآية' : 'End of Ayah' },
            { char: '\u06DE', label: isAr ? 'ربع الحزب' : 'Start of Rub El Hizb' },
            { char: '\u06E9', label: isAr ? 'موضع السجدة' : 'Place of Sajdah' },
            { char: '\uFDFD', label: isAr ? 'بسم الله' : 'Bismillah' },
            { char: '\uFDFA', label: isAr ? 'صلى الله عليه وسلم' : 'SAWS' },
            { char: '\uFDFB', label: isAr ? 'جل جلاله' : 'Jalla Jalaluhu' },
            { char: '\u06D6', label: isAr ? 'صلى' : 'Small High Sad' },
            { char: '\u06D7', label: isAr ? 'قلى' : 'Small High Qaf' },
            { char: '\u06D8', label: isAr ? 'ميم' : 'Small Meem' },
            { char: '\u06D9', label: isAr ? 'لا' : 'Small Lam Alef' },
            { char: '\u06DA', label: isAr ? 'جيم' : 'Small Jeem' },
            { char: '\u06DC', label: isAr ? 'سين' : 'Small Seen' },
          ];
          const indopakSymbols = [
            { char: '\u0610', label: isAr ? 'صلى الله عليه' : 'Sallallahu Alayhi' },
            { char: '\u0611', label: isAr ? 'عليه السلام' : 'Alayhi Assalam' },
            { char: '\u0612', label: isAr ? 'رحمه الله' : 'Rahimahu Allah' },
            { char: '\u0613', label: isAr ? 'رضي الله عنه' : 'Radi Allahu Anhu' },
            { char: '\u0614', label: isAr ? 'تعالى' : 'Taala' },
            { char: '\u0615', label: isAr ? 'وقف' : 'Small High Tah' },
            { char: '\u0670', label: isAr ? 'ألف خنجرية' : 'Superscript Alef' },
            { char: '\u065C', label: isAr ? 'نقطة تحت' : 'Vowel Below' },
            { char: '\u06DB', label: isAr ? 'ثلاث نقاط' : 'Three Dots' },
          ];
          return (
            <div className="space-y-4">
              <Label className="text-xs font-medium">{isAr ? 'اختر رمزًا' : 'Select a symbol'}</Label>
              {/* Quran Symbols font */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Quran Symbols</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {quranSymbolsFont.map((s, i) => (
                    <button key={i} type="button"
                      onClick={() => onChange({ ...block, selected_symbol: s.char, symbol_font: 'Quran Symbols' })}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center",
                        block.selected_symbol === s.char && block.symbol_font === 'Quran Symbols'
                          ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
                      )}>
                      <span className="text-xl leading-none" style={{ fontFamily: "'Quran Symbols', serif" }}>{s.char}</span>
                      <span className="text-[8px] text-muted-foreground line-clamp-1">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Indopak Nastaleeq font */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Indopak Nastaleeq</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {indopakSymbols.map((s, i) => (
                    <button key={i} type="button"
                      onClick={() => onChange({ ...block, selected_symbol: s.char, symbol_font: 'Indopak Nastaleeq' })}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center",
                        block.selected_symbol === s.char && block.symbol_font === 'Indopak Nastaleeq'
                          ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
                      )}>
                      <span className="text-xl leading-none" style={{ fontFamily: "'Indopak Nastaleeq', serif" }}>{s.char}</span>
                      <span className="text-[8px] text-muted-foreground line-clamp-1">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {block.selected_symbol && (
                <div className="p-4 rounded-lg border bg-muted/10 text-center">
                  <span className="text-4xl" style={{ fontFamily: `'${block.symbol_font || 'Quran Symbols'}', serif` }}>{block.selected_symbol}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Surah Nameplate ── */}
        {block.type === 'surah_nameplate' && (() => {
          // Surah Header font uses 3-digit Arabic numeral ligatures (٠٠١ = Surah 1)
          const toArabicDigits = (n: number) => {
            const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
            return String(n).padStart(3, '0').split('').map(d => arabicDigits[parseInt(d)]).join('');
          };
          const surahHeaderChars = Array.from({ length: 114 }, (_, i) => ({
            char: toArabicDigits(i + 1),
            label: `${isAr ? 'سورة' : 'Surah'} ${i + 1}`,
          }));
          return (
            <div className="space-y-3">
              <Label className="text-xs font-medium">{isAr ? 'اختر لوحة السورة' : 'Select Surah Nameplate'}</Label>
              <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto">
                {surahHeaderChars.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => onChange({ ...block, selected_symbol: s.char, symbol_font: 'Surah Header' })}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      block.selected_symbol === s.char ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
                    )}>
                    <span className="text-3xl leading-none" style={{ fontFamily: "'Surah Header', serif" }}>{s.char}</span>
                    <span className="text-[8px] text-muted-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
              {block.selected_symbol && (
                <div className="p-4 rounded-lg border bg-muted/10 text-center">
                  <span className="text-5xl" style={{ fontFamily: "'Surah Header', serif" }}>{block.selected_symbol}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Surah Name ── */}
        {block.type === 'surah_name' && (() => {
          const surahNameChars = Array.from({ length: 114 }, (_, i) => ({
            char: String.fromCodePoint(0xE000 + i),
            label: `${isAr ? 'سورة' : 'Surah'} ${i + 1}`,
          }));
          const nameMode = block.surah_name_mode || 'name_only';
          const currentFont = nameMode === 'surat_name' ? 'Surah Name Color V4' : 'Surah Name V4';
          const currentSizePx = typeof block.font_size === 'number' ? block.font_size : ({ sm: 24, md: 32, lg: 40, xl: 52, huge: 72 }[block.font_size || 'lg'] || 40);
          return (
            <div className="space-y-3">
              {/* Mode & Size Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">{isAr ? 'الوضع' : 'Mode'}</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button type="button"
                      onClick={() => onChange({ ...block, surah_name_mode: 'name_only', symbol_font: 'Surah Name V4' })}
                      className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                        nameMode === 'name_only' ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      )}>
                      {isAr ? 'اسم فقط' : 'Name Only'}
                    </button>
                    <button type="button"
                      onClick={() => onChange({ ...block, surah_name_mode: 'surat_name', symbol_font: 'Surah Name Color V4' })}
                      className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                        nameMode === 'surat_name' ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      )}>
                      {isAr ? 'سورة + اسم' : 'Surat-Name'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">{isAr ? 'الحجم' : 'Size'}</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {sizeOptions.map((s) => (
                      <button key={s.value} type="button" title={s.title}
                        onClick={() => onChange({ ...block, font_size: s.value })}
                        className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors",
                          currentSize === s.value ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted"
                        )}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Label className="text-xs font-medium">{isAr ? 'اختر اسم السورة' : 'Select Surah Name'}</Label>
              <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto">
                {surahNameChars.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => onChange({ ...block, selected_symbol: s.char, symbol_font: currentFont, surah_name_mode: nameMode })}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      block.selected_symbol === s.char ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
                    )}>
                    <span className={cn(sizeMap[currentSize], "leading-none")} style={{ fontFamily: `'${currentFont}', serif` }}>{s.char}</span>
                    <span className="text-[8px] text-muted-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
              {block.selected_symbol && (
                <div className="p-4 rounded-lg border bg-muted/10 text-center">
                  <span className={previewSizeMap[currentSize]} style={{ fontFamily: `'${currentFont}', serif` }}>{block.selected_symbol}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Besmellah ── */}
        {block.type === 'besmellah' && (() => {
          // The Besmellah font maps different calligraphy styles to characters
          const besmellahStyles = Array.from({ length: 110 }, (_, i) => {
            // Map to printable ASCII characters starting from '!' (33)
            const code = 33 + i;
            return { char: String.fromCharCode(code), label: `${isAr ? 'نمط' : 'Style'} ${i + 1}` };
          });
          const sizeOptions = [
            { value: 'sm' as const, label: 'S', title: isAr ? 'صغير' : 'Small' },
            { value: 'md' as const, label: 'M', title: isAr ? 'متوسط' : 'Medium' },
            { value: 'lg' as const, label: 'L', title: isAr ? 'كبير' : 'Large' },
            { value: 'xl' as const, label: 'XL', title: isAr ? 'كبير جداً' : 'Very Large' },
            { value: 'huge' as const, label: 'H', title: isAr ? 'ضخم' : 'Huge' },
          ];
          const currentSize = block.font_size || 'lg';
          const sizeMap = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl', xl: 'text-5xl', huge: 'text-7xl' };
          const previewSizeMap = { sm: 'text-3xl', md: 'text-4xl', lg: 'text-5xl', xl: 'text-6xl', huge: 'text-8xl' };
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">{isAr ? 'الحجم' : 'Size'}</Label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {sizeOptions.map((s) => (
                    <button key={s.value} type="button" title={s.title}
                      onClick={() => onChange({ ...block, font_size: s.value })}
                      className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors",
                        currentSize === s.value ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      )}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <Label className="text-xs font-medium">{isAr ? 'اختر نمط البسملة' : 'Select Besmellah Style'}</Label>
              <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto">
                {besmellahStyles.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => onChange({ ...block, selected_symbol: s.char, symbol_font: 'Besmellah' })}
                    className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                      block.selected_symbol === s.char ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
                    )}>
                    <span className={cn(sizeMap[currentSize], "leading-none")} style={{ fontFamily: "'Besmellah', serif" }}>{s.char}</span>
                    <span className="text-[8px] text-muted-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
              {block.selected_symbol && (
                <div className="p-4 rounded-lg border bg-muted/10 text-center">
                  <span className={previewSizeMap[currentSize]} style={{ fontFamily: "'Besmellah', serif" }}>{block.selected_symbol}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      </div>
      </div>
    </div>
  );
};

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
  const [animatingBlocks, setAnimatingBlocks] = useState<Record<string, 'up' | 'down' | 'transfer-out' | 'transfer-in'>>({});
  const [splitDeleteOpen, setSplitDeleteOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const savedSnapshot = useRef<string>('');

  const lessonFingerprint = lesson ? `${lesson.id}:${JSON.stringify(lesson.content?.blocks?.length ?? 0)}` : null;

  if (lesson && initialized.current !== lessonFingerprint) {
    initialized.current = lessonFingerprint;
    const content = lesson.content || {};
    let initialBlocks: ContentBlock[] = [];
    if (Array.isArray(content.blocks) && content.blocks.length > 0) {
      initialBlocks = content.blocks.map((b: any) => ({ ...b, id: b.id || generateId() }));
    } else {
      if (content.text || content.body || content.html || content.description) {
        initialBlocks.push({ id: generateId(), type: 'text', html: content.text || content.body || content.html || content.description || '' });
      }
      if (content.video_url || content.videoUrl) {
        initialBlocks.push({ id: generateId(), type: 'video', video_url: content.video_url || content.videoUrl || '' });
      }
      if (content.audio_url || content.audioUrl) {
        initialBlocks.push({ id: generateId(), type: 'audio', audio_url: content.audio_url || content.audioUrl || '' });
      }
      if (content.image_url || content.imageUrl) {
        initialBlocks.push({ id: generateId(), type: 'image', image_url: content.image_url || content.imageUrl || '' });
      }
    }
    setBlocks(initialBlocks);
    savedSnapshot.current = JSON.stringify(initialBlocks);
  }

  const hasUnsavedChanges = useMemo(() => {
    if (!savedSnapshot.current) return false;
    return JSON.stringify(blocks) !== savedSnapshot.current;
  }, [blocks]);

  const handleOpenChange = (v: boolean) => {
    if (!v && hasUnsavedChanges) {
      setUnsavedDialogOpen(true);
      return;
    }
    if (!v) { initialized.current = null; setBlocks([]); savedSnapshot.current = ''; }
    onOpenChange(v);
  };

  const forceClose = () => {
    setUnsavedDialogOpen(false);
    initialized.current = null;
    setBlocks([]);
    savedSnapshot.current = '';
    onOpenChange(false);
  };

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const hasSplitScreen = useMemo(() => blocks.some(b => b.type === 'split_screen'), [blocks]);
  const hasNonSplitBlocks = useMemo(() => blocks.some(b => b.type !== 'split_screen'), [blocks]);
  const [activeSplitSide, setActiveSplitSide] = useState<'left' | 'right'>('left');

  const triggerAnimation = (blockId: string, type: 'up' | 'down' | 'transfer-out' | 'transfer-in') => {
    setAnimatingBlocks(prev => ({ ...prev, [blockId]: type }));
    setTimeout(() => {
      setAnimatingBlocks(prev => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
    }, 400);
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

    if (type !== 'split_screen') {
      setBlocks(prev => {
        const splitExists = prev.some(b => b.type === 'split_screen');
        if (splitExists) {
          newBlock.split_side = activeSplitSide;
        }
        // Always add at bottom
        return [...prev, newBlock];
      });
    } else {
      setBlocks(prev => [...prev, newBlock]);
    }
  }, [activeSplitSide]);

  const transferBlock = useCallback((blockId: string, toSide: 'left' | 'right') => {
    // Animate out
    triggerAnimation(blockId, 'transfer-out');
    setTimeout(() => {
      setBlocks(prev => {
        // Move to top of the target side: place it right after the split_screen block or at start
        const block = prev.find(b => b.id === blockId);
        if (!block) return prev;
        const updated = { ...block, split_side: toSide };
        const without = prev.filter(b => b.id !== blockId);
        // Find target side blocks and insert at top (first position among target side blocks)
        const targetSideFirstIdx = without.findIndex(b => b.split_side === toSide);
        if (targetSideFirstIdx === -1) {
          // No blocks on that side, just append
          return [...without, updated];
        }
        const result = [...without];
        result.splice(targetSideFirstIdx, 0, updated);
        return result;
      });
      triggerAnimation(blockId, 'transfer-in');
    }, 300);
  }, []);

  const updateBlock = useCallback((id: string, updated: ContentBlock) => {
    setBlocks(prev => prev.map(b => b.id === id ? updated : b));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const hasSplit = prev.some(b => b.type === 'split_screen');
      if (hasSplit) {
        // Move within same side only
        const block = prev.find(b => b.id === id);
        if (!block || !block.split_side) return prev;
        const side = block.split_side;
        const sideBlocks = prev.filter(b => b.split_side === side);
        const sideIdx = sideBlocks.findIndex(b => b.id === id);
        const newSideIdx = direction === 'up' ? sideIdx - 1 : sideIdx + 1;
        if (newSideIdx < 0 || newSideIdx >= sideBlocks.length) return prev;
        // Find global indices
        const globalIdx = prev.indexOf(sideBlocks[sideIdx]);
        const globalNewIdx = prev.indexOf(sideBlocks[newSideIdx]);
        const arr = [...prev];
        [arr[globalIdx], arr[globalNewIdx]] = [arr[globalNewIdx], arr[globalIdx]];
        triggerAnimation(id, direction === 'up' ? 'up' : 'down');
        return arr;
      }
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      triggerAnimation(id, direction === 'up' ? 'up' : 'down');
      return arr;
    });
  }, []);

  const handleDeleteSplitPage = useCallback((deleteAll: boolean) => {
    setBlocks(prev => {
      if (deleteAll) {
        // Remove split_screen and all sub-blocks
        return prev.filter(b => b.type !== 'split_screen' && !b.split_side);
      } else {
        // Remove split_screen, keep sub-blocks but remove split_side
        return prev.filter(b => b.type !== 'split_screen').map(b => {
          const { split_side, ...rest } = b;
          return rest;
        });
      }
    });
    setSplitDeleteOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      const newContent = { blocks: blocks as any[] };
      const { error } = await supabase.from('lessons').update({ content: newContent as any }).eq('id', lesson.id);
      if (error) throw error;
      savedSnapshot.current = JSON.stringify(blocks);
      toast.success(isAr ? 'تم حفظ المحتوى' : 'Content saved');
      onSaved();
      // Close after save
      initialized.current = null;
      setBlocks([]);
      savedSnapshot.current = '';
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, [lesson, blocks, isAr, onSaved]);

  if (!lesson) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileEdit className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground block">{isAr ? 'محرر الدرس' : 'Lesson Builder'}</span>
              <span className="text-base font-bold text-foreground truncate block">
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
              ) : hasSplitScreen ? (
                /* ── Split Page Layout: two-column view ── */
                (() => {
                  const leftBlocks = blocks.filter(b => b.split_side === 'left');
                  const rightBlocks = blocks.filter(b => b.split_side === 'right');

                  const renderSideBlocks = (sideBlocks: ContentBlock[], side: 'left' | 'right') => (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={activeSplitSide === side ? 'default' : 'outline'} className="text-[10px]">
                          {side === 'left' ? (isAr ? 'يسار' : 'Left') : (isAr ? 'يمين' : 'Right')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {sideBlocks.length} {isAr ? 'عنصر' : sideBlocks.length === 1 ? 'block' : 'blocks'}
                        </span>
                      </div>
                      {sideBlocks.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg">
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? 'أضف عنصرًا من اللوحة' : 'Add an element from the palette'}
                          </p>
                        </div>
                      ) : (
                        sideBlocks.map((block, idx) => (
                          <BlockEditor
                            key={block.id}
                            block={block}
                            isAr={isAr}
                            onChange={(updated) => updateBlock(block.id, updated)}
                            onRemove={() => removeBlock(block.id)}
                            onMoveUp={() => moveBlock(block.id, 'up')}
                            onMoveDown={() => moveBlock(block.id, 'down')}
                            isFirst={idx === 0}
                            isLast={idx === sideBlocks.length - 1}
                            isBeta={!nonBetaTypes.includes(block.type)}
                            onTransfer={(toSide) => transferBlock(block.id, toSide)}
                            animating={animatingBlocks[block.id] || null}
                          />
                        ))
                      )}
                    </div>
                  );

                  return (
                    <div className="space-y-3">
                      {/* Split page header */}
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border">
                        <Columns className="h-4 w-4 text-cyan-600" />
                        <span className="text-xs font-medium">{isAr ? 'وضع الصفحة المقسمة' : 'Split Page Mode'}</span>
                        <Lock className="h-3 w-3 text-muted-foreground/50 ms-1" />
                        {/* Active side selector */}
                        <div className="ms-auto flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{isAr ? 'إضافة إلى:' : 'Add to:'}</span>
                          <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={() => setActiveSplitSide('left')}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                                activeSplitSide === 'left'
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {isAr ? 'يسار' : 'Left'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSplitSide('right')}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                                activeSplitSide === 'right'
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {isAr ? 'يمين' : 'Right'}
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive/60 hover:text-destructive"
                            onClick={() => {
                              const hasSubBlocks = blocks.some(b => b.split_side);
                              if (!hasSubBlocks) {
                                handleDeleteSplitPage(true);
                              } else {
                                setSplitDeleteOpen(true);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Two columns */}
                      <div className="grid grid-cols-2 gap-3">
                        {renderSideBlocks(leftBlocks, 'left')}
                        {renderSideBlocks(rightBlocks, 'right')}
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  let pageCounter = 1;
                  const pageNumbers = new Map<string, number>();
                  blocks.forEach(b => {
                    if (b.type === 'page_break') {
                      pageCounter++;
                      pageNumbers.set(b.id, pageCounter);
                    }
                  });

                  return (
                    <SortableList
                      items={blocks}
                      onReorder={(activeId, overId) => {
                        setBlocks(prev => {
                          const oldIdx = prev.findIndex(b => b.id === activeId);
                          const newIdx = prev.findIndex(b => b.id === overId);
                          if (oldIdx === -1 || newIdx === -1) return prev;
                          return arrayMove(prev, oldIdx, newIdx);
                        });
                      }}
                    >
                      {blocks.map((block, idx) => (
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
                          pageNumber={pageNumbers.get(block.id)}
                          isBeta={!nonBetaTypes.includes(block.type)}
                          animating={animatingBlocks[block.id] || null}
                        />
                      ))}
                    </SortableList>
                  );
                })()
              )}
            </div>
          </div>

          {/* Right: Element palette */}
          <div className="w-60 shrink-0 overflow-y-auto border-s bg-muted/10">
            <div className="p-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                {isAr ? 'العناصر' : 'Elements'}
              </p>
              <TooltipProvider delayDuration={200}>
              {blockGroups.map((group, gIdx) => (
                <div key={group.key}>
                  {gIdx > 0 && <Separator className="my-2" />}
                  <button
                    type="button"
                    className="px-2 py-1.5 flex items-center gap-2 w-full hover:bg-muted/50 rounded-md transition-colors"
                    onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                  >
                    <ChevronDownIcon className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", collapsedGroups[group.key] && "-rotate-90")} />
                    <span className="text-xs font-bold text-foreground/80">{isAr ? group.labelAr : group.label}</span>
                    <span className="text-[10px] text-muted-foreground/60 bg-muted rounded-full px-1.5 py-0.5 leading-none">{group.types.length}</span>
                  </button>
                  <div className={cn("grid transition-all duration-200 ease-out", collapsedGroups[group.key] ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
                  <div className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-1 px-1 pt-1 pb-1">
                    {group.types.map(type => {
                      const meta = blockMeta[type];
                      const Icon = meta.icon;

                      // Split page constraints
                      const isSplitType = type === 'split_screen';
                      const isPageBreakType = type === 'page_break';
                      const isLocked = isSplitType && hasSplitScreen;
                      const isSplitDisabled = isSplitType && !hasSplitScreen && hasNonSplitBlocks;
                      // Lock page_break when split page is active
                      const isPageBreakLocked = isPageBreakType && hasSplitScreen;
                      const cantUse = isLocked || isSplitDisabled || isPageBreakLocked;

                      const disabledMessage = isLocked
                        ? (isAr ? 'الصفحة المقسمة مستخدمة بالفعل (مرة واحدة فقط لكل درس)' : 'Split Page is already in use (only once per lesson)')
                        : isSplitDisabled
                          ? (isAr ? 'يجب إضافة الصفحة المقسمة قبل أي عنصر آخر. احذف العناصر الموجودة أولاً.' : 'Split Page must be added before any other elements. Remove existing elements first.')
                          : isPageBreakLocked
                            ? (isAr ? 'لا يمكن استخدام صفحة جديدة أثناء وضع الصفحة المقسمة' : 'New Page cannot be used while Split Page mode is active')
                            : '';

                      const showBeta = !nonBetaTypes.includes(type);

                      const btn = (
                        <button
                          key={type}
                          type="button"
                          onClick={() => !cantUse && addBlock(type)}
                          disabled={cantUse}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center text-[10px] font-medium transition-all relative",
                            cantUse
                              ? "opacity-60 cursor-not-allowed border-destructive/40 bg-destructive/5 text-destructive/70"
                              : "border-border/50 bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow-sm"
                          )}
                        >
                          {cantUse && <Ban className="h-2.5 w-2.5 absolute top-1 end-1 text-destructive/60" />}
                          {showBeta && (
                            <Badge className="absolute -top-1.5 -start-1.5 text-[7px] px-1 py-0 h-3.5 bg-amber-500/15 text-amber-600 border-amber-400/40 font-bold uppercase tracking-wider leading-none">
                              Beta
                            </Badge>
                          )}
                          <Icon className={cn("h-4 w-4 shrink-0", cantUse ? "text-muted-foreground/40" : meta.color)} />
                          <span className="truncate w-full leading-tight">{isAr ? meta.labelAr : meta.label}</span>
                        </button>
                      );

                      if (cantUse) {
                        return (
                          <Tooltip key={type}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[200px] text-xs">
                              {disabledMessage}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return btn;
                    })}
                  </div>
                  </div>
                  </div>
                </div>
              ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-400/50 bg-amber-500/10 text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {isAr ? 'تغييرات غير محفوظة' : 'Unsaved Changes'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? 'حفظ الدرس' : 'Save Lesson'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Split Page Delete Confirmation */}
    <AlertDialog open={splitDeleteOpen} onOpenChange={setSplitDeleteOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAr ? 'حذف وضع الصفحة المقسمة' : 'Remove Split Page Mode'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAr
              ? 'ماذا تريد أن تفعل بالعناصر الموجودة داخل الصفحة المقسمة؟'
              : 'What would you like to do with the elements inside the Split Page?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => handleDeleteSplitPage(false)}
          >
            {isAr ? 'إزالة التقسيم فقط وإبقاء العناصر' : 'Remove split, keep elements'}
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-center"
            onClick={() => handleDeleteSplitPage(true)}
          >
            {isAr ? 'حذف التقسيم وجميع العناصر' : 'Delete split & all elements'}
          </Button>
          <AlertDialogCancel className="w-full mt-1">{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>

    {/* Unsaved Changes Confirmation */}
    <AlertDialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAr ? 'تغييرات غير محفوظة' : 'Unsaved Changes'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAr
              ? 'لديك تغييرات لم يتم حفظها. هل تريد المغادرة بدون حفظ؟'
              : 'You have unsaved changes. Are you sure you want to leave without saving?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isAr ? 'متابعة التعديل' : 'Keep Editing'}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={forceClose}
          >
            {isAr ? 'مغادرة بدون حفظ' : 'Discard & Close'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default LessonBuilder;
