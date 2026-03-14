import { useState, useRef, useCallback, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Link, Heading1, Heading2, Code, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
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
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const [contentFont, setContentFont] = useState(() => {
    try { return localStorage.getItem('lesson_font_family') || 'default'; } catch { return 'default'; }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lesson_font_family') setContentFont(e.newValue || 'default');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Only update innerHTML when value changes externally (not from typing)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value);
    }
  }, [value]);

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
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
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="p-4 outline-none prose prose-sm max-w-none dark:prose-invert overflow-auto"
        dir="auto"
        style={{ minHeight, unicodeBidi: 'plaintext' }}
        onInput={handleInput}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default ContentEditor;