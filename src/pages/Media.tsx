import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FolderOpen, Image, FileText, Upload, Search, HardDrive, Lock, Globe, RefreshCw, Trash2, ExternalLink, Info, Download, CheckSquare, X, ChevronRight, FolderPlus, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  description: string;
  descriptionAr: string;
}

interface FileObject {
  name: string;
  id?: string | null;
  created_at?: string;
  metadata?: { size?: number; mimetype?: string } | null;
}

const BUCKETS: BucketInfo[] = [
  { id: 'avatars', name: 'avatars', public: false, description: 'User profile pictures and avatar images', descriptionAr: 'صور الملفات الشخصية والأفاتار' },
  { id: 'course-images', name: 'course-images', public: true, description: 'Course thumbnails and educational media', descriptionAr: 'صور الدورات والوسائط التعليمية' },
  { id: 'backups', name: 'backups', public: false, description: 'System backup files and exports', descriptionAr: 'ملفات النسخ الاحتياطي والتصدير' },
];

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

const Media = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchFiles = async (bucketName: string, path = '') => {
    setLoading(true);
    setSelectedBucket(bucketName);
    setCurrentPath(path);
    setSelectedFile(null);
    setSelectedNames(new Set());
    const { data, error } = await supabase.storage.from(bucketName).list(path, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      toast.error(isAr ? 'خطأ في تحميل الملفات' : 'Error loading files');
      setFiles([]);
      setFolders([]);
    } else {
      const items = data || [];
      // Folders: id is null or metadata is empty placeholder
      const folderItems = items.filter(f => f.id === null);
      const fileItems = items.filter(f => f.id !== null && f.name && f.name !== '.emptyFolderPlaceholder');
      setFolders(folderItems.map(f => f.name));
      setFiles(fileItems);
    }
    setLoading(false);
  };

  const navigateToFolder = (folderName: string) => {
    if (!selectedBucket) return;
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    fetchFiles(selectedBucket, newPath);
  };

  const navigateUp = () => {
    if (!selectedBucket) return;
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(selectedBucket, parts.join('/'));
  };

  const createFolder = async () => {
    if (!selectedBucket || !newFolderName.trim()) return;
    const folderPath = currentPath
      ? `${currentPath}/${newFolderName.trim()}/.emptyFolderPlaceholder`
      : `${newFolderName.trim()}/.emptyFolderPlaceholder`;
    const { error } = await supabase.storage.from(selectedBucket).upload(folderPath, new Blob(['']), { cacheControl: '3600', upsert: true });
    if (error) {
      toast.error(isAr ? 'خطأ في إنشاء المجلد' : 'Error creating folder');
    } else {
      toast.success(isAr ? 'تم إنشاء المجلد' : 'Folder created');
      fetchFiles(selectedBucket, currentPath);
    }
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!selectedBucket || !fileList.length) return;
    setUploading(true);
    const uploadedCount = { success: 0, fail: 0 };
    for (const file of fileList) {
      const filePath = currentPath
        ? `${currentPath}/${Date.now()}-${file.name}`
        : `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(selectedBucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (error) { uploadedCount.fail++; } else { uploadedCount.success++; }
    }
    if (uploadedCount.success > 0) toast.success(isAr ? `تم رفع ${uploadedCount.success} ملف بنجاح` : `${uploadedCount.success} file(s) uploaded`);
    if (uploadedCount.fail > 0) toast.error(isAr ? `فشل رفع ${uploadedCount.fail} ملف` : `${uploadedCount.fail} file(s) failed`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    fetchFiles(selectedBucket, currentPath);
  }, [selectedBucket, currentPath, isAr]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(Array.from(e.target.files));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items?.length) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0; if (e.dataTransfer.files?.length) uploadFiles(Array.from(e.dataTransfer.files)); }, [uploadFiles]);

  const getFullPath = (fileName: string) => currentPath ? `${currentPath}/${fileName}` : fileName;

  const handleDelete = async (fileName: string) => {
    if (!selectedBucket) return;
    const { error } = await supabase.storage.from(selectedBucket).remove([getFullPath(fileName)]);
    if (error) { toast.error(isAr ? 'خطأ في حذف الملف' : 'Error deleting file'); }
    else { toast.success(isAr ? 'تم حذف الملف' : 'File deleted'); setFiles(prev => prev.filter(f => f.name !== fileName)); if (selectedFile?.name === fileName) setSelectedFile(null); setSelectedNames(prev => { const n = new Set(prev); n.delete(fileName); return n; }); }
  };

  const getPublicUrl = (fileName: string) => {
    if (!selectedBucket) return '';
    return supabase.storage.from(selectedBucket).getPublicUrl(getFullPath(fileName)).data.publicUrl;
  };

  const isImageFile = (name: string) => IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() || '');
  const getFileExt = (name: string) => (name.split('.').pop()?.toUpperCase() || '—');

  const selectFile = async (file: FileObject | null) => {
    setSelectedFile(file);
    setPreviewUrl('');
    if (!file || !selectedBucket || !isImageFile(file.name)) return;
    const bucket = BUCKETS.find(b => b.id === selectedBucket);
    if (bucket?.public) {
      setPreviewUrl(getPublicUrl(file.name));
    } else {
      const { data } = await supabase.storage.from(selectedBucket).createSignedUrl(getFullPath(file.name), 3600);
      if (data?.signedUrl) setPreviewUrl(data.signedUrl);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!selectedBucket) return;
    const bucket = BUCKETS.find(b => b.id === selectedBucket);
    if (bucket?.public) {
      const url = getPublicUrl(fileName);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const { data, error } = await supabase.storage.from(selectedBucket).download(getFullPath(fileName));
      if (error || !data) { toast.error(isAr ? 'خطأ في تحميل الملف' : 'Error downloading file'); return; }
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleSelect = (name: string) => {
    setSelectedNames(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNames.size === filteredFiles.length) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(filteredFiles.map(f => f.name)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedBucket || selectedNames.size === 0) return;
    setBulkDeleting(true);
    const paths = Array.from(selectedNames).map(n => getFullPath(n));
    const { error } = await supabase.storage.from(selectedBucket).remove(paths);
    setBulkDeleting(false);
    if (error) {
      toast.error(isAr ? 'خطأ في حذف الملفات' : 'Error deleting files');
    } else {
      toast.success(isAr ? `تم حذف ${selectedNames.size} ملف` : `${selectedNames.size} file(s) deleted`);
      setFiles(prev => prev.filter(f => !selectedNames.has(f.name)));
      if (selectedFile && selectedNames.has(selectedFile.name)) setSelectedFile(null);
      setSelectedNames(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (!selectedBucket || selectedNames.size === 0) return;
    setBulkDownloading(true);
    const names = Array.from(selectedNames);
    for (let i = 0; i < names.length; i++) {
      await handleDownload(names[i]);
      if (i < names.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    setBulkDownloading(false);
    toast.success(isAr ? `تم تحميل ${names.length} ملف` : `${names.length} file(s) downloaded`);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = folders.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  const currentBucket = BUCKETS.find(b => b.id === selectedBucket);
  const hasSelection = selectedNames.size > 0;
  const allSelected = filteredFiles.length > 0 && selectedNames.size === filteredFiles.length;
  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-primary" />
          {isAr ? 'مدير الوسائط' : 'Media Manager'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? 'تصفح وإدارة ملفات التخزين' : 'Browse and manage storage files'}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left: Folder list */}
        <div className="w-56 shrink-0 rounded-lg border border-border bg-muted/40 p-3">
          <nav className="space-y-1">
            <TooltipProvider delayDuration={300}>
            {BUCKETS.map(bucket => (
              <button
                key={bucket.id}
                onClick={() => fetchFiles(bucket.id, '')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-start ${
                  selectedBucket === bucket.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <FolderOpen className={`h-4 w-4 shrink-0 ${selectedBucket === bucket.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="flex-1 truncate">{bucket.name}</span>
                {bucket.public ? (
                  <Tooltip>
                    <TooltipTrigger asChild><Globe className="h-3 w-3 text-muted-foreground shrink-0" /></TooltipTrigger>
                    <TooltipContent>{isAr ? 'ملفات عامة' : 'Public files'}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild><Lock className="h-3 w-3 text-muted-foreground shrink-0" /></TooltipTrigger>
                    <TooltipContent>{isAr ? 'ملفات خاصة' : 'Private files'}</TooltipContent>
                  </Tooltip>
                )}
              </button>
            ))}
            </TooltipProvider>
          </nav>
        </div>

        {/* Right: Content area */}
        <div className="flex-1 min-w-0">
          {!selectedBucket ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isAr ? 'اختر مجلداً من القائمة' : 'Select a folder from the list'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bucket info */}
              {currentBucket && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{currentBucket.name}</span>
                        {currentBucket.public ? (
                          <Badge variant="outline" className="text-[10px] gap-0.5"><Globe className="h-2.5 w-2.5" />{isAr ? 'عام' : 'Public'}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-0.5"><Lock className="h-2.5 w-2.5" />{isAr ? 'خاص' : 'Private'}</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{filteredFiles.length} {isAr ? 'ملف' : 'files'}</Badge>
                        {filteredFolders.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">{filteredFolders.length} {isAr ? 'مجلد' : 'folders'}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{isAr ? currentBucket.descriptionAr : currentBucket.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Breadcrumb navigation */}
              {currentPath && (
                <div className="flex items-center gap-1 text-sm overflow-x-auto">
                  <button
                    onClick={() => fetchFiles(selectedBucket, '')}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    {selectedBucket}
                  </button>
                  {breadcrumbs.map((part, i) => (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <button
                        onClick={() => fetchFiles(selectedBucket, breadcrumbs.slice(0, i + 1).join('/'))}
                        className={`transition-colors ${i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={isAr ? 'بحث...' : 'Search files...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
                <Button size="sm" className="h-9 gap-1.5" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع ملف' : 'Upload')}
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setNewFolderOpen(true)}>
                  <FolderPlus className="h-3.5 w-3.5" />
                  {isAr ? 'مجلد جديد' : 'New Folder'}
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={() => fetchFiles(selectedBucket, currentPath)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Bulk action bar */}
              {hasSelection && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {selectedNames.size} {isAr ? 'محدد' : 'selected'}
                  </Badge>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleBulkDownload} disabled={bulkDownloading}>
                    <Download className="h-3 w-3" />
                    {bulkDownloading ? (isAr ? 'جاري التحميل...' : 'Downloading...') : (isAr ? 'تحميل الكل' : 'Download All')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" disabled={bulkDeleting}>
                        <Trash2 className="h-3 w-3" />
                        {bulkDeleting ? (isAr ? 'جاري الحذف...' : 'Deleting...') : (isAr ? 'حذف الكل' : 'Delete All')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isAr ? 'حذف ملفات متعددة' : 'Delete Multiple Files'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isAr
                            ? `هل أنت متأكد من حذف ${selectedNames.size} ملف؟ لا يمكن التراجع عن هذا الإجراء.`
                            : `Are you sure you want to delete ${selectedNames.size} file(s)? This action cannot be undone.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isAr ? 'حذف' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelectedNames(new Set())}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* File list + detail */}
              <div className="flex gap-4">
                <Card
                  className={`flex-1 min-w-0 relative transition-colors ${isDragging ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
                      <Upload className="h-10 w-10 text-primary mb-2 animate-bounce" />
                      <p className="text-sm font-medium text-primary">{isAr ? 'أفلت الملفات هنا' : 'Drop files here'}</p>
                    </div>
                  )}
                  <CardContent className="p-3">
                    {loading ? (
                      <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}</div>
                    ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>{isAr ? 'لا توجد ملفات أو مجلدات' : 'No files or folders found'}</p>
                        <p className="text-xs mt-1">{isAr ? 'اسحب ملفات هنا أو اضغط "رفع ملف"' : 'Drag files here or click "Upload"'}</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {/* Back row */}
                        {currentPath && (
                          <button
                            onClick={navigateUp}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                          >
                            <div className="h-8 w-8 rounded flex items-center justify-center bg-muted/50 flex-shrink-0">
                              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                            </div>
                            <span className="text-sm">..</span>
                          </button>
                        )}

                        {/* Folders */}
                        {filteredFolders.map(folder => (
                          <button
                            key={`folder-${folder}`}
                            onClick={() => navigateToFolder(folder)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className="h-8 w-8 rounded flex items-center justify-center bg-primary/10 flex-shrink-0">
                              <FolderOpen className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium flex-1 text-start truncate">{folder}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </button>
                        ))}

                        {/* Select all header (only if files exist) */}
                        {filteredFiles.length > 0 && (
                          <div className="flex items-center gap-3 p-2 border-b border-border mb-1 mt-1">
                            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="shrink-0" />
                            <span className="text-xs text-muted-foreground font-medium">{isAr ? 'تحديد الكل' : 'Select all'}</span>
                          </div>
                        )}

                        {/* Files */}
                        {filteredFiles.map((file, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedFile(file)}
                            onDoubleClick={() => handleDownload(file.name)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${
                              selectedFile?.name === file.name ? 'bg-primary/10 border border-primary/20' : selectedNames.has(file.name) ? 'bg-muted/70' : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedNames.has(file.name)}
                              onCheckedChange={() => toggleSelect(file.name)}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            />
                            {isImageFile(file.name) && currentBucket?.public ? (
                              <div className="h-8 w-8 rounded overflow-hidden border border-border flex-shrink-0 bg-muted">
                                <img src={getPublicUrl(file.name)} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded flex items-center justify-center bg-muted/50 flex-shrink-0">
                                {isImageFile(file.name) ? <Image className="h-3.5 w-3.5 text-primary" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                            )}
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">{getFileExt(file.name)}</Badge>
                            <span className="text-[11px] text-muted-foreground shrink-0">{formatSize(file.metadata?.size)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* File detail panel - always visible */}
                <Card className="w-80 shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{isAr ? 'تفاصيل الملف' : 'File Details'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedFile ? (
                      <>
                        {isImageFile(selectedFile.name) && currentBucket?.public && (
                          <button
                            type="button"
                            onClick={() => setLightboxOpen(true)}
                            className="relative w-full rounded-lg overflow-hidden border border-border bg-muted group cursor-zoom-in"
                          >
                            <img
                              src={getPublicUrl(selectedFile.name)}
                              alt={selectedFile.name}
                              className="w-full h-auto max-h-72 object-contain"
                            />
                            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                              <Maximize2 className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                          </button>
                        )}
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">{isAr ? 'الاسم' : 'Name'}</span>
                            <p className="font-medium break-all mt-0.5">{selectedFile.name}</p>
                          </div>
                          {currentPath && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'المسار' : 'Path'}</span>
                              <p className="font-medium break-all mt-0.5 font-mono text-[10px]">{currentPath}/</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">{isAr ? 'الحجم' : 'Size'}</span>
                            <p className="font-medium mt-0.5">{formatSize(selectedFile.metadata?.size)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isAr ? 'الصيغة' : 'Format'}</span>
                            <p className="font-medium mt-0.5"><Badge variant="outline" className="text-[10px] font-mono">{getFileExt(selectedFile.name)}</Badge></p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isAr ? 'النوع' : 'MIME Type'}</span>
                            <p className="font-medium mt-0.5">{selectedFile.metadata?.mimetype || '—'}</p>
                          </div>
                          {selectedFile.created_at && (
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'تاريخ الإنشاء' : 'Created'}</span>
                              <p className="font-medium mt-0.5">{new Date(selectedFile.created_at).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 pt-2">
                          <Button variant="default" size="sm" className="w-full gap-1.5 text-xs" onClick={() => handleDownload(selectedFile.name)}>
                            <Download className="h-3 w-3" />{isAr ? 'تحميل' : 'Download'}
                          </Button>
                          {currentBucket?.public && (
                            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => window.open(getPublicUrl(selectedFile.name), '_blank')}>
                              <ExternalLink className="h-3 w-3" />{isAr ? 'فتح' : 'Open'}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />{isAr ? 'حذف' : 'Delete'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{isAr ? 'حذف الملف' : 'Delete File'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isAr ? `هل أنت متأكد من حذف "${selectedFile.name}"؟` : `Are you sure you want to delete "${selectedFile.name}"?`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(selectedFile.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {isAr ? 'حذف' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Image className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm">{isAr ? 'لم يتم تحديد ملف' : 'No file selected'}</p>
                        <p className="text-xs mt-1 opacity-60">{isAr ? 'اضغط على ملف لعرض التفاصيل' : 'Click a file to view details'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      {selectedFile && isImageFile(selectedFile.name) && currentBucket?.public && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
              <img
                src={getPublicUrl(selectedFile.name)}
                alt={selectedFile.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-sm text-muted-foreground truncate max-w-[60%]">{selectedFile.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleDownload(selectedFile.name)}>
                  <Download className="h-3 w-3" />{isAr ? 'تحميل' : 'Download'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(getPublicUrl(selectedFile.name), '_blank')}>
                  <ExternalLink className="h-3 w-3" />{isAr ? 'فتح' : 'Open'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              {isAr ? 'مجلد جديد' : 'New Folder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{isAr ? 'اسم المجلد' : 'Folder Name'}</Label>
            <Input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder={isAr ? 'أدخل اسم المجلد...' : 'Enter folder name...'}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>
              <FolderPlus className="h-4 w-4 me-1" />
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Media;
