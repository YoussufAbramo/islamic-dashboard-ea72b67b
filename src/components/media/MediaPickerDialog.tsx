import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, FolderOpen, Check, Upload, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  bucket?: string;
}

interface FileObj {
  name: string;
  metadata?: { mimetype?: string };
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const BUCKETS = [
  { id: 'course-images', name: 'course-images', public: true },
];

const MediaPickerDialog = ({ open, onOpenChange, onSelect, bucket: defaultBucket }: MediaPickerDialogProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [bucket, setBucket] = useState<string | null>(defaultBucket || null);
  const [files, setFiles] = useState<FileObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (name: string) => IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() || '');

  const fetchFiles = useCallback(async (bucketId: string) => {
    setBucket(bucketId);
    setLoading(true);
    const { data } = await supabase.storage.from(bucketId).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    setFiles((data || []).filter(f => isImage(f.name)));
    setLoading(false);
  }, []);

  // Auto-load when opening with a default bucket
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && defaultBucket && !bucket) {
      fetchFiles(defaultBucket);
    }
    if (!isOpen) {
      // Reset state on close
      if (!defaultBucket) {
        setBucket(null);
        setFiles([]);
      }
      setSearch('');
    }
    onOpenChange(isOpen);
  };

  // Also auto-load if opened with default bucket
  useState(() => {
    if (open && defaultBucket && files.length === 0 && !loading) {
      fetchFiles(defaultBucket);
    }
  });

  const getUrl = (fileName: string) => {
    if (!bucket) return '';
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSelect = (fileName: string) => {
    const url = getUrl(fileName);
    onSelect(url);
    onOpenChange(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length || !bucket) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(fileList)) {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (!error) uploaded++;
    }
    if (uploaded > 0) {
      toast.success(isAr ? `تم رفع ${uploaded} ملف بنجاح` : `${uploaded} file(s) uploaded`);
      fetchFiles(bucket);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        ) : (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {!defaultBucket && (
                <Button variant="ghost" size="sm" onClick={() => { setBucket(null); setFiles([]); setSearch(''); }}>
                  <ArrowLeft className="h-4 w-4 me-1" />
                  {isAr ? 'رجوع' : 'Back'}
                </Button>
              )}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={isAr ? 'بحث...' : 'Search...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-8 h-8 text-sm"
                />
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
              <Button size="sm" className="h-8 gap-1.5" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع صورة' : 'Upload')}
              </Button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? 'لا توجد صور' : 'No images found'}</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  {isAr ? 'اضغط "رفع صورة" لإضافة صور جديدة' : 'Click "Upload" to add new images'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredFiles.map(file => (
                  <button
                    key={file.name}
                    onClick={() => handleSelect(file.name)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img src={getUrl(file.name)} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                      <Check className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-background/80 text-[10px] truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerDialog;
