import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FolderOpen, Check } from 'lucide-react';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

interface FileObj {
  name: string;
  metadata?: { mimetype?: string };
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const BUCKETS = [
  { id: 'course-images', name: 'course-images', public: true },
  { id: 'avatars', name: 'avatars', public: false },
];

const MediaPickerDialog = ({ open, onOpenChange, onSelect }: MediaPickerDialogProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [bucket, setBucket] = useState<string | null>(null);
  const [files, setFiles] = useState<FileObj[]>([]);
  const [loading, setLoading] = useState(false);

  const isImage = (name: string) => IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() || '');

  const fetchFiles = useCallback(async (bucketId: string) => {
    setBucket(bucketId);
    setLoading(true);
    const { data } = await supabase.storage.from(bucketId).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    setFiles((data || []).filter(f => isImage(f.name)));
    setLoading(false);
  }, []);

  const getUrl = (fileName: string) => {
    if (!bucket) return '';
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSelect = (fileName: string) => {
    const url = getUrl(fileName);
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            {isAr ? 'اختر صورة من الوسائط' : 'Select Image from Media'}
          </DialogTitle>
        </DialogHeader>

        {!bucket ? (
          <div className="grid grid-cols-2 gap-3">
            {BUCKETS.filter(b => b.public).map(b => (
              <button
                key={b.id}
                onClick={() => fetchFiles(b.id)}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors"
              >
                <FolderOpen className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{b.name}</span>
              </button>
            ))}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد صور' : 'No images found'}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="sm" onClick={() => { setBucket(null); setFiles([]); }}>
                ← {isAr ? 'رجوع' : 'Back'}
              </Button>
              <span className="text-sm text-muted-foreground">{bucket}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {files.map(file => (
                <button
                  key={file.name}
                  onClick={() => handleSelect(file.name)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img src={getUrl(file.name)} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                    <Check className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerDialog;
