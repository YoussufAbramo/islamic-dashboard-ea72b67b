import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  BookOpen, Play, FileText, Headphones, ExternalLink, FileDown,
  Menu, X, GraduationCap, Loader2, PanelTop, PanelTopClose, AlertTriangle, Settings2,
  ChevronDown, FolderTree, Layers, StickyNote,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LessonBuilder from '@/components/course/LessonBuilder';
import { useSidebar } from '@/components/ui/sidebar';

// ─── Types ───
interface CourseSection {
  id: string;
  title: string;
  title_ar: string | null;
  sort_order: number;
}

interface LessonSection {
  id: string;
  course_section_id: string;
  title: string;
  title_ar: string | null;
  sort_order: number;
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  title_ar: string | null;
  lesson_type: string;
  content: any;
  sort_order: number;
}

interface ProgressRecord {
  lesson_id: string;
  completed: boolean;
}

// ─── Content type helpers ───
const getContentIcon = (type: string) => {
  if (type.includes('listen') || type === 'memorization') return Headphones;
  if (type === 'read_listen' || type === 'table_of_content') return FileText;
  if (type === 'homework') return FileDown;
  if (type.includes('exercise')) return Play;
  return BookOpen;
};

const getContentLabel = (type: string, isAr: boolean): string => {
  const map: Record<string, [string, string]> = {
    table_of_content: ['Table of Content', 'جدول المحتويات'],
    read_listen: ['Read & Listen', 'قراءة واستماع'],
    memorization: ['Memorization', 'حفظ'],
    revision: ['Revision', 'مراجعة'],
    homework: ['Homework', 'واجب'],
    exercise_text_match: ['Text Match', 'مطابقة النص'],
    exercise_choose_correct: ['Choose Correct', 'اختر الصحيح'],
    exercise_choose_multiple: ['Choose Multiple', 'اختر متعدد'],
    exercise_rearrange: ['Rearrange', 'إعادة ترتيب'],
    exercise_missing_text: ['Missing Text', 'نص ناقص'],
    exercise_true_false: ['True / False', 'صح / خطأ'],
    exercise_listen_choose: ['Listen & Choose', 'استمع واختر'],
  };
  const [en, ar] = map[type] || ['Lesson', 'درس'];
  return isAr ? ar : en;
};

// ─── Content Viewer ───
const ContentViewer = ({ lesson, isAr }: { lesson: Lesson | null; isAr: boolean }) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto opacity-30" />
          <p className="text-sm">{isAr ? 'اختر درسًا للبدء' : 'Select a lesson to begin'}</p>
        </div>
      </div>
    );
  }

  const content = lesson.content || {};
  const Icon = getContentIcon(lesson.lesson_type);

  // ─── Block-based content (new format) ───
  if (Array.isArray(content.blocks) && content.blocks.length > 0) {
    // Split blocks into pages by page_break markers
    const pages: { blocks: any[]; label?: string; labelAr?: string }[] = [{ blocks: [] }];
    content.blocks.forEach((block: any) => {
      if (block.type === 'page_break') {
        pages.push({ blocks: [], label: block.page_label, labelAr: block.page_label_ar });
      } else {
        pages[pages.length - 1].blocks.push(block);
      }
    });

    const hasPages = pages.length > 1;
    const safePage = Math.min(currentPage, pages.length - 1);
    const visibleBlocks = pages[safePage]?.blocks || [];

    const renderBlock = (block: any, idx: number) => {
      switch (block.type) {
        case 'text':
          return block.html ? (
            <div key={block.id || idx} className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html) }} />
            </div>
          ) : null;

        case 'image':
          return block.image_url ? (
            <div key={block.id || idx} className="space-y-2">
              <div className="rounded-lg overflow-hidden border bg-muted/20">
                <img src={block.image_url} alt={block.image_alt || ''} className={cn("max-h-96 mx-auto w-full", `object-${block.image_fit || 'contain'}`)} loading="lazy" />
              </div>
              {(block.image_caption || block.image_alt) && (
                <p className="text-xs text-muted-foreground text-center italic">{block.image_caption || block.image_alt}</p>
              )}
            </div>
          ) : null;

        case 'video':
          return (block.video_url || block.video_embed) ? (
            <div key={block.id || idx} className="space-y-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                {block.video_type === 'embed' && block.video_embed ? (
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.video_embed, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow', 'src', 'width', 'height', 'title', 'referrerpolicy'] }) }} />
                ) : block.video_type === 'youtube' && block.video_url ? (
                  <iframe src={(() => { const m = block.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/); return m ? `https://www.youtube.com/embed/${m[1]}` : block.video_url; })()} className="w-full h-full" allowFullScreen />
                ) : block.video_type === 'vimeo' && block.video_url ? (
                  <iframe src={(() => { const m = block.video_url.match(/vimeo\.com\/(\d+)/); return m ? `https://player.vimeo.com/video/${m[1]}` : block.video_url; })()} className="w-full h-full" allowFullScreen />
                ) : (
                  <video src={block.video_url} controls className="w-full h-full" />
                )}
              </div>
              {block.video_caption && <p className="text-xs text-muted-foreground text-center italic">{block.video_caption}</p>}
            </div>
          ) : null;

        case 'audio':
          return block.audio_url ? (
            <div key={block.id || idx} className="space-y-2">
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <Headphones className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">
                    {block.audio_caption || (isAr ? 'مقطع صوتي' : 'Audio')}
                  </span>
                </div>
                <audio src={block.audio_url} controls className="w-full" />
              </div>
            </div>
          ) : null;

        // ── Divider ──
        case 'divider': {
          const divColor = (() => {
            const m: Record<string, string> = { border: 'hsl(var(--border) / 0.15)', primary: 'hsl(var(--primary) / 0.15)', muted: 'hsl(var(--muted-foreground) / 0.15)', destructive: 'hsl(var(--destructive) / 0.15)', gold: 'hsl(var(--gold, 45 80% 50%) / 0.15)' };
            return m[block.divider_color || 'border'] || 'hsl(var(--border) / 0.15)';
          })();
          const divStyle = { borderStyle: block.divider_style || 'solid' as string, borderWidth: `${block.divider_thickness || 1}px 0 0 0`, borderColor: divColor };
          const fontSize = `${Math.max(10, (block.divider_thickness || 1) * 3 + 8)}px`;
          return (
            <div key={block.id || idx} className="flex items-center justify-center gap-3 py-2" style={{ width: `${block.divider_width || 100}%`, margin: '0 auto' }}>
              <hr className="flex-1" style={divStyle} />
              {block.divider_text && (
                <span className="shrink-0 text-muted-foreground whitespace-nowrap" style={{ fontSize }}>{block.divider_text}</span>
              )}
              {block.divider_text && <hr className="flex-1" style={divStyle} />}
            </div>
          );
        }

        // ── Split Screen ──
        case 'split_screen':
          return (
            <div key={block.id || idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {block.split_left_html && (
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border bg-card" dir="auto">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.split_left_html) }} />
                </div>
              )}
              {block.split_right_html && (
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border bg-card" dir="auto">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.split_right_html) }} />
                </div>
              )}
              {!block.split_left_html && !block.split_right_html && (
                <div className="col-span-2 p-4 rounded-lg border bg-muted/20 text-center">
                  <p className="text-xs text-muted-foreground italic">{isAr ? 'لا يوجد محتوى بعد' : 'No content yet'}</p>
                </div>
              )}
            </div>
          );

        // Content block types
        case 'table_of_content': {
          const tocRows = block.toc_rows;
          if (tocRows && tocRows.length > 0) {
            const tocStyle = block.toc_style || 'default';
            const tocSize = block.toc_size || 'md';
            const sizeClasses: Record<string, { cell: string; text: string; header: string }> = {
              sm: { cell: 'px-2.5 py-1.5', text: 'text-xs', header: 'text-[10px]' },
              md: { cell: 'px-4 py-2.5', text: 'text-sm', header: 'text-xs' },
              lg: { cell: 'px-5 py-3.5', text: 'text-base', header: 'text-sm' },
              xl: { cell: 'px-6 py-4.5', text: 'text-lg', header: 'text-base' },
            };
            const sz = sizeClasses[tocSize] || sizeClasses.md;
            const tableClass = cn(
              "w-full",
              tocStyle === 'bordered' && "border-collapse [&_td]:border [&_th]:border [&_td]:border-border [&_th]:border-border",
              tocStyle === 'minimal' && "[&_thead]:hidden"
            );
            const rowClass = (rIdx: number) => cn(
              "border-b last:border-b-0 transition-colors",
              tocStyle === 'striped' && rIdx % 2 === 1 && "bg-muted/30",
              tocStyle !== 'minimal' && "hover:bg-muted/20"
            );
            const wrapClass = cn(
              "rounded-lg overflow-hidden",
              tocStyle !== 'minimal' && "border",
              tocStyle === 'minimal' && "border-b"
            );
            return (
              <div key={block.id || idx} className="space-y-3">
                <div className={wrapClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className={cn(sz.cell, sz.header, "text-start font-medium text-muted-foreground")} dir="ltr">{block.toc_header_en || 'English'}</th>
                        <th className={cn(sz.cell, sz.header, "text-start font-medium text-muted-foreground")} dir="rtl">{block.toc_header_ar || 'العربية'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tocRows.map((row: { en: string; ar: string }, rIdx: number) => (
                        <tr key={rIdx} className={rowClass(rIdx)}>
                          <td className={cn(sz.cell, sz.text)} dir="ltr">{row.en}</td>
                          <td className={cn(sz.cell, sz.text, "font-[var(--font-arabic)]")} dir="rtl">{row.ar}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          return (
            <div key={block.id || idx} className="space-y-3">
              {block.html ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html) }} />
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-muted/20 text-center">
                  <p className="text-xs text-muted-foreground italic">{isAr ? 'لا يوجد محتوى بعد' : 'No content yet'}</p>
                </div>
              )}
            </div>
          );
        }
        case 'read_listen':
        case 'memorization':
        case 'revision':
        case 'homework':
          return (
            <div key={block.id || idx} className="space-y-3">
              {block.html && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html) }} />
                </div>
              )}
              {block.audio_url && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{block.audio_caption || (isAr ? 'صوت' : 'Audio')}</span>
                  </div>
                  <audio src={block.audio_url} controls className="w-full" />
                </div>
              )}
              {!block.html && !block.audio_url && (
                <div className="p-4 rounded-lg border bg-muted/20 text-center">
                  <p className="text-xs text-muted-foreground italic">{isAr ? 'لا يوجد محتوى بعد' : 'No content yet'}</p>
                </div>
              )}
            </div>
          );

        // Exercise: True/False
        case 'exercise_true_false':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              <div className="flex gap-3">
                <Badge variant="outline" className="px-4 py-1.5 cursor-pointer hover:bg-primary/10">{isAr ? 'صح' : 'True'}</Badge>
                <Badge variant="outline" className="px-4 py-1.5 cursor-pointer hover:bg-primary/10">{isAr ? 'خطأ' : 'False'}</Badge>
              </div>
            </div>
          );

        // Exercise: Choose Correct / Multiple
        case 'exercise_choose_correct':
        case 'exercise_choose_multiple':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              {Array.isArray(block.options) && block.options.length > 0 && (
                <div className="space-y-2">
                  {block.options.map((opt: any, oi: number) => (
                    <div key={oi} className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-primary/5 transition-colors">
                      <div className={cn("h-4 w-4 rounded-full border-2 border-primary/30 shrink-0", block.type === 'exercise_choose_multiple' && "rounded-sm")} />
                      <span className="text-sm">{isAr && opt.text_ar ? opt.text_ar : opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        // Exercise: Listen & Choose
        case 'exercise_listen_choose':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.audio_url && <audio src={block.audio_url} controls className="w-full" />}
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              {Array.isArray(block.options) && block.options.length > 0 && (
                <div className="space-y-2">
                  {block.options.map((opt: any, oi: number) => (
                    <div key={oi} className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-primary/5 transition-colors">
                      <div className="h-4 w-4 rounded-full border-2 border-primary/30 shrink-0" />
                      <span className="text-sm">{isAr && opt.text_ar ? opt.text_ar : opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        // Exercise: Text Match
        case 'exercise_text_match':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              {Array.isArray(block.pairs) && block.pairs.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {block.pairs.map((p: any, pi: number) => (
                      <Badge key={pi} variant="secondary" className="w-full justify-center py-1.5">{isAr && p.left_ar ? p.left_ar : p.left}</Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {block.pairs.map((p: any, pi: number) => (
                      <Badge key={pi} variant="outline" className="w-full justify-center py-1.5">{isAr && p.right_ar ? p.right_ar : p.right}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );

        // Exercise: Rearrange
        case 'exercise_rearrange':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              {Array.isArray(block.items) && block.items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {block.items.map((item: any, ii: number) => (
                    <Badge key={ii} variant="outline" className="px-3 py-1.5 cursor-grab">
                      {isAr && item.text_ar ? item.text_ar : item.text}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );

        // Exercise: Missing Text
        case 'exercise_missing_text':
          return (
            <div key={block.id || idx} className="space-y-3 p-4 rounded-lg border bg-muted/10">
              {block.question && <p className="text-sm font-medium">{isAr && block.question_ar ? block.question_ar : block.question}</p>}
              {(block.sentence || block.sentence_ar) && (
                <p className="text-sm">
                  {(isAr && block.sentence_ar ? block.sentence_ar : block.sentence || '').replace('___', '______')}
                </p>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className={cn("space-y-4", hasPages && "pb-16")}>
        <div className="space-y-6">
          {visibleBlocks.map((block: any, idx: number) => renderBlock(block, idx))}
        </div>

        {/* Fixed bottom page navigation */}
        {hasPages && (
          <div className="sticky bottom-0 z-10 mt-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl border bg-background/80 backdrop-blur-md shadow-lg">
              <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setCurrentPage(safePage - 1)} className="gap-1 text-xs h-8">
                <ChevronLeft className="h-3.5 w-3.5" />
                {isAr ? 'السابق' : 'Prev'}
              </Button>
              <div className="flex items-center gap-1">
                {pages.map((p, pIdx) => (
                  <button key={pIdx} type="button" onClick={() => setCurrentPage(pIdx)}
                    className={cn("min-w-[30px] h-8 rounded-lg text-xs font-medium border transition-all px-2",
                      safePage === pIdx ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                    )}
                  >
                    {pIdx === 0 ? (isAr ? '١' : '1') : (isAr && p.labelAr ? p.labelAr : p.label || `${pIdx + 1}`)}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={safePage >= pages.length - 1} onClick={() => setCurrentPage(safePage + 1)} className="gap-1 text-xs h-8">
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Legacy flat content (backward compatible) ───
  const videoUrl = content.video_url || content.videoUrl;
  const audioUrl = content.audio_url || content.audioUrl;
  const pdfUrl = content.pdf_url || content.pdfUrl;
  const externalUrl = content.external_url || content.externalUrl || content.link;
  const textContent = content.text || content.body || content.html || content.description;
  const instructions = content.instructions;
  const tocRows = content.toc_rows;

  return (
    <div className="space-y-6">

      {videoUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
          <video src={videoUrl} controls className="w-full h-full" controlsList="nodownload" />
        </div>
      )}

      {audioUrl && (
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <Headphones className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isAr ? 'مقطع صوتي' : 'Audio Lesson'}</span>
          </div>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {pdfUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{isAr ? 'ملف PDF' : 'PDF Document'}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                {isAr ? 'فتح' : 'Open'}
              </a>
            </Button>
          </div>
          <div className="aspect-[3/4] max-h-[600px] rounded-lg overflow-hidden border">
            <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
          </div>
        </div>
      )}

      {externalUrl && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{isAr ? 'رابط خارجي' : 'External Resource'}</p>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{externalUrl}</p>
              </div>
            </div>
            <Button size="sm" asChild>
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                {isAr ? 'زيارة' : 'Visit'}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {instructions && (
        <div className="p-4 rounded-lg border bg-primary/5 border-primary/20 space-y-2">
          <p className="text-xs font-semibold text-primary">{isAr ? 'التعليمات' : 'Instructions'}</p>
          <p className="text-sm whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      {tocRows && Array.isArray(tocRows) && tocRows.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-start font-medium text-xs text-muted-foreground" dir="ltr">{content.toc_header_en || 'English'}</th>
                <th className="px-4 py-2 text-start font-medium text-xs text-muted-foreground" dir="rtl">{content.toc_header_ar || 'العربية'}</th>
              </tr>
            </thead>
            <tbody>
              {tocRows.map((row: { en: string; ar: string }, rIdx: number) => (
                <tr key={rIdx} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-sm" dir="ltr">{row.en}</td>
                  <td className="px-4 py-2.5 text-sm font-[var(--font-arabic)]" dir="rtl">{row.ar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {textContent && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textContent) }} />
        </div>
      )}

      {!videoUrl && !audioUrl && !pdfUrl && !externalUrl && !textContent && !instructions && !(tocRows && tocRows.length > 0) && (
        <div className="p-6 rounded-lg border bg-muted/30 text-center space-y-2">
          <Icon className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isAr ? 'لم يتم إضافة محتوى لهذا الدرس بعد.' : 'No content has been added to this lesson yet.'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr ? `نوع الدرس: ${getContentLabel(lesson.lesson_type, isAr)}` : `Lesson type: ${getContentLabel(lesson.lesson_type, isAr)}`}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───
const CourseLearning = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, role } = useAuth();
  const { topBarHidden, setTopBarHidden } = useOutletContext<{ topBarHidden: boolean; setTopBarHidden: (v: boolean) => void }>();
  const { open: appSidebarOpen, setOpen: setAppSidebarOpen } = useSidebar();
  const isAr = language === 'ar';

  // Auto-hide top bar & collapse app sidebar on mount, restore on unmount
  useEffect(() => {
    setTopBarHidden(true);
    const wasOpen = appSidebarOpen;
    if (appSidebarOpen) setAppSidebarOpen(false);
    return () => {
      setTopBarHidden(false);
      if (wasOpen) setAppSidebarOpen(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [course, setCourse] = useState<any>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [lessonSections, setLessonSections] = useState<LessonSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // visible by default
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const canManage = role === 'admin' || role === 'teacher';

  // Notes per lesson (localStorage)
  const notesKey = (lessonId: string) => `lesson_notes_${user?.id}_${lessonId}`;

  const loadNote = useCallback((lessonId: string) => {
    try {
      const saved = localStorage.getItem(notesKey(lessonId));
      setNoteText(saved || '');
    } catch { setNoteText(''); }
  }, [user?.id]);

  const saveNote = useCallback((lessonId: string, text: string) => {
    try {
      if (text.trim()) {
        localStorage.setItem(notesKey(lessonId), text);
      } else {
        localStorage.removeItem(notesKey(lessonId));
      }
    } catch {}
  }, [user?.id]);

  // Fetch everything
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);

      const [courseRes, sectionsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('course_sections').select('*').eq('course_id', id).order('sort_order'),
      ]);

      setCourse(courseRes.data);
      const cSections = sectionsRes.data || [];
      setCourseSections(cSections);

      if (cSections.length === 0) {
        setLoading(false);
        return;
      }

      const csIds = cSections.map(s => s.id);
      const { data: lSections } = await supabase
        .from('lesson_sections')
        .select('*')
        .in('course_section_id', csIds)
        .order('sort_order');
      setLessonSections((lSections as any[]) || []);

      const lsIds = (lSections || []).map((s: any) => s.id);
      if (lsIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', lsIds)
        .order('sort_order');
      setLessons(lessonsData || []);

      // Fetch user progress
      if (user) {
        const { data: studentRec } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (studentRec) {
          const lessonIds = (lessonsData || []).map(l => l.id);
          if (lessonIds.length > 0) {
            const { data: progressData } = await supabase
              .from('student_progress')
              .select('lesson_id, completed')
              .eq('student_id', studentRec.id)
              .in('lesson_id', lessonIds);
            setProgress(progressData || []);
          }
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  // All lessons in order (flattened through hierarchy)
  const orderedLessons = useMemo(() => {
    const result: Lesson[] = [];
    for (const cs of courseSections) {
      const lsForCs = lessonSections.filter(ls => ls.course_section_id === cs.id);
      for (const ls of lsForCs) {
        const lessonsForLs = lessons.filter(l => l.section_id === ls.id);
        result.push(...lessonsForLs);
      }
    }
    return result;
  }, [courseSections, lessonSections, lessons]);

  // Auto-select lesson on load
  useEffect(() => {
    if (activeLesson || orderedLessons.length === 0) return;

    // Find last completed lesson index, then open next one
    const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
    let lastCompletedIdx = -1;
    for (let i = orderedLessons.length - 1; i >= 0; i--) {
      if (completedIds.has(orderedLessons[i].id)) {
        lastCompletedIdx = i;
        break;
      }
    }

    if (lastCompletedIdx >= 0 && lastCompletedIdx < orderedLessons.length - 1) {
      // Open next lesson after last completed
      setActiveLesson(orderedLessons[lastCompletedIdx + 1].id);
    } else if (lastCompletedIdx >= 0) {
      // All done, open last completed
      setActiveLesson(orderedLessons[lastCompletedIdx].id);
    } else {
      // No progress, open first
      setActiveLesson(orderedLessons[0].id);
    }
  }, [orderedLessons, progress, activeLesson]);

  // Load notes when active lesson changes
  useEffect(() => {
    if (activeLesson) loadNote(activeLesson);
  }, [activeLesson, loadNote]);

  const currentLesson = orderedLessons.find(l => l.id === activeLesson) || null;
  const currentIndex = orderedLessons.findIndex(l => l.id === activeLesson);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < orderedLessons.length - 1;

  const completedSet = useMemo(() => {
    return new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
  }, [progress]);

  const progressPercent = orderedLessons.length > 0
    ? Math.round((completedSet.size / orderedLessons.length) * 100)
    : 0;

  const isCurrentCompleted = activeLesson ? completedSet.has(activeLesson) : false;

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson || !user) return;
    setMarkingComplete(true);

    try {
      const { data: studentRec } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentRec) {
        toast.error(isAr ? 'لم يتم العثور على سجل الطالب' : 'Student record not found');
        return;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', studentRec.id)
        .eq('lesson_id', activeLesson)
        .single();

      if (existing) {
        await supabase
          .from('student_progress')
          .update({ completed: true, completed_at: new Date().toISOString(), score: 100 })
          .eq('id', existing.id);
      } else {
        await supabase.from('student_progress').insert({
          student_id: studentRec.id,
          lesson_id: activeLesson,
          completed: true,
          completed_at: new Date().toISOString(),
          score: 100,
        });
      }

      setProgress(prev => {
        const filtered = prev.filter(p => p.lesson_id !== activeLesson);
        return [...filtered, { lesson_id: activeLesson, completed: true }];
      });

      toast.success(isAr ? 'تم إكمال الدرس!' : 'Lesson completed!');

      // Auto advance to next
      if (hasNext) {
        setTimeout(() => setActiveLesson(orderedLessons[currentIndex + 1].id), 500);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMarkingComplete(false);
    }
  }, [activeLesson, user, isAr, hasNext, currentIndex, orderedLessons]);

  const handleBuilderSaved = useCallback(async () => {
    // Re-fetch lessons to get updated content
    if (!id) return;
    const csIds = courseSections.map(s => s.id);
    if (csIds.length === 0) return;
    const { data: lSections } = await supabase.from('lesson_sections').select('*').in('course_section_id', csIds).order('sort_order');
    const lsIds = (lSections || []).map((s: any) => s.id);
    if (lsIds.length === 0) return;
    const { data: lessonsData } = await supabase.from('lessons').select('*').in('section_id', lsIds).order('sort_order');
    setLessons(lessonsData || []);
  }, [id, courseSections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12 space-y-3">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">{isAr ? 'الدورة غير موجودة' : 'Course not found'}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
          <ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'العودة' : 'Go Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", topBarHidden ? "h-[calc(100vh-2.5rem)]" : "h-[calc(100vh-6.5rem)]")}>
      {/* ─── Top Header Bar ─── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setLeaveDialogOpen(true)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            {isAr && course.title_ar ? course.title_ar : course.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={progressPercent} className="w-24 h-2" />
            <span className="text-xs font-mono text-muted-foreground">{progressPercent}%</span>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <GraduationCap className="h-3 w-3" />
            {completedSet.size}/{orderedLessons.length}
          </Badge>
          {activeLesson && (
            <Popover open={notesOpen} onOpenChange={setNotesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 shrink-0 relative", noteText.trim() && "text-primary")}
                  title={isAr ? 'ملاحظات' : 'Notes'}
                >
                  <StickyNote className="h-4 w-4" />
                  {noteText.trim() && (
                    <span className="absolute top-1 end-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{isAr ? 'ملاحظات الدرس' : 'Lesson Notes'}</span>
                  </div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      saveNote(activeLesson, e.target.value);
                    }}
                    placeholder={isAr ? 'اكتب ملاحظاتك هنا...' : 'Write your notes here...'}
                    className="min-h-[150px] text-sm resize-none"
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? 'يتم حفظ الملاحظات تلقائيًا لكل درس على حدة' : 'Notes are auto-saved per lesson individually'}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hidden md:inline-flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? (isAr ? 'إخفاء القائمة' : 'Hide Sidebar') : (isAr ? 'إظهار القائمة' : 'Show Sidebar')}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setTopBarHidden(!topBarHidden)}
            title={topBarHidden ? (isAr ? 'إظهار الشريط العلوي' : 'Show Top Bar') : (isAr ? 'إخفاء الشريط العلوي' : 'Hide Top Bar')}
          >
            {topBarHidden ? <PanelTop className="h-4 w-4" /> : <PanelTopClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ─── Two-Panel Layout ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* ── Left Panel: Course Navigation ── */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={cn(
          "bg-card border-e flex flex-col shrink-0 transition-all duration-300 z-40",
          // Mobile: overlay drawer
          "fixed inset-y-0 start-0 md:relative md:inset-auto",
          sidebarOpen ? "w-72 md:w-80 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 md:w-0"
        )}>
          {/* Navigation header */}
          <div className="px-4 py-3 border-b shrink-0 bg-muted/30">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-bold truncate">{isAr ? 'محتوى الدورة' : 'Course Content'}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ms-6">
              {orderedLessons.length} {isAr ? 'درس' : 'lessons'} · {completedSet.size} {isAr ? 'مكتمل' : 'completed'}
            </p>
            {/* Progress bar in sidebar */}
            <div className="mt-2 ms-6">
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>

          {/* Navigation tree */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {courseSections.map(cs => {
                const lsForCs = lessonSections.filter(ls => ls.course_section_id === cs.id);
                const topicLessons = lsForCs.flatMap(ls => lessons.filter(l => l.section_id === ls.id));
                const topicCompleted = topicLessons.length > 0 && topicLessons.every(l => completedSet.has(l.id));
                const topicProgress = topicLessons.length > 0
                  ? Math.round((topicLessons.filter(l => completedSet.has(l.id)).length / topicLessons.length) * 100)
                  : 0;

                return (
                  <details key={cs.id} className="group/topic" open>
                    {/* Topic (L1) */}
                    <summary className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer select-none hover:bg-muted/60 transition-colors list-none [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-open/topic:rotate-0 -rotate-90" />
                      <FolderTree className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-xs font-semibold truncate flex-1">
                        {isAr && cs.title_ar ? cs.title_ar : cs.title}
                      </span>
                      {topicCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : topicProgress > 0 ? (
                        <span className="text-[9px] text-muted-foreground shrink-0 font-mono">{topicProgress}%</span>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                          {topicLessons.length}
                        </Badge>
                      )}
                    </summary>

                    <div className="grid transition-all duration-300 ease-out group-open/topic:grid-rows-[1fr] grid-rows-[0fr]">
                     <div className="overflow-hidden">
                      <div className="ms-3 border-s border-border/50 space-y-0.5 pb-1">
                      {lsForCs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground/50 px-4 py-2 italic">
                          {isAr ? 'لا توجد أقسام' : 'No sections'}
                        </p>
                      )}
                      {lsForCs.map(ls => {
                        const lessonsForLs = lessons.filter(l => l.section_id === ls.id);
                        const sectionCompleted = lessonsForLs.length > 0 && lessonsForLs.every(l => completedSet.has(l.id));
                        const sectionProgress = lessonsForLs.length > 0
                          ? Math.round((lessonsForLs.filter(l => completedSet.has(l.id)).length / lessonsForLs.length) * 100)
                          : 0;

                        return (
                          <details key={ls.id} className="group/section" open>
                            {/* Section (L2) */}
                            <summary className="flex items-center gap-2 px-3 py-2 ms-1 rounded-md cursor-pointer select-none hover:bg-muted/40 transition-colors list-none [&::-webkit-details-marker]:hidden">
                              <ChevronDown className="h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform group-open/section:rotate-0 -rotate-90" />
                              <Layers className="h-3 w-3 shrink-0" style={{ color: 'hsl(var(--gold, var(--primary)))' }} />
                              <span className="text-[11px] font-medium truncate flex-1">
                                {isAr && ls.title_ar ? ls.title_ar : ls.title}
                              </span>
                              {sectionCompleted ? (
                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                              ) : sectionProgress > 0 ? (
                                <span className="text-[9px] text-muted-foreground shrink-0">{sectionProgress}%</span>
                              ) : null}
                            </summary>

                            <div className="grid transition-all duration-300 ease-out group-open/section:grid-rows-[1fr] grid-rows-[0fr]">
                             <div className="overflow-hidden">
                              <div className="ms-4 border-s border-border/30 space-y-px pb-0.5">
                              {lessonsForLs.length === 0 && (
                                <p className="text-[10px] text-muted-foreground/40 px-3 py-1.5 italic">
                                  {isAr ? 'لا توجد دروس' : 'No lessons'}
                                </p>
                              )}
                              {lessonsForLs.map(lesson => {
                                const isActive = activeLesson === lesson.id;
                                const isDone = completedSet.has(lesson.id);
                                const LessonIcon = getContentIcon(lesson.lesson_type);
                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={() => {
                                      setActiveLesson(lesson.id);
                                      // Auto-close sidebar on mobile
                                      if (window.innerWidth < 768) setSidebarOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-3 py-1.5 ms-1 rounded-md text-start text-[11px] transition-all",
                                      isActive
                                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                                        : isDone
                                          ? "text-muted-foreground hover:bg-muted/40"
                                          : "text-foreground hover:bg-muted/40"
                                    )}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                    ) : isActive ? (
                                      <Play className="h-3 w-3 text-primary shrink-0 fill-primary" />
                                    ) : (
                                      <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                    )}
                                    <span className={cn("truncate flex-1", isDone && !isActive && "line-through opacity-60")}>
                                      {isAr && lesson.title_ar ? lesson.title_ar : lesson.title}
                                    </span>
                                  </button>
                                );
                              })}
                              </div>
                             </div>
                            </div>
                          </details>
                        );
                      })}
                      </div>
                     </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </ScrollArea>

          {/* Navigation & actions */}
          {orderedLessons.length > 0 && (
            <div className="border-t bg-card shrink-0 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev}
                  onClick={() => hasPrev && setActiveLesson(orderedLessons[currentIndex - 1].id)}
                  className="h-7 text-xs px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5 me-0.5" />
                  {isAr ? 'السابق' : 'Prev'}
                </Button>
                <span className="text-[10px] text-muted-foreground font-mono">{currentIndex + 1}/{orderedLessons.length}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  onClick={() => hasNext && setActiveLesson(orderedLessons[currentIndex + 1].id)}
                  className="h-7 text-xs px-2"
                >
                  {isAr ? 'التالي' : 'Next'}
                  <ChevronRight className="h-3.5 w-3.5 ms-0.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                {canManage && currentLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuilderOpen(true)}
                    className="gap-1 h-7 text-xs flex-1"
                  >
                    <Settings2 className="h-3 w-3" />
                    {isAr ? 'تعديل الدرس' : 'Edit Lesson'}
                  </Button>
                )}
                {user && currentLesson && !isCurrentCompleted && (
                  <Button
                    size="sm"
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="h-7 text-xs flex-1"
                  >
                    {markingComplete ? (
                      <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                    )}
                    {isAr ? 'إكمال' : 'Complete'}
                  </Button>
                )}
                {isCurrentCompleted && (
                  <Badge variant="default" className="gap-1 text-[10px] flex-1 justify-center py-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {isAr ? 'مكتمل' : 'Completed'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Lesson Content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Lesson header strip */}
          {currentLesson && (
            <div className="flex items-center gap-3 px-5 py-2.5 border-b bg-muted/20 shrink-0">
              <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                {React.createElement(getContentIcon(currentLesson.lesson_type), { className: 'h-3 w-3' })}
                {getContentLabel(currentLesson.lesson_type, isAr)}
              </Badge>
              <h2 className="text-sm font-semibold truncate flex-1">
                {isAr && currentLesson.title_ar ? currentLesson.title_ar : currentLesson.title}
              </h2>
              {isCurrentCompleted && (
                <Badge variant="default" className="gap-1 text-[10px] shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  {isAr ? 'مكتمل' : 'Completed'}
                </Badge>
              )}
            </div>
          )}

          {/* Main scrollable content */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
              <ContentViewer lesson={currentLesson} isAr={isAr} />
            </div>
          </ScrollArea>

        </div>
      </div>

      {/* Leave dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? 'مغادرة صفحة التعلم؟' : 'Leave Learning Page?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'أي تقدم غير محفوظ قد يُفقد. تأكد من الضغط على "إكمال الدرس" قبل المغادرة للحفاظ على تقدمك.'
                : 'Any unsaved progress may be lost. Make sure to click "Mark Complete" before leaving to save your progress.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'متابعة التعلم' : 'Continue Learning'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => navigate('/dashboard/courses')}
            >
              {isAr ? 'مغادرة' : 'Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lesson Builder */}
      <LessonBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        lesson={currentLesson ? { id: currentLesson.id, title: currentLesson.title, title_ar: currentLesson.title_ar, content: currentLesson.content } : null}
        isAr={isAr}
        onSaved={handleBuilderSaved}
      />
    </div>
  );
};

export default CourseLearning;
