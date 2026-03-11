import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Image, FileText, Upload, Search, HardDrive, Lock, Globe, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  created_at: string;
}

interface FileObject {
  name: string;
  id?: string;
  created_at?: string;
  metadata?: { size?: number; mimetype?: string };
}

const Media = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [buckets] = useState<BucketInfo[]>([
    { id: 'avatars', name: 'avatars', public: false, created_at: '' },
    { id: 'course-images', name: 'course-images', public: true, created_at: '' },
    { id: 'backups', name: 'backups', public: false, created_at: '' },
  ]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchFiles = async (bucketName: string) => {
    setLoading(true);
    setSelectedBucket(bucketName);
    const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      toast.error(isAr ? 'خطأ في تحميل الملفات' : 'Error loading files');
      setFiles([]);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!selectedBucket || !fileList.length) return;
    setUploading(true);
    const uploadedCount = { success: 0, fail: 0 };

    for (const file of fileList) {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(selectedBucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.error('Upload error:', error);
        uploadedCount.fail++;
      } else {
        uploadedCount.success++;
      }
    }

    if (uploadedCount.success > 0) {
      toast.success(isAr ? `تم رفع ${uploadedCount.success} ملف بنجاح` : `${uploadedCount.success} file(s) uploaded successfully`);
    }
    if (uploadedCount.fail > 0) {
      toast.error(isAr ? `فشل رفع ${uploadedCount.fail} ملف` : `${uploadedCount.fail} file(s) failed to upload`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    fetchFiles(selectedBucket);
  }, [selectedBucket, isAr]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(Array.from(e.target.files));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  }, [uploadFiles]);

  const handleDelete = async (fileName: string) => {
    if (!selectedBucket) return;
    const { error } = await supabase.storage.from(selectedBucket).remove([fileName]);
    if (error) {
      toast.error(isAr ? 'خطأ في حذف الملف' : 'Error deleting file');
    } else {
      toast.success(isAr ? 'تم حذف الملف' : 'File deleted');
      setFiles(prev => prev.filter(f => f.name !== fileName));
    }
  };

  const getPublicUrl = (fileName: string) => {
    if (!selectedBucket) return '';
    const { data } = supabase.storage.from(selectedBucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  const isImageFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return IMAGE_EXTS.includes(ext || '');
  };

  const getFileIcon = (name: string) => {
    if (isImageFile(name)) return <Image className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const getThumbnailUrl = (fileName: string) => {
    if (!selectedBucket || !isImageFile(fileName)) return null;
    const { data } = supabase.storage.from(selectedBucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentBucket = buckets.find(b => b.id === selectedBucket);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            {isAr ? 'مدير الوسائط' : 'Media Manager'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'تصفح وإدارة ملفات التخزين' : 'Browse and manage storage files'}
          </p>
        </div>
      </div>

      {/* Storage Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <Card
            key={bucket.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedBucket === bucket.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => fetchFiles(bucket.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{bucket.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {bucket.public ? (
                    <Badge variant="outline" className="text-[10px] gap-0.5"><Globe className="h-2.5 w-2.5" />{isAr ? 'عام' : 'Public'}</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-0.5"><Lock className="h-2.5 w-2.5" />{isAr ? 'خاص' : 'Private'}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File Browser */}
      {selectedBucket && (
        <Card
          className={`relative transition-colors ${isDragging ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
              <Upload className="h-10 w-10 text-primary mb-2 animate-bounce" />
              <p className="text-sm font-medium text-primary">{isAr ? 'أفلت الملفات هنا للرفع' : 'Drop files here to upload'}</p>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  {selectedBucket}
                </CardTitle>
                <CardDescription>{filteredFiles.length} {isAr ? 'ملف' : 'files'}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? 'بحث...' : 'Search files...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="ps-9 w-48 h-9"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading
                    ? (isAr ? 'جاري الرفع...' : 'Uploading...')
                    : (isAr ? 'رفع ملف' : 'Upload')}
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={() => fetchFiles(selectedBucket)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? 'لا توجد ملفات' : 'No files found'}</p>
                <p className="text-xs mt-1">{isAr ? 'اضغط على "رفع ملف" لإضافة ملفات' : 'Click "Upload" to add files'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    {getFileIcon(file.name)}
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(file.metadata?.size)}</span>
                    <Badge variant="outline" className="text-[10px]">{file.metadata?.mimetype || '—'}</Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {currentBucket?.public && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            const url = getPublicUrl(file.name);
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{isAr ? 'حذف الملف' : 'Delete File'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {isAr ? `هل أنت متأكد من حذف "${file.name}"؟` : `Are you sure you want to delete "${file.name}"?`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {isAr ? 'حذف' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Media;