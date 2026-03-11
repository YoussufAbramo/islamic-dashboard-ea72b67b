import { useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, Underline, List, ListOrdered, Link, Heading1, Heading2, Code, Eye, FileText, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const ContentEditor = ({ value, onChange, placeholder, minHeight = '300px' }: ContentEditorProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt(isAr ? 'أدخل الرابط:' : 'Enter URL:');
    if (url) execCmd('createLink', url);
  };

  const toolbar = [
    { icon: Bold, cmd: 'bold', label: 'Bold' },
    { icon: Italic, cmd: 'italic', label: 'Italic' },
    { icon: Underline, cmd: 'underline', label: 'Underline' },
    { divider: true },
    { icon: Heading1, cmd: 'formatBlock', val: 'h2', label: 'Heading 1' },
    { icon: Heading2, cmd: 'formatBlock', val: 'h3', label: 'Heading 2' },
    { divider: true },
    { icon: List, cmd: 'insertUnorderedList', label: 'Bullet List' },
    { icon: ListOrdered, cmd: 'insertOrderedList', label: 'Numbered List' },
    { divider: true },
    { icon: AlignLeft, cmd: 'justifyLeft', label: 'Align Left' },
    { icon: AlignCenter, cmd: 'justifyCenter', label: 'Center' },
    { icon: AlignRight, cmd: 'justifyRight', label: 'Align Right' },
    { divider: true },
    { icon: Link, cmd: 'link', label: 'Insert Link' },
    { icon: Code, cmd: 'formatBlock', val: 'pre', label: 'Code Block' },
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
        {toolbar.map((item, i) => {
          if ('divider' in item) return <div key={i} className="w-px h-6 bg-border mx-1" />;
          const Icon = item.icon;
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                if (item.cmd === 'link') insertLink();
                else execCmd(item.cmd!, item.val);
              }}
              title={item.label}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          );
        })}
        <div className="ms-auto flex gap-1">
          <Button
            type="button"
            variant={mode === 'visual' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('visual')}
          >
            <Eye className="h-3 w-3" />
            {isAr ? 'مرئي' : 'Visual'}
          </Button>
          <Button
            type="button"
            variant={mode === 'html' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('html')}
          >
            <FileText className="h-3 w-3" />
            HTML
          </Button>
        </div>
      </div>

      {/* Editor */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="p-4 outline-none prose prose-sm max-w-none dark:prose-invert overflow-auto"
          style={{ minHeight }}
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 rounded-none focus-visible:ring-0 font-mono text-xs"
          style={{ minHeight }}
        />
      )}
    </div>
  );
};

export default ContentEditor;
