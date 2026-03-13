import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SessionEntry {
  id: string;
  courseTitle: string;
  studentName: string;
  teacherId: string | null;
  studentId: string | null;
  courseId: string | null;
}

interface PendingAttendEntry {
  id: string;
  courseTitle: string;
  studentName: string;
  scheduledAt: string;
  onAttend: () => void;
}

interface SessionContextType {
  activeSessionId: string | null;
  activeEntry: SessionEntry | null;
  sessionStartedAt: string | null;
  pendingAttend: PendingAttendEntry | null;
  startSession: (entry: SessionEntry) => void;
  endSession: () => { durationSeconds: number; startedAt: string } | null;
  clearSession: () => void;
  setPendingAttend: (entry: PendingAttendEntry | null) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<SessionEntry | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [pendingAttend, setPendingAttend] = useState<PendingAttendEntry | null>(null);

  const startSession = useCallback((entry: SessionEntry) => {
    setActiveSessionId(entry.id);
    setActiveEntry(entry);
    setSessionStartedAt(new Date().toISOString());
    setPendingAttend(null);
  }, []);

  const endSession = useCallback(() => {
    if (!sessionStartedAt) return null;
    const durationSeconds = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
    return { durationSeconds, startedAt: sessionStartedAt };
  }, [sessionStartedAt]);

  const clearSession = useCallback(() => {
    setActiveSessionId(null);
    setActiveEntry(null);
    setSessionStartedAt(null);
  }, []);

  return (
    <SessionContext.Provider value={{
      activeSessionId,
      activeEntry,
      sessionStartedAt,
      pendingAttend,
      startSession,
      endSession,
      clearSession,
      setPendingAttend,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
