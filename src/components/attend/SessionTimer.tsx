import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StopCircle, Timer } from 'lucide-react';

interface SessionTimerProps {
  isActive: boolean;
  onEndSession: (durationSeconds: number) => void;
  isAr: boolean;
}

const formatTimer = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SessionTimer = ({ isActive, onEndSession, isAr }: SessionTimerProps) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onEndSession(elapsed);
  }, [elapsed, onEndSession]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5 border-destructive/30 bg-destructive/5 text-destructive font-mono text-sm px-3 py-1 animate-pulse">
        <Timer className="h-3.5 w-3.5" />
        {formatTimer(elapsed)}
      </Badge>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1.5 h-8"
        onClick={handleEnd}
      >
        <StopCircle className="h-3.5 w-3.5" />
        {isAr ? 'إنهاء الجلسة' : 'End Session'}
      </Button>
    </div>
  );
};

export default SessionTimer;
