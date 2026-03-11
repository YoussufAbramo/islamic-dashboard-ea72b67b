import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import CopyrightText from '@/components/CopyrightText';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
  <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>
);

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const { dir } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="w-[--sidebar-width] shrink-0 bg-sidebar hidden md:block">
          <div className="p-4 space-y-4">
            <Skeleton className="h-9 w-full" />
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="h-12 border-b border-border flex items-center px-4">
            <Skeleton className="h-8 w-8" />
            <div className="flex gap-2 ms-auto">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={dir}>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
          <footer className="p-3 text-center border-t border-border">
            <CopyrightText
              className="text-[11px] text-muted-foreground/60"
              linkClassName="underline hover:text-foreground transition-colors"
            />
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
