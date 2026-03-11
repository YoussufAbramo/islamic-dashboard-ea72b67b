import { useAppSettings } from '@/contexts/AppSettingsContext';
import WebsiteDisabled from '@/pages/WebsiteDisabled';

interface PublicRouteGuardProps {
  children: React.ReactNode;
}

const PublicRouteGuard = ({ children }: PublicRouteGuardProps) => {
  const { websiteMode } = useAppSettings();
  
  if (!websiteMode) {
    return <WebsiteDisabled />;
  }
  
  return <>{children}</>;
};

export default PublicRouteGuard;
