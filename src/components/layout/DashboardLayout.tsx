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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';

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

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FloatingButtons = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [ticketOpen, setTicketOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', department: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const whatsappUrl = `https://wa.me/201558612808?text=${encodeURIComponent("Hello Dear, I'm texting you regarding Quran.CodeCom.dev, are you available to talk?")}`;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      name: form.name, email: form.email, subject: form.subject,
      message: form.message, department: form.department, priority: form.priority,
      user_id: user?.id,
    });
    setSubmitting(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم إرسال التذكرة بنجاح' : 'Ticket submitted successfully');
    setTicketOpen(false);
    setForm({ name: '', email: '', subject: '', message: '', department: 'general', priority: 'medium' });
  };

  return (
    <>
      <div className="fixed top-1/2 -translate-y-1/2 end-0 z-50 flex flex-col gap-1">
        {/* Support Ticket */}
        <button
          onClick={() => setTicketOpen(true)}
          className="group flex items-center gap-2 pe-2 ps-3 py-2.5 rounded-s-xl rounded-e-none bg-primary text-primary-foreground shadow-md translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 ease-out"
        >
          <Bug className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isAr ? 'الإبلاغ عن خطأ' : 'Report a Bug'}
          </span>
        </button>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 pe-2 ps-3 py-2.5 rounded-s-xl bg-[#128C7E] text-white shadow-md translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 ease-out"
        >
          <WhatsAppIcon />
          <span className="text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isAr ? 'تواصل مع المبيعات' : 'Contact Sales'}
          </span>
        </a>
      </div>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              {isAr ? 'إنشاء تذكرة دعم' : 'Create Support Ticket'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>{isAr ? 'الاسم' : 'Name'}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>{isAr ? 'البريد' : 'Email'}</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div><Label>{isAr ? 'الموضوع' : 'Subject'}</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{isAr ? 'عام' : 'General'}</SelectItem>
                    <SelectItem value="technical">{isAr ? 'تقني' : 'Technical'}</SelectItem>
                    <SelectItem value="billing">{isAr ? 'مالي' : 'Billing'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? 'الأولوية' : 'Priority'}</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isAr ? 'منخفضة' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{isAr ? 'متوسطة' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{isAr ? 'عالية' : 'High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{isAr ? 'الرسالة' : 'Message'}</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} /></div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? '...' : (isAr ? 'إرسال التذكرة' : 'Submit Ticket')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
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
        <FloatingButtons />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
