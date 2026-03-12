import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MEDIA_BUCKET, MEDIA_PATHS } from '@/lib/mediaStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderOpen, Image, FileText, Upload, Search, HardDrive, Lock, RefreshCw,
  Trash2, Download, CheckSquare, X, ChevronRight, ChevronDown, FolderPlus,
  Maximize2, Loader2, ExternalLink, Info, Music, Video, File as FileIcon, Play
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// ─── Types ──────────────────────────────────────────────────
interface FileObject {
  name: string;
  id?: string | null;
  created_at?: string;
  metadata?: { size?: number; mimetype?: string } | null;
}

interface FolderNode {
  name: string;
  path: string;
  label: string;
  labelAr: string;
  children: FolderNode[];
  acceptedTypes?: string; // file input accept attribute
  icon?: 'image' | 'pdf' | 'audio' | 'video' | 'file';
}

// ─── Constants ──────────────────────────────────────────────
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const PDF_EXTS = ['pdf'];
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

/** Predefined folder tree for the media bucket */
const MEDIA_TREE: FolderNode[] = [
  { name: 'avatars', path: 'avatars', label: 'Avatars', labelAr: 'الصور الشخصية', children: [], acceptedTypes: 'image/*', icon: 'image' },
  {
    name: 'ebooks', path: 'ebooks', label: 'E-books', labelAr: 'الكتب الإلكترونية', children: [
      { name: 'pdf', path: 'ebooks/pdf', label: 'PDF Files', labelAr: 'ملفات PDF', children: [], acceptedTypes: '.pdf', icon: 'pdf' },
      { name: 'covers', path: 'ebooks/covers', label: 'Covers', labelAr: 'أغلفة الكتب', children: [], acceptedTypes: 'image/*', icon: 'image' },
    ]
  },
  {
    name: 'courses', path: 'courses', label: 'Courses', labelAr: 'الدورات', children: [
      { name: 'images', path: 'courses/images', label: 'Images', labelAr: 'الصور', children: [], acceptedTypes: 'image/*', icon: 'image' },
      { name: 'pdf', path: 'courses/pdf', label: 'PDF Files', labelAr: 'ملفات PDF', children: [], acceptedTypes: '.pdf', icon: 'pdf' },
      { name: 'audio', path: 'courses/audio', label: 'Audio', labelAr: 'الصوتيات', children: [], acceptedTypes: 'audio/*', icon: 'audio' },
      { name: 'video', path: 'courses/video', label: 'Video', labelAr: 'الفيديوهات', children: [], acceptedTypes: 'video/*', icon: 'video' },
    ]
  },
  { name: 'certificates', path: 'certificates', label: 'Certificates', labelAr: 'الشهادات', children: [], acceptedTypes: 'image/*,.pdf', icon: 'file' },
  { name: 'contracts', path: 'contracts', label: 'Contracts', labelAr: 'العقود', children: [], acceptedTypes: '.pdf,.doc,.docx', icon: 'pdf' },
  { name: 'cv', path: 'cv', label: 'CV / Resumes', labelAr: 'السير الذاتية', children: [], acceptedTypes: '.pdf,.doc,.docx', icon: 'pdf' },
  { name: 'system', path: 'system', label: 'System', labelAr: 'النظام', children: [] },
  {
    name: 'website', path: 'website', label: 'Website', labelAr: 'الموقع', children: [
      { name: 'blogs', path: 'website/blogs', label: 'Blog Media', labelAr: 'وسائط المدونة', children: [], acceptedTypes: 'image/*', icon: 'image' },
      { name: 'pages', path: 'website/pages', label: 'Page Media', labelAr: 'وسائط الصفحات', children: [], acceptedTypes: 'image/*', icon: 'image' },
      { name: 'other', path: 'website/other', label: 'Other', labelAr: 'أخرى', children: [] },
    ]
  },
];

/** Flatten tree to find a node by path */
function findNode(nodes: FolderNode[], path: string): FolderNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findNode(n.children, path);
    if (found) return found;
  }
  return null;
}

/** Validate path to prevent traversal attacks */
function isValidPath(path: string): boolean {
  if (!path) return true;
  if (path.includes('..') || path.includes('//') || path.startsWith('/') || path.includes('\\')) return false;
  return /^[a-zA-Z0-9/_\-. ]+$/.test(path);
}

function getFileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}
function getFileExtUpper(name: string): string {
  return getFileExt(name).toUpperCase() || '—';
}
function isImageFile(name: string) { return IMAGE_EXTS.includes(getFileExt(name)); }
function isPdfFile(name: string) { return PDF_EXTS.includes(getFileExt(name)); }
function isAudioFile(name: string) { return AUDIO_EXTS.includes(getFileExt(name)); }
function isVideoFile(name: string) { return VIDEO_EXTS.includes(getFileExt(name)); }

function getFileIcon(name: string) {
  if (isImageFile(name)) return <Image className="h-3.5 w-3.5 text-emerald-500" />;
  if (isPdfFile(name)) return <FileText className="h-3.5 w-3.5 text-red-500" />;
  if (isAudioFile(name)) return <Music className="h-3.5 w-3.5 text-violet-500" />;
  if (isVideoFile(name)) return <Video className="h-3.5 w-3.5 text-blue-500" />;
  return <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function getFolderIcon(node?: FolderNode | null) {
  if (!node?.icon) return <FolderOpen className="h-4 w-4 text-primary" />;
  switch (node.icon) {
    case 'image': return <Image className="h-4 w-4 text-emerald-500" />;
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
    case 'audio': return <Music className="h-4 w-4 text-violet-500" />;
    case 'video': return <Video className="h-4 w-4 text-blue-500" />;
    default: return <FolderOpen className="h-4 w-4 text-primary" />;
  }
}

function formatSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Sidebar Tree Item ──────────────────────────────────────
function TreeItem({
  node, activePath, onSelect, expandedPaths, toggleExpand, isAr, depth = 0
}: {
  node: FolderNode; activePath: string; onSelect: (path: string) => void;
  expandedPaths: Set<string>; toggleExpand: (path: string) => void; isAr: boolean; depth?: number;
}) {
  const hasChildren = node.children.length > 0;
  const isActive = activePath === node.path;
  const isExpanded = expandedPaths.has(node.path);
  const isParentOfActive = activePath.startsWith(node.path + '/');

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path);
          if (hasChildren && !isExpanded) toggleExpand(node.path);
        }}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all text-start ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : isParentOfActive
            ? 'text-primary/80'
            : 'hover:bg-muted text-foreground'
        }`}
        style={{ paddingInlineStart: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); toggleExpand(node.path); }}
            className="p-0.5 hover:bg-muted rounded shrink-0"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {isActive || isParentOfActive ? getFolderIcon(node) : <FolderOpen className="h-4 w-4 text-muted-foreground" />}
        <span className="truncate flex-1">{isAr ? node.labelAr : node.label}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.path}
              node={child}
              activePath={activePath}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              isAr={isAr}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
const Media = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [currentPath, setCurrentPath] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['ebooks', 'courses', 'website']));
  const [dynamicFolders, setDynamicFolders] = useState<string[]>([]); // folders discovered but not in tree
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const currentNode = useMemo(() => findNode(MEDIA_TREE, currentPath), [currentPath]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  // ─── Data fetching ──────────────────────────────────────
  const fetchFiles = useCallback(async (path: string) => {
    if (!isValidPath(path)) {
      toast.error('Invalid path');
      return;
    }
    setLoading(true);
    setCurrentPath(path);
    setSelectedFile(null);
    setPreviewUrl('');
    setSelectedNames(new Set());
    setDynamicFolders([]);

    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(path || undefined, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      toast.error(isAr ? 'خطأ في تحميل الملفات' : 'Error loading files');
      setFiles([]);
      setFolders([]);
    } else {
      const items = data || [];
      const folderItems = items.filter(f => f.id === null);
      const fileItems = items.filter(f => f.id !== null && f.name && f.name !== '.emptyFolderPlaceholder');
      setFolders(folderItems.map(f => f.name));
      setFiles(fileItems);

      // Detect dynamic folders not in the predefined tree
      const knownChildPaths = currentNode?.children.map(c => c.name) || [];
      const extraFolders = folderItems.map(f => f.name).filter(f => !knownChildPaths.includes(f));
      setDynamicFolders(extraFolders);
    }
    setLoading(false);
  }, [isAr, currentNode]);

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    // Auto-expand parent in tree
    setExpandedPaths(prev => {
      const next = new Set(prev);
      next.add(currentPath || '');
      return next;
    });
    fetchFiles(newPath);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  // ─── Uploads ────────────────────────────────────────────
  const getAcceptedTypes = useCallback((): string | undefined => {
    return currentNode?.acceptedTypes || undefined;
  }, [currentNode]);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!fileList.length) return;
    if (!currentPath) {
      toast.error(isAr ? 'اختر مجلداً أولاً' : 'Select a folder first');
      return;
    }
    setUploading(true);
    const counts = { success: 0, fail: 0, skipped: 0 };

    // Validate file types if folder has restrictions
    const accepted = currentNode?.acceptedTypes;
    for (const file of fileList) {
      if (accepted && !matchesAccept(file, accepted)) {
        counts.skipped++;
        continue;
      }
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${currentPath}/${Date.now()}-${sanitized}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (error) counts.fail++; else counts.success++;
    }

    if (counts.success > 0) toast.success(isAr ? `تم رفع ${counts.success} ملف بنجاح` : `${counts.success} file(s) uploaded`);
    if (counts.fail > 0) toast.error(isAr ? `فشل رفع ${counts.fail} ملف` : `${counts.fail} file(s) failed`);
    if (counts.skipped > 0) toast.warning(isAr ? `تم تخطي ${counts.skipped} ملف (نوع غير مقبول)` : `${counts.skipped} file(s) skipped (unsupported type)`);

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    fetchFiles(currentPath);
  }, [currentPath, currentNode, isAr, fetchFiles]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(Array.from(e.target.files));
  };

  // ─── Drag & Drop ───────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items?.length) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0; if (e.dataTransfer.files?.length) uploadFiles(Array.from(e.dataTransfer.files)); }, [uploadFiles]);

  // ─── File operations ───────────────────────────────────
  const getFullPath = (fileName: string) => currentPath ? `${currentPath}/${fileName}` : fileName;

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([getFullPath(fileName)]);
    if (error) toast.error(isAr ? 'خطأ في حذف الملف' : 'Error deleting file');
    else {
      toast.success(isAr ? 'تم حذف الملف' : 'File deleted');
      setFiles(prev => prev.filter(f => f.name !== fileName));
      if (selectedFile?.name === fileName) { setSelectedFile(null); setPreviewUrl(''); }
      setSelectedNames(prev => { const n = new Set(prev); n.delete(fileName); return n; });
    }
  };

  const selectFile = async (file: FileObject | null) => {
    setSelectedFile(file);
    setPreviewUrl('');
    if (!file) return;
    const ext = getFileExt(file.name);
    if (isImageFile(file.name) || isPdfFile(file.name) || isAudioFile(file.name) || isVideoFile(file.name)) {
      const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(getFullPath(file.name), 3600);
      if (data?.signedUrl) setPreviewUrl(data.signedUrl);
    }
  };

  const handleDownload = async (fileName: string) => {
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).download(getFullPath(fileName));
    if (error || !data) { toast.error(isAr ? 'خطأ في تحميل الملف' : 'Error downloading file'); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a'); a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Selection helpers ─────────────────────────────────
  const toggleSelect = (name: string) => {
    setSelectedNames(prev => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedNames(prev => prev.size === filteredFiles.length ? new Set() : new Set(filteredFiles.map(f => f.name)));
  };

  const handleBulkDelete = async () => {
    if (selectedNames.size === 0) return;
    setBulkDeleting(true);
    const paths = Array.from(selectedNames).map(n => getFullPath(n));
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    setBulkDeleting(false);
    if (error) toast.error(isAr ? 'خطأ في حذف الملفات' : 'Error deleting files');
    else {
      toast.success(isAr ? `تم حذف ${selectedNames.size} ملف` : `${selectedNames.size} file(s) deleted`);
      setFiles(prev => prev.filter(f => !selectedNames.has(f.name)));
      if (selectedFile && selectedNames.has(selectedFile.name)) { setSelectedFile(null); setPreviewUrl(''); }
      setSelectedNames(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (selectedNames.size === 0) return;
    setBulkDownloading(true);
    for (const name of Array.from(selectedNames)) {
      await handleDownload(name);
      await new Promise(r => setTimeout(r, 400));
    }
    setBulkDownloading(false);
    toast.success(isAr ? `تم تحميل ${selectedNames.size} ملف` : `${selectedNames.size} file(s) downloaded`);
  };

  // ─── Computed ──────────────────────────────────────────
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = useMemo(() => {
    const s = search.toLowerCase();
    // Show tree-defined subfolders + dynamic discovered folders
    const knownChildren = currentNode?.children.map(c => c.name) || [];
    // Merge: known children + dynamically discovered folders (deduped)
    const allFolders = [...new Set([...knownChildren, ...folders])];
    return allFolders.filter(f => f.toLowerCase().includes(s));
  }, [currentNode, folders, search]);

  // Upload is only allowed in leaf folders (no children) or when inside a subfolder
  const canUpload = !!currentPath && (!currentNode || currentNode.children.length === 0);

  const hasSelection = selectedNames.size > 0;
  const allSelected = filteredFiles.length > 0 && selectedNames.size === filteredFiles.length;
  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-primary" />
          {isAr ? 'مدير الوسائط' : 'Media Manager'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? 'تصفح وإدارة جميع ملفات الوسائط المنظمة' : 'Browse and manage all organized media files'}
        </p>
      </div>

      <div className="flex gap-4 min-w-0 overflow-hidden w-full" style={{ height: 'calc(100vh - 200px)' }}>
        {/* ─── Left Sidebar: Folder Tree ─── */}
        <Card className="w-60 shrink-0 flex flex-col">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              {isAr ? 'المجلدات' : 'Folders'}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 px-2 pb-2">
            <nav className="space-y-0.5 py-1">
              {MEDIA_TREE.map((node, idx) => (
                <div key={node.path}>
                  {idx > 0 && <div className="my-1.5 mx-2 border-t border-border" />}
                  <TreeItem
                    node={node}
                    activePath={currentPath}
                    onSelect={(path) => fetchFiles(path)}
                    expandedPaths={expandedPaths}
                    toggleExpand={toggleExpand}
                    isAr={isAr}
                  />
                </div>
              ))}
            </nav>
          </ScrollArea>
        </Card>

        {/* ─── Right: Content Area ─── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {!currentPath ? (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{isAr ? 'اختر مجلداً من القائمة' : 'Select a folder from the tree'}</p>
                <p className="text-xs mt-1 opacity-60">{isAr ? 'اختر مجلداً لعرض وإدارة الملفات' : 'Choose a folder to browse and manage files'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              {/* Folder info bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 text-sm overflow-x-auto flex-1 min-w-0">
                  <button onClick={() => { setCurrentPath(''); setFiles([]); setFolders([]); }} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    media
                  </button>
                  {breadcrumbs.map((part, i) => (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <button
                        onClick={() => fetchFiles(breadcrumbs.slice(0, i + 1).join('/'))}
                        className={`transition-colors ${i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{filteredFiles.length} {isAr ? 'ملف' : 'files'}</Badge>
                {currentNode?.acceptedTypes && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">{currentNode.acceptedTypes}</Badge>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={isAr ? 'بحث...' : 'Search files...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
                </div>
                <input ref={fileInputRef} type="file" multiple accept={getAcceptedTypes()} className="hidden" onChange={handleUpload} />
                {canUpload && (
                  <Button size="sm" className="h-9 gap-1.5" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع ملف' : 'Upload')}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-9" onClick={() => fetchFiles(currentPath)}>
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

              {/* File list + detail panel */}
              <div className="flex gap-4 min-w-0 overflow-hidden flex-1 min-h-0">
                {/* File list */}
                <Card
                  className={`flex-1 min-w-0 overflow-hidden relative transition-colors ${isDragging ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
                      <Upload className="h-10 w-10 text-primary mb-2 animate-bounce" />
                      <p className="text-sm font-medium text-primary">{isAr ? 'أفلت الملفات هنا' : 'Drop files here'}</p>
                      {currentNode?.acceptedTypes && (
                        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'الأنواع المقبولة:' : 'Accepted:'} {currentNode.acceptedTypes}</p>
                      )}
                    </div>
                  )}
                  <ScrollArea className="h-full">
                    <CardContent className="p-3">
                      {loading ? (
                        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}</div>
                      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>{isAr ? 'لا توجد ملفات أو مجلدات' : 'No files or folders found'}</p>
                          <p className="text-xs mt-1">{isAr ? 'اسحب ملفات هنا أو اضغط "رفع ملف"' : 'Drag files here or click "Upload"'}</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {/* Back row */}
                          {currentPath.includes('/') && (
                            <button onClick={navigateUp} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
                              <div className="h-8 w-8 rounded flex items-center justify-center bg-muted/50 shrink-0"><ChevronRight className="h-3.5 w-3.5 rotate-180" /></div>
                              <span className="text-sm">..</span>
                            </button>
                          )}

                          {/* Folders */}
                          {filteredFolders.map(folder => {
                            const childNode = currentNode?.children.find(c => c.name === folder);
                            return (
                              <button
                                key={`folder-${folder}`}
                                onClick={() => navigateToFolder(folder)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              >
                                <div className="h-8 w-8 rounded flex items-center justify-center bg-primary/10 shrink-0">
                                  {childNode ? getFolderIcon(childNode) : <FolderOpen className="h-4 w-4 text-primary" />}
                                </div>
                                <span className="text-sm font-medium flex-1 text-start truncate">
                                  {childNode ? (isAr ? childNode.labelAr : childNode.label) : folder}
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </button>
                            );
                          })}

                          {/* Select all header */}
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
                              onClick={() => selectFile(file)}
                              onDoubleClick={() => handleDownload(file.name)}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group min-w-0 ${
                                selectedFile?.name === file.name ? 'bg-primary/10 border border-primary/20' : selectedNames.has(file.name) ? 'bg-muted/70' : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox checked={selectedNames.has(file.name)} onCheckedChange={() => toggleSelect(file.name)} onClick={e => e.stopPropagation()} className="shrink-0" />
                              <div className="h-8 w-8 rounded flex items-center justify-center bg-muted/50 shrink-0">
                                {getFileIcon(file.name)}
                              </div>
                              <span className="text-sm truncate min-w-0 flex-1">{file.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">{getFileExtUpper(file.name)}</Badge>
                              <span className="text-[11px] text-muted-foreground shrink-0">{formatSize(file.metadata?.size)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>

                {/* File detail panel */}
                <Card className="w-72 shrink-0 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{isAr ? 'تفاصيل الملف' : 'File Details'}</CardTitle>
                  </CardHeader>
                  <ScrollArea className="flex-1">
                    <CardContent className="space-y-3 pt-0">
                      {selectedFile ? (
                        <>
                          {/* Image preview */}
                          {isImageFile(selectedFile.name) && previewUrl && (
                            <button type="button" onClick={() => setLightboxOpen(true)} className="relative w-full rounded-lg overflow-hidden border border-border bg-muted group cursor-zoom-in">
                              <img src={previewUrl} alt={selectedFile.name} className="w-full h-auto max-h-48 object-contain" />
                              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                                <Maximize2 className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                              </div>
                            </button>
                          )}
                          {/* Audio preview */}
                          {isAudioFile(selectedFile.name) && previewUrl && (
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Music className="h-4 w-4 text-violet-500" />
                                <span className="text-xs font-medium">{isAr ? 'معاينة صوتية' : 'Audio Preview'}</span>
                              </div>
                              <audio controls src={previewUrl} className="w-full h-8" preload="metadata" />
                            </div>
                          )}
                          {/* Video preview */}
                          {isVideoFile(selectedFile.name) && previewUrl && (
                            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                              <video controls src={previewUrl} className="w-full max-h-48" preload="metadata" />
                            </div>
                          )}
                          {/* PDF preview */}
                          {isPdfFile(selectedFile.name) && previewUrl && (
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-red-500" />
                                <span className="text-xs font-medium">PDF</span>
                              </div>
                              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => window.open(previewUrl, '_blank')}>
                                <ExternalLink className="h-3 w-3" />{isAr ? 'فتح PDF' : 'Open PDF'}
                              </Button>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'الاسم' : 'Name'}</span>
                              <p className="font-medium break-all mt-0.5">{selectedFile.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'المسار' : 'Path'}</span>
                              <p className="font-medium break-all mt-0.5 font-mono text-[10px]">{currentPath}/</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'الحجم' : 'Size'}</span>
                              <p className="font-medium mt-0.5">{formatSize(selectedFile.metadata?.size)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{isAr ? 'الصيغة' : 'Format'}</span>
                              <p className="font-medium mt-0.5"><Badge variant="outline" className="text-[10px] font-mono">{getFileExtUpper(selectedFile.name)}</Badge></p>
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

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 pt-2">
                            <Button variant="default" size="sm" className="w-full gap-1.5 text-xs" onClick={() => handleDownload(selectedFile.name)}>
                              <Download className="h-3 w-3" />{isAr ? 'تحميل' : 'Download'}
                            </Button>
                            {previewUrl && (
                              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => window.open(previewUrl, '_blank')}>
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
                  </ScrollArea>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      {selectedFile && isImageFile(selectedFile.name) && previewUrl && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
              <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            </div>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-sm text-muted-foreground truncate max-w-[60%]">{selectedFile.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleDownload(selectedFile.name)}>
                  <Download className="h-3 w-3" />{isAr ? 'تحميل' : 'Download'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="h-3 w-3" />{isAr ? 'فتح' : 'Open'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

/** Check if a File matches an accept string like "image/*,.pdf" */
function matchesAccept(file: File, accept: string): boolean {
  const parts = accept.split(',').map(s => s.trim().toLowerCase());
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const mime = file.type.toLowerCase();
  return parts.some(part => {
    if (part.endsWith('/*')) return mime.startsWith(part.replace('/*', '/'));
    if (part.startsWith('.')) return ext === part;
    return mime === part;
  });
}

export default Media;
