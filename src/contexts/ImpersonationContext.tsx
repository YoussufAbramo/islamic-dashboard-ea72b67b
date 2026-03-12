import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'teacher' | 'student';

interface ImpersonatedUser {
  userId: string;
  role: AppRole;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
}

interface ImpersonationContextType {
  /** Whether impersonation is currently active */
  isImpersonating: boolean;
  /** The impersonated user details (null if not impersonating) */
  impersonatedUser: ImpersonatedUser | null;
  /** The effective role — impersonated role when active, otherwise the real role */
  effectiveRole: AppRole | null;
  /** Start impersonating a user — admin only */
  startImpersonation: (user: ImpersonatedUser) => Promise<void>;
  /** Stop impersonation and return to admin view */
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | null>(null);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const isImpersonating = !!impersonatedUser;
  const effectiveRole = impersonatedUser ? impersonatedUser.role : role;

  const startImpersonation = useCallback(async (target: ImpersonatedUser) => {
    // SECURITY: Only admins can impersonate
    if (role !== 'admin') {
      console.error('Impersonation denied: user is not admin');
      return;
    }

    setImpersonatedUser(target);

    // Log impersonation event to audit_logs
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'IMPERSONATE_START',
        table_name: 'user_roles',
        record_id: target.userId,
        new_data: {
          target_user_id: target.userId,
          target_role: target.role,
          target_name: target.fullName,
        },
      });
    } catch (e) {
      console.error('Failed to log impersonation:', e);
    }
  }, [role, user]);

  const stopImpersonation = useCallback(() => {
    if (!impersonatedUser) return;

    const targetId = impersonatedUser.userId;
    setImpersonatedUser(null);

    // Log stop event
    try {
      supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'IMPERSONATE_STOP',
        table_name: 'user_roles',
        record_id: targetId,
      });
    } catch (e) {
      console.error('Failed to log impersonation stop:', e);
    }
  }, [impersonatedUser, user]);

  return (
    <ImpersonationContext.Provider value={{
      isImpersonating,
      impersonatedUser,
      effectiveRole,
      startImpersonation,
      stopImpersonation,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) throw new Error('useImpersonation must be used within ImpersonationProvider');
  return context;
};
