import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowed: string[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowed, children }: RoleGuardProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
