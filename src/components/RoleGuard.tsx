import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface RoleGuardProps {
  allowed: string[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowed, children }: RoleGuardProps) => {
  const { user, loading } = useAuth();
  const [serverRole, setServerRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
      setServerRole(data ?? null);
      setChecking(false);
    };

    verify();
  }, [user]);

  if (loading || checking) {
    return <div className="min-h-[200px] flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  }

  if (!serverRole || !allowed.includes(serverRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
