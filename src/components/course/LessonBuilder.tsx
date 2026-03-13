import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import ContentEditor from '@/components/ContentEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GripVertical, Type, Image, Video, Music,
  ChevronUp, ChevronDown, Loader2, Save, X, FileEdit,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Block Types ───
export type BlockType = 'text' | 'image' | 'video' | 'audio';

export interface ContentBlock {
  id: string;
  type: BlockType;
  // text
  html?: string;
  // image
  image_url?: string;
  image_caption?: string;
  image_alt?: string;
  // video
  video_url?: string;
  video_caption?: string;
  // audio
  audio_url?: string;
  audio_caption?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const blockMeta: Record<BlockType, { icon: React.ElementType; label: string; labelAr: string; color: string }> = {
  text: { icon: Type, label: 'Text', labelAr: 'نص', color: 'text-blue-500' },
  image: { icon: Image, label: 'Image', labelAr: 'صورة', color: 'text-green-500' },
  video: { icon: Video, label: 'Video', labelAr: 'فيديو', color: 'text-red-500' },
  audio: { icon: Music, label: 'Audio', labelAr: 'صوت', color: 'text-amber-500' },
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

  return (
    <div className="rounded-lg border bg-card group relative">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
        <span className="text-xs font-medium text-muted-foreground">
          {isAr ? meta.labelAr : meta.label}
        </span>
        <div className="ms-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst} onClick={onMoveUp}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast} onClick={onMoveDown}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-3 space-y-3">
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
              <Input
                placeholder="https://..."
                value={block.image_url || ''}
                onChange={(e) => onChange({ ...block, image_url: e.target.value })}
                className="mt-1"
              />
            </div>
            {block.image_url && (
              <div className="rounded-lg border overflow-hidden bg-muted/30">
                <img src={block.image_url} alt={block.image_alt || ''} className="max-h-48 mx-auto object-contain" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label>
                <Input
                  value={block.image_caption || ''}
                  onChange={(e) => onChange({ ...block, image_caption: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{isAr ? 'النص البديل' : 'Alt Text'}</Label>
                <Input
                  value={block.image_alt || ''}
                  onChange={(e) => onChange({ ...block, image_alt: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {block.type === 'video' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isAr ? 'رابط الفيديو' : 'Video URL'}</Label>
              <Input
                placeholder="https://..."
                value={block.video_url || ''}
                onChange={(e) => onChange({ ...block, video_url: e.target.value })}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isAr ? 'يدعم MP4 أو روابط مباشرة للفيديو' : 'Supports MP4 or direct video URLs'}
              </p>
            </div>
            {block.video_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                <video src={block.video_url} controls className="w-full h-full" />
              </div>
            )}
            <div>
              <Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label>
              <Input
                value={block.video_caption || ''}
                onChange={(e) => onChange({ ...block, video_caption: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {block.type === 'audio' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isAr ? 'رابط الصوت' : 'Audio URL'}</Label>
              <Input
                placeholder="https://..."
                value={block.audio_url || ''}
                onChange={(e) => onChange({ ...block, audio_url: e.target.value })}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isAr ? 'يدعم MP3, WAV, OGG' : 'Supports MP3, WAV, OGG'}
              </p>
            </div>
            {block.audio_url && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <audio src={block.audio_url} controls className="w-full" />
              </div>
            )}
            <div>
              <Label className="text-xs">{isAr ? 'التسمية التوضيحية' : 'Caption'}</Label>
              <Input
                value={block.audio_caption || ''}
                onChange={(e) => onChange({ ...block, audio_caption: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Add Block Buttons (shown inline) ───
const AddBlockButtons = ({ isAr, onAdd, prominent }: { isAr: boolean; onAdd: (type: BlockType) => void; prominent?: boolean }) => (
  <div className={cn(
    "grid grid-cols-2 gap-2",
    prominent && "sm:grid-cols-4"
  )}>
    {(Object.entries(blockMeta) as [BlockType, typeof blockMeta['text']][]).map(([type, meta]) => {
      const Icon = meta.icon;
      return (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-all hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
            prominent && "py-6"
          )}
        >
          <Icon className={cn("h-5 w-5", meta.color)} />
          <span className="text-xs font-medium">{isAr ? meta.labelAr : meta.label}</span>
        </button>
      );
    })}
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
        migrated.push({
          id: generateId(),
          type: 'text',
          html: content.text || content.body || content.html || content.description || '',
        });
      }
      if (content.video_url || content.videoUrl) {
        migrated.push({
          id: generateId(),
          type: 'video',
          video_url: content.video_url || content.videoUrl || '',
        });
      }
      if (content.audio_url || content.audioUrl) {
        migrated.push({
          id: generateId(),
          type: 'audio',
          audio_url: content.audio_url || content.audioUrl || '',
        });
      }
      if (content.image_url || content.imageUrl) {
        migrated.push({
          id: generateId(),
          type: 'image',
          image_url: content.image_url || content.imageUrl || '',
        });
      }
      setBlocks(migrated);
    }
  }

  // Reset when closing
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      initialized.current = null;
      setBlocks([]);
    }
    onOpenChange(v);
  };

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: ContentBlock = { id: generateId(), type };
    if (type === 'text') newBlock.html = '';
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
      const { error } = await supabase
        .from('lessons')
        .update({ content: newContent as any })
        .eq('id', lesson.id);
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="truncate block">
                {isAr ? 'محرر الدرس' : 'Lesson Builder'}
              </span>
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

        {/* Blocks Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-5 space-y-3">
            {blocks.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6 space-y-2">
                  <FileEdit className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'اختر نوع المحتوى للبدء' : 'Choose a content type to get started'}
                  </p>
                </div>
                <AddBlockButtons isAr={isAr} onAdd={addBlock} prominent />
              </div>
            ) : (
              <>
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
                  />
                ))}
                <AddBlockButtons isAr={isAr} onAdd={addBlock} />
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonBuilder;
