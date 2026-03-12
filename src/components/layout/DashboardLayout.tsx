import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import CopyrightText from '@/components/CopyrightText';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const DashboardSkeleton = () =>
<div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) =>
    <Skeleton key={i} className="h-28 rounded-lg" />
    )}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>;


const WhatsAppIcon = () =>
<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>;


const FloatingButtons = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [ticketOpen, setTicketOpen] = useState(false);

  const whatsappUrl = `https://wa.me/201558612808?text=${encodeURIComponent("Hello Dear, I'm texting you regarding Quran.CodeCom.dev, are you available to talk?")}`;

  return (
    <>
      <div className={`fixed z-50 flex items-center gap-2 animate-fade-in ${isAr ? 'left-5' : 'right-5'}`} style={{ bottom: '35px', animationDelay: '0.5s', animationFillMode: 'backwards' }}>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTicketOpen(true)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-muted-foreground shadow-md hover:scale-110 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <Bug className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isAr ? 'الإبلاغ عن خطأ' : 'Report a Bug'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-muted-foreground shadow-md hover:scale-110 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <WhatsAppIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isAr ? 'تواصل مع المبيعات' : 'Contact Sales'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-[640px] p-0 overflow-hidden border-none [&>button]:z-10">
          <iframe
            src="https://portal.codecom.dev/forms/ticket"
            width="100%"
            height="850"
            frameBorder="0"
            allowFullScreen
            className="rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>);

};

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
              {[...Array(8)].map((_, i) =>
              <Skeleton key={i} className="h-8 w-full" />
              )}
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
      </div>);

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
          <footer className="p-3 border-t border-border flex items-center justify-between gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href="https://codecom.dev" target="_blank" rel="noopener noreferrer">
                    <img src="/codecom-logo.png" alt="CodeCom.dev" className="h-5 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>{dir === 'rtl' ? 'تم تطوير هذا النظام بواسطة CodeCom.dev' : 'This Software is Developed By CodeCom.dev'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CopyrightText
              className="text-[11px] text-muted-foreground/60"
              linkClassName="hover:text-foreground transition-colors no-underline" />
            
          </footer>
        </SidebarInset>
        <FloatingButtons />
      </div>
    </SidebarProvider>);

};

export default DashboardLayout;