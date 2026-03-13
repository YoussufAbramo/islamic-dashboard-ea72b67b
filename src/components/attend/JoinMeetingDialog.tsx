import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, X, Check, Link2, Plus, Video, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';

type JoinMethod = 'vconnct' | 'google_meet' | 'zoom' | 'dashboard';

interface MeetingEntry {
  google_meet_url: string;
  zoom_url: string;
}

interface JoinMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MeetingEntry | null;
  entryId?: string;
  isAr: boolean;
  onSessionStart?: () => void;
  onPlatformSelected?: (platform: string) => void;
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

const platforms: { id: JoinMethod; label: string; labelAr: string; icon: string; iconType: 'img' | 'lucide' }[] = [
  { id: 'dashboard', label: 'CodeCom Meeting', labelAr: 'اجتماع كودكوم', icon: 'video', iconType: 'lucide' },
  { id: 'google_meet', label: 'Google Meet', labelAr: 'Google Meet', icon: '/system/logos/google-meet.png', iconType: 'img' },
  { id: 'zoom', label: 'Zoom', labelAr: 'Zoom', icon: '/system/logos/zoom.png', iconType: 'img' },
  { id: 'vconnct', label: 'Vconnct', labelAr: 'Vconnct', icon: '/system/logos/vconnct.ico', iconType: 'img' },
];

const JoinMeetingDialog = ({ open, onOpenChange, entry, entryId, isAr, onSessionStart, onPlatformSelected }: JoinMeetingDialogProps) => {
  const [selected, setSelected] = useState<JoinMethod | null>(null);
  const [vconnctUrl, setVconnctUrl] = useState('');
  const [iframeOpen, setIframeOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [dashboardMeetingOpen, setDashboardMeetingOpen] = useState(false);
  const [MeetingComponent, setMeetingComponent] = useState<ComponentType<any> | null>(null);

  // Dynamically load DashboardMeeting when needed
  useEffect(() => {
    if (dashboardMeetingOpen && !MeetingComponent) {
      import('./DashboardMeeting').then(mod => setMeetingComponent(() => mod.default));
    }
  }, [dashboardMeetingOpen, MeetingComponent]);

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelected(null);
      setVconnctUrl('');
    }
    onOpenChange(val);
  };

  const isPlatformAvailable = (id: JoinMethod): boolean => {
    if (id === 'dashboard') return false; // CodeCom Meeting disabled (coming soon)
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
    if (!selected) return;

    onPlatformSelected?.(selected);

    if (selected === 'dashboard') {
      setDashboardMeetingOpen(true);
      onSessionStart?.();
      handleClose(false);
      return;
    }

    if (!entry) return;

    if (selected === 'google_meet') {
      if (!entry.google_meet_url) {
        toast.error(isAr ? 'لم يتم إعداد رابط Google Meet' : 'Google Meet URL not configured');
        return;
      }
      window.open(entry.google_meet_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Google Meet' : 'Opening Google Meet');
      onSessionStart?.();
      handleClose(false);
    } else if (selected === 'zoom') {
      if (!entry.zoom_url) {
        toast.error(isAr ? 'لم يتم إعداد رابط Zoom' : 'Zoom URL not configured');
        return;
      }
      window.open(entry.zoom_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Zoom' : 'Opening Zoom');
      onSessionStart?.();
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
      onSessionStart?.();
      handleClose(false);
    }
  };

  const canJoin = (): boolean => {
    if (!selected) return false;
    if (selected === 'dashboard') return !!entryId;
    if (selected === 'vconnct') return !!vconnctUrl.trim();
    return isPlatformAvailable(selected);
  };

  const renderPlatformIcon = (p: typeof platforms[0]) => {
    if (p.iconType === 'lucide') {
      return (
        <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
          <Video className="h-4 w-4 text-primary" />
        </div>
      );
    }
    return <img src={p.icon} alt={p.label} className="h-7 w-7 shrink-0 rounded" />;
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

              if (p.id === 'vconnct') {
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected('vconnct')}
                    className={cn(
                      'w-full rounded-xl border transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'bg-card hover:bg-accent/50 border-border'
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {renderPlatformIcon(p)}
                      <div className="text-start flex-1 min-w-0">
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isAr ? 'حضور داخل المنصة' : 'Attend in-platform'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="url"
                              placeholder={isAr ? 'https://vconnct.us/...' : 'https://vconnct.us/...'}
                              value={vconnctUrl}
                              onChange={(e) => setVconnctUrl(e.target.value)}
                              className="h-9 text-xs ps-8"
                              autoFocus
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 shrink-0"
                            title={isAr ? 'إنشاء رابط اجتماع جديد' : 'Create a new meeting URL'}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open('https://dashboard.vconnct.me/', '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

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
                  {renderPlatformIcon(p)}
                  <div className="text-start flex-1 min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      {isAr ? p.labelAr : p.label}
                      {p.id === 'dashboard' && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Soon</Badge>}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {p.id === 'dashboard'
                        ? (isAr ? 'مكالمة فيديو مباشرة داخل المنصة' : 'Direct video call inside the dashboard')
                        : url
                        ? (isAr ? `سيتم التوجيه إلى ${p.label}` : `You will be redirected to ${p.label}`)
                        : (isAr ? 'لم يتم الإعداد' : 'Not configured')}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Join button */}
          <Button
            className="w-full gap-2 mt-1"
            disabled={!canJoin()}
            onClick={handleJoin}
          >
            {selected === 'vconnct' || selected === 'dashboard' ? null : <ExternalLink className="h-4 w-4" />}
            {selected === 'dashboard'
              ? (isAr ? 'بدء الاجتماع' : 'Start Meeting')
              : (isAr ? 'انضمام' : 'Join Meeting')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Vconnct Iframe Modal */}
      <Dialog open={iframeOpen} onOpenChange={(val) => { if (!val) { setIframeOpen(false); setIframeSrc(''); } }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <img src="/system/logos/vconnct.ico" alt="Vconnct" className="h-5 w-5 rounded" />
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

      {/* Dashboard Meeting (WebRTC) */}
      {entryId && dashboardMeetingOpen && MeetingComponent && (
        <MeetingComponent
          open={dashboardMeetingOpen}
          onOpenChange={setDashboardMeetingOpen}
          entryId={entryId}
          isAr={isAr}
        />
      )}
    </>
  );
};

export default JoinMeetingDialog;
