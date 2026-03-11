import { Navigate } from 'react-router-dom';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface WebsiteModeGuardProps {
  children: React.ReactNode;
}

const WebsiteModeGuard = ({ children }: WebsiteModeGuardProps) => {
  const { websiteMode } = useAppSettings();

  if (!websiteMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default WebsiteModeGuard;
