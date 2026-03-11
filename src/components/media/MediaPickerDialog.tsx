import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, FolderOpen, Check, Upload, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  bucket?: string;
}

interface FileObj {
  name: string;
  id?: string | null;
  metadata?: { mimetype?: string } | null;
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const BUCKETS = [
  { id: 'course-images', name: 'course-images', public: true },
  { id: 'avatars', name: 'avatars', public: false },
];

const MediaPickerDialog = ({ open, onOpenChange, onSelect, bucket: defaultBucket }: MediaPickerDialogProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [bucket, setBucket] = useState<string | null>(defaultBucket || null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileObj[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (name: string) => IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() || '');

  const fetchFiles = useCallback(async (bucketId: string, path = '') => {
    setBucket(bucketId);
    setCurrentPath(path);
    setLoading(true);
    setFileUrls({});
    const { data } = await supabase.storage.from(bucketId).list(path, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    const items = data || [];
    const folderItems = items.filter(f => f.id === null || (f.metadata && Object.keys(f.metadata).length === 0 && !f.name.includes('.')));
    const fileItems = items.filter(f => f.id !== null && f.name.includes('.') && isImage(f.name));
    setFolders(folderItems.map(f => f.name));
    setFiles(fileItems);

    // Generate URLs (signed for private buckets, public for public ones)
    const bucketInfo = BUCKETS.find(b => b.id === bucketId);
    const urls: Record<string, string> = {};
    if (bucketInfo && !bucketInfo.public && fileItems.length > 0) {
      const paths = fileItems.map(f => path ? `${path}/${f.name}` : f.name);
      const { data: signedData } = await supabase.storage.from(bucketId).createSignedUrls(paths, 3600);
      if (signedData) {
        signedData.forEach((item, i) => {
          if (item.signedUrl) urls[fileItems[i].name] = item.signedUrl;
        });
      }
    } else {
      fileItems.forEach(f => {
        const fullPath = path ? `${path}/${f.name}` : f.name;
        urls[f.name] = supabase.storage.from(bucketId).getPublicUrl(fullPath).data.publicUrl;
      });
    }
    setFileUrls(urls);
    setLoading(false);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && defaultBucket && !bucket) {
      fetchFiles(defaultBucket, '');
    }
    if (!isOpen) {
      if (!defaultBucket) {
        setBucket(null);
        setFiles([]);
        setFolders([]);
      }
      setCurrentPath('');
      setSearch('');
    }
    onOpenChange(isOpen);
  };

  useState(() => {
    if (open && defaultBucket && files.length === 0 && folders.length === 0 && !loading) {
      fetchFiles(defaultBucket, '');
    }
  });

  const getUrl = async (fileName: string): Promise<string> => {
    if (!bucket) return '';
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const bucketInfo = BUCKETS.find(b => b.id === bucket);
    if (bucketInfo && !bucketInfo.public) {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(fullPath, 3600);
      return data?.signedUrl || '';
    }
    return supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
  };

  const handleSelect = async (fileName: string) => {
    // Use pre-generated URL if available, otherwise generate one
    const url = fileUrls[fileName] || await getUrl(fileName);
    onSelect(url);
    onOpenChange(false);
  };

  const navigateToFolder = (folderName: string) => {
    if (!bucket) return;
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    fetchFiles(bucket, newPath);
  };

  const navigateUp = () => {
    if (!bucket) return;
    if (!currentPath) {
      // Go back to bucket selection
      if (!defaultBucket) {
        setBucket(null);
        setFiles([]);
        setFolders([]);
      }
      return;
    }
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(bucket, parts.join('/'));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length || !bucket) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(fileList)) {
      const filePath = currentPath ? `${currentPath}/${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (!error) uploaded++;
    }
    if (uploaded > 0) {
      toast.success(isAr ? `تم رفع ${uploaded} ملف بنجاح` : `${uploaded} file(s) uploaded`);
      fetchFiles(bucket, currentPath);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = folders.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  const breadcrumbs = currentPath ? currentPath.split('/') : [];

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
                onClick={() => fetchFiles(b.id, '')}
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
              <Button variant="ghost" size="sm" onClick={navigateUp}>
                <ArrowLeft className="h-4 w-4 me-1" />
                {isAr ? 'رجوع' : 'Back'}
              </Button>

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
                  <button onClick={() => fetchFiles(bucket, '')} className="hover:text-foreground transition-colors shrink-0">
                    {bucket}
                  </button>
                  {breadcrumbs.map((part, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 shrink-0" />
                      <button
                        onClick={() => fetchFiles(bucket, breadcrumbs.slice(0, i + 1).join('/'))}
                        className="hover:text-foreground transition-colors truncate max-w-[100px]"
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1" />
              <div className="relative min-w-[140px]">
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

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? 'لا توجد صور أو مجلدات' : 'No images or folders found'}</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  {isAr ? 'اضغط "رفع صورة" لإضافة صور جديدة' : 'Click "Upload" to add new images'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Folders */}
                {filteredFolders.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {filteredFolders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => navigateToFolder(folder)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors"
                      >
                        <FolderOpen className="h-8 w-8 text-primary/70" />
                        <span className="text-xs font-medium truncate w-full text-center">{folder}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Images */}
                {filteredFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {filteredFiles.map(file => (
                      <button
                        key={file.name}
                        onClick={() => handleSelect(file.name)}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img src={fileUrls[file.name] || ''} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerDialog;
