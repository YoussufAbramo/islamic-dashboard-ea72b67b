import { Buffer } from 'buffer';
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Loader2, WifiOff, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Peer from 'simple-peer';

interface DashboardMeetingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  isAr: boolean;
}

type ConnectionState = 'waiting' | 'connecting' | 'connected' | 'failed';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const DashboardMeeting = ({ open, onOpenChange, entryId, isAr }: DashboardMeetingProps) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [connState, setConnState] = useState<ConnectionState>('waiting');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isInitiatorRef = useRef(false);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setConnState('waiting');
    setSharing(false);
  }, []);

  const createPeer = useCallback((initiator: boolean, stream: MediaStream) => {
    const peer = new Peer({
      initiator,
      stream,
      trickle: true,
      config: { iceServers: ICE_SERVERS },
    });

    peer.on('signal', (data) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { signal: data },
      });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (mountedRef.current) setConnState('connected');
    });

    peer.on('connect', () => {
      if (mountedRef.current) setConnState('connected');
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (mountedRef.current) setConnState('failed');
    });

    peer.on('close', () => {
      if (mountedRef.current) {
        toast.info(isAr ? 'انتهت المكالمة' : 'Call ended');
        setConnState('waiting');
      }
    });

    return peer;
  }, [isAr]);

  // Initialize media + signaling channel
  useEffect(() => {
    if (!open || !entryId) return;
    mountedRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join Supabase Realtime channel for signaling
        const channel = supabase.channel(`meeting:${entryId}`, {
          config: { broadcast: { self: false } },
        });

        channelRef.current = channel;

        channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
          if (!peerRef.current) {
            // Received a signal but no peer yet — we are the responder
            isInitiatorRef.current = false;
            const peer = createPeer(false, localStreamRef.current!);
            peerRef.current = peer;
            setConnState('connecting');
            peer.signal(payload.signal);
          } else {
            peerRef.current.signal(payload.signal);
          }
        });

        channel.on('broadcast', { event: 'join' }, () => {
          // Another user joined — become initiator if no peer yet
          if (!peerRef.current && localStreamRef.current) {
            isInitiatorRef.current = true;
            const peer = createPeer(true, localStreamRef.current);
            peerRef.current = peer;
            setConnState('connecting');
          }
        });

        channel.on('broadcast', { event: 'leave' }, () => {
          peerRef.current?.destroy();
          peerRef.current = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          if (mountedRef.current) {
            setConnState('waiting');
            toast.info(isAr ? 'غادر الطرف الآخر' : 'The other participant left');
          }
        });

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Broadcast our join so the other party can initiate
            channel.send({ type: 'broadcast', event: 'join', payload: {} });
          }
        });
      } catch (err: any) {
        console.error('Media error:', err);
        toast.error(isAr ? 'تعذر الوصول إلى الكاميرا/الميكروفون' : 'Could not access camera/microphone');
      }
    };

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      cleanup();
    };
  }, [open, entryId, createPeer, cleanup, isAr]);

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const toggleScreen = async () => {
    if (sharing) {
      // Stop sharing — restore camera
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack && peerRef.current) {
        const sender = (peerRef.current as any)._pc?.getSenders?.()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      }
      setSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      if (peerRef.current) {
        const sender = (peerRef.current as any)._pc?.getSenders?.()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack && peerRef.current) {
          const sender = (peerRef.current as any)._pc?.getSenders?.()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        }
        setSharing(false);
      };

      setSharing(true);
    } catch {
      // User cancelled screen picker
    }
  };

  const handleEnd = () => {
    channelRef.current?.send({ type: 'broadcast', event: 'leave', payload: {} });
    cleanup();
    onOpenChange(false);
  };

  const stateLabel: Record<ConnectionState, { en: string; ar: string }> = {
    waiting: { en: 'Waiting for participant...', ar: 'في انتظار المشارك...' },
    connecting: { en: 'Connecting...', ar: 'جاري الاتصال...' },
    connected: { en: 'Connected', ar: 'متصل' },
    failed: { en: 'Connection failed', ar: 'فشل الاتصال' },
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleEnd(); }}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-black/95">
        {/* Connection status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-background/10 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground/90">
              {isAr ? 'اجتماع المنصة' : 'Dashboard Meeting'}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`gap-1.5 text-[10px] ${
              connState === 'connected'
                ? 'border-emerald-500/40 text-emerald-400'
                : connState === 'failed'
                ? 'border-destructive/40 text-destructive'
                : 'border-muted-foreground/30 text-muted-foreground'
            }`}
          >
            {connState === 'connected' ? <Wifi className="h-3 w-3" /> :
             connState === 'failed' ? <WifiOff className="h-3 w-3" /> :
             <Loader2 className="h-3 w-3 animate-spin" />}
            {isAr ? stateLabel[connState].ar : stateLabel[connState].en}
          </Badge>
        </div>

        {/* Video area */}
        <div className="flex-1 relative min-h-0">
          {/* Remote video (full) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Waiting overlay */}
          {connState !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center space-y-3">
                {connState === 'failed' ? (
                  <WifiOff className="h-12 w-12 mx-auto text-destructive/70" />
                ) : (
                  <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                )}
                <p className="text-sm text-muted-foreground">
                  {isAr ? stateLabel[connState].ar : stateLabel[connState].en}
                </p>
              </div>
            </div>
          )}

          {/* Local video (PiP corner) */}
          <div className="absolute bottom-20 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-border/30 shadow-xl bg-black z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-background/10 backdrop-blur-sm border-t border-border/20">
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full h-11 w-11 border-border/30 ${micOn ? 'bg-background/20 hover:bg-background/30 text-foreground/90' : 'bg-destructive/80 hover:bg-destructive text-destructive-foreground'}`}
            onClick={toggleMic}
            title={micOn ? (isAr ? 'كتم الصوت' : 'Mute') : (isAr ? 'إلغاء الكتم' : 'Unmute')}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`rounded-full h-11 w-11 border-border/30 ${camOn ? 'bg-background/20 hover:bg-background/30 text-foreground/90' : 'bg-destructive/80 hover:bg-destructive text-destructive-foreground'}`}
            onClick={toggleCam}
            title={camOn ? (isAr ? 'إيقاف الكاميرا' : 'Turn off camera') : (isAr ? 'تشغيل الكاميرا' : 'Turn on camera')}
          >
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`rounded-full h-11 w-11 border-border/30 ${sharing ? 'bg-primary/80 hover:bg-primary text-primary-foreground' : 'bg-background/20 hover:bg-background/30 text-foreground/90'}`}
            onClick={toggleScreen}
            disabled={connState !== 'connected'}
            title={isAr ? 'مشاركة الشاشة' : 'Share screen'}
          >
            <MonitorUp className="h-5 w-5" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={handleEnd}
            title={isAr ? 'إنهاء المكالمة' : 'End call'}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardMeeting;
