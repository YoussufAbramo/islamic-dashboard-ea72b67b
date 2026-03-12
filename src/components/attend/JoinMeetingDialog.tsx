import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type JoinMethod = 'vconnct' | 'google_meet' | 'zoom';

interface MeetingEntry {
  google_meet_url: string;
  zoom_url: string;
}

interface JoinMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MeetingEntry | null;
  isAr: boolean;
}

const maskUrl = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return `${parsed.protocol}//${host}`;
    const masked = pathParts.map(() => '••••••').join('/');
    return `${parsed.protocol}//${host}/${masked}`;
  } catch {
    return url.substring(0, 15) + '••••••••';
  }
};

const platforms: { id: JoinMethod; label: string; icon: string; iconType: 'img' }[] = [
  { id: 'google_meet', label: 'Google Meet', icon: '/icons/google-meet.png', iconType: 'img' },
  { id: 'zoom', label: 'Zoom', icon: '/icons/zoom.png', iconType: 'img' },
  { id: 'vconnct', label: 'Vconnct', icon: '/icons/vconnct.ico', iconType: 'img' },
];

const JoinMeetingDialog = ({ open, onOpenChange, entry, isAr }: JoinMeetingDialogProps) => {
  const [selected, setSelected] = useState<JoinMethod | null>(null);
  const [vconnctUrl, setVconnctUrl] = useState('');
  const [iframeOpen, setIframeOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelected(null);
      setVconnctUrl('');
    }
    onOpenChange(val);
  };

  const isPlatformAvailable = (id: JoinMethod): boolean => {
    if (!entry) return false;
    if (id === 'google_meet') return !!entry.google_meet_url;
    if (id === 'zoom') return !!entry.zoom_url;
    return true; // vconnct always available (manual URL)
  };

  const getPlatformUrl = (id: JoinMethod): string => {
    if (!entry) return '';
    if (id === 'google_meet') return entry.google_meet_url;
    if (id === 'zoom') return entry.zoom_url;
    return '';
  };

  const handleJoin = () => {
    if (!selected || !entry) return;

    if (selected === 'google_meet') {
      if (!entry.google_meet_url) {
        toast.error(isAr ? 'لم يتم إعداد رابط Google Meet' : 'Google Meet URL not configured');
        return;
      }
      window.open(entry.google_meet_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Google Meet' : 'Opening Google Meet');
      handleClose(false);
    } else if (selected === 'zoom') {
      if (!entry.zoom_url) {
        toast.error(isAr ? 'لم يتم إعداد رابط Zoom' : 'Zoom URL not configured');
        return;
      }
      window.open(entry.zoom_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Zoom' : 'Opening Zoom');
      handleClose(false);
    } else if (selected === 'vconnct') {
      const trimmed = vconnctUrl.trim();
      if (!trimmed) {
        toast.error(isAr ? 'الرجاء إدخال رابط الجلسة' : 'Please enter the session URL');
        return;
      }
      try {
        const parsed = new URL(trimmed);
        if (!parsed.hostname.includes('vconnct')) {
          toast.error(isAr ? 'يرجى إدخال رابط Vconnct صالح' : 'Please enter a valid Vconnct URL');
          return;
        }
      } catch {
        toast.error(isAr ? 'رابط غير صالح' : 'Invalid URL');
        return;
      }
      setIframeSrc(trimmed);
      setIframeOpen(true);
      handleClose(false);
    }
  };

  const canJoin = (): boolean => {
    if (!selected) return false;
    if (selected === 'vconnct') return !!vconnctUrl.trim();
    return isPlatformAvailable(selected);
  };

  return (
    <>
      {/* Platform Selection Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? 'اختر منصة الاجتماع' : 'Select Meeting Platform'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            {platforms.map((p) => {
              const available = isPlatformAvailable(p.id);
              const isSelected = selected === p.id;
              const url = getPlatformUrl(p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => available && setSelected(p.id)}
                  disabled={!available}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'bg-card hover:bg-accent/50 border-border'
                  )}
                >
                  <img src={p.icon} alt={p.label} className="h-7 w-7 shrink-0 rounded" />
                  <div className="text-start flex-1 min-w-0">
                    <p className="text-sm font-semibold">{p.label}</p>
                    {p.id !== 'vconnct' && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {url
                          ? maskUrl(url)
                          : (isAr ? 'لم يتم الإعداد' : 'Not configured')}
                      </p>
                    )}
                    {p.id === 'vconnct' && (
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? 'حضور داخل المنصة' : 'Attend in-platform'}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Vconnct URL input - shown only when Vconnct is selected */}
            {selected === 'vconnct' && (
              <div className="pt-1">
                <Input
                  type="url"
                  placeholder={isAr ? 'https://m2.vconnct.live/...' : 'https://m2.vconnct.live/...'}
                  value={vconnctUrl}
                  onChange={(e) => setVconnctUrl(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Join button */}
          <Button
            className="w-full gap-2 mt-1"
            disabled={!canJoin()}
            onClick={handleJoin}
          >
            {selected === 'vconnct' ? null : <ExternalLink className="h-4 w-4" />}
            {isAr ? 'انضمام' : 'Join Meeting'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Vconnct Iframe Modal */}
      <Dialog open={iframeOpen} onOpenChange={(val) => { if (!val) { setIframeOpen(false); setIframeSrc(''); } }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <img src="/icons/vconnct.ico" alt="Vconnct" className="h-5 w-5 rounded" />
              <span className="text-sm font-semibold">Vconnct</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[300px]">{maskUrl(iframeSrc)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => { setIframeOpen(false); setIframeSrc(''); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <iframe
            src={iframeSrc}
            className="w-full flex-1 border-0"
            style={{ height: 'calc(90vh - 45px)' }}
            allow="camera; microphone; display-capture; autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            title="Vconnct Meeting"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinMeetingDialog;
