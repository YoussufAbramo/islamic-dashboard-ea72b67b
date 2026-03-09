import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { COPYRIGHT } from '@/lib/version';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const { dir } = useLanguage();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Loading...</span></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={dir}>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
          <footer className="p-3 text-center border-t border-border">
            <p className="text-[11px] text-muted-foreground/60">{COPYRIGHT}</p>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
