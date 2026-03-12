import { Moon, Sun, Bell, Megaphone, Globe, Plus, CheckCheck, ExternalLink, Eye, Languages, Search, StopCircle, Timer, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import GlobalSearch from '@/components/GlobalSearch';

const ArabicLetterIcon = () => (
  <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>ع</span>
);

const formatTimer = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TopBar = () => {
  const { user, role } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { activeSessionId, activeEntry, sessionStartedAt, pendingAttend, endSession } = useSession();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [announcementDetailOpen, setAnnouncementDetailOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', title_ar: '', content: '', content_ar: '', target_audience: 'all', scheduled_at: '' });
  const [searchOpen, setSearchOpen] = useState(false);
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

  // Session timer state
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeSessionId && sessionStartedAt) {
      const start = new Date(sessionStartedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSessionId, sessionStartedAt]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchData = () => {
    if (!user) return;
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(10).then(({ data }) => setNotifications(data || []));
    supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10).then(({ data }) => setAnnouncements(data || []));
  };

  useEffect(() => { fetchData(); }, [user]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications([]);
    toast.success(isAr ? 'تم تحديد الكل كمقروء' : 'All marked as read');
  };

  const handleCreateAnnouncement = async () => {
    const { error } = await supabase.from('announcements').insert({
      title: announcementForm.title,
      title_ar: announcementForm.title_ar,
      content: announcementForm.content,
      content_ar: announcementForm.content_ar,
      target_audience: announcementForm.target_audience,
      scheduled_at: announcementForm.scheduled_at || null,
      created_by: user?.id,
      is_active: true,
    });
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم إنشاء الإعلان' : 'Announcement created');
    setAddAnnouncementOpen(false);
    setAnnouncementForm({ title: '', title_ar: '', content: '', content_ar: '', target_audience: 'all', scheduled_at: '' });
    fetchData();
  };

  const handleNotificationClick = (n: any) => {
    if (n.link) {
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id).then(() => {
        setNotifications(prev => prev.filter(x => x.id !== n.id));
      });
      navigate(n.link);
    }
  };

  const handleAnnouncementClick = (a: any) => {
    setSelectedAnnouncement(a);
    setAnnouncementDetailOpen(true);
  };

  const handleEndSessionClick = () => {
    const result = endSession();
    if (result) {
      const isOnAttendPage = window.location.pathname.includes('/attend-lesson');
      if (isOnAttendPage) {
        window.dispatchEvent(new CustomEvent('session-end-request', { detail: result }));
      } else {
        // Navigate to attend-lesson page first, then dispatch the event after mount
        navigate('/dashboard/attend-lesson');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('session-end-request', { detail: result }));
        }, 500);
      }
    }
  };

  const iconBtnClass = "rounded-full h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted";

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b bg-background px-4 sticky top-0 z-30">
        <SidebarTrigger className="rounded-full" />

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} className="gap-2 h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs hidden sm:inline">{isAr ? 'بحث...' : 'Search...'}</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isAr ? 'بحث سريع (Ctrl+K)' : 'Quick Search (Ctrl+K)'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex-1" />

        {/* Pending Attend button in TopBar */}
        {pendingAttend && !activeSessionId && (
          <Button
            size="sm"
            className="gap-1.5 h-8"
            onClick={pendingAttend.onAttend}
          >
            <Video className="h-3.5 w-3.5" />
            {isAr ? 'حضور' : 'Attend'}
          </Button>
        )}

        {/* Active Session Timer in TopBar */}
        {activeSessionId && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-destructive/30 bg-destructive/5 text-destructive font-mono text-sm px-3 py-1 animate-pulse">
              <Timer className="h-3.5 w-3.5" />
              {formatTimer(elapsed)}
            </Badge>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 h-8"
              onClick={handleEndSessionClick}
            >
              <StopCircle className="h-3.5 w-3.5" />
              {isAr ? 'إنهاء الجلسة' : 'End Session'}
            </Button>
          </div>
        )}

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={iconBtnClass} onClick={() => window.open('/', '_blank')}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isAr ? 'الصفحة الرئيسية' : 'Landing Page'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={iconBtnClass} onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
                <Languages className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isAr ? 'تغيير اللغة' : 'Switch Language'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={iconBtnClass} onClick={toggleDark}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{darkMode ? (isAr ? 'الوضع الفاتح' : 'Light Mode') : (isAr ? 'الوضع الداكن' : 'Dark Mode')}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={`${iconBtnClass} relative`}>
                    <Megaphone className="h-4 w-4" />
                    {announcements.length > 0 && <Badge className="absolute top-0 -end-0.5 h-4 min-w-[16px] p-0 text-[10px] flex items-center justify-center bg-red-500 text-white border-red-500 hover:bg-red-600">{announcements.length}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{isAr ? 'الإعلانات' : 'Announcements'}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">{isAr ? 'الإعلانات' : 'Announcements'}</span>
                <div className="flex gap-1">
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAddAnnouncementOpen(true)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? 'إعلان جديد' : 'New Announcement'}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              {announcements.length === 0 ? (
                <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
              ) : announcements.slice(0, 5).map((a) => (
                <DropdownMenuItem key={a.id} className="flex flex-col items-start cursor-pointer" onClick={() => handleAnnouncementClick(a)}>
                  <span className="font-medium text-sm">{isAr && a.title_ar ? a.title_ar : a.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{isAr && a.content_ar ? a.content_ar : a.content}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary text-sm" onClick={() => navigate('/dashboard/announcements')}>
                <ExternalLink className="h-3 w-3 me-1" />{isAr ? 'عرض الكل' : 'View All'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={`${iconBtnClass} relative`}>
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && <Badge className="absolute top-0 -end-0.5 h-4 min-w-[16px] p-0 text-[10px] flex items-center justify-center bg-red-500 text-white border-red-500 hover:bg-red-600">{notifications.length}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{isAr ? 'الإشعارات' : 'Notifications'}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">{isAr ? 'الإشعارات' : 'Notifications'}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={markAllNotificationsRead}>
                      <CheckCheck className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}</TooltipContent>
                </Tooltip>
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
              ) : notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start cursor-pointer" onClick={() => handleNotificationClick(n)}>
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary text-sm" onClick={() => navigate('/dashboard/notifications')}>
                <ExternalLink className="h-3 w-3 me-1" />{isAr ? 'عرض الكل' : 'View All'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </header>

      <Dialog open={announcementDetailOpen} onOpenChange={setAnnouncementDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {selectedAnnouncement && (isAr && selectedAnnouncement.title_ar ? selectedAnnouncement.title_ar : selectedAnnouncement?.title)}
            </DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{isAr && selectedAnnouncement.content_ar ? selectedAnnouncement.content_ar : selectedAnnouncement.content}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedAnnouncement.target_audience === 'all' ? (isAr ? 'الجميع' : 'Everyone') : selectedAnnouncement.target_audience}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addAnnouncementOpen} onOpenChange={setAddAnnouncementOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'إعلان جديد' : 'New Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label><Input value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} /></div>
            <div><Label>{isAr ? 'العنوان بالعربية' : 'Title (AR)'}</Label><Input value={announcementForm.title_ar} onChange={e => setAnnouncementForm({ ...announcementForm, title_ar: e.target.value })} dir="rtl" /></div>
            <div><Label>{isAr ? 'المحتوى' : 'Content'}</Label><Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={3} /></div>
            <div><Label>{isAr ? 'المحتوى بالعربية' : 'Content (AR)'}</Label><Textarea value={announcementForm.content_ar} onChange={e => setAnnouncementForm({ ...announcementForm, content_ar: e.target.value })} dir="rtl" rows={3} /></div>
            <div>
              <Label>{isAr ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
              <Select value={announcementForm.target_audience} onValueChange={v => setAnnouncementForm({ ...announcementForm, target_audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الجميع' : 'Everyone'}</SelectItem>
                  <SelectItem value="teachers">{isAr ? 'المعلمون' : 'Teachers'}</SelectItem>
                  <SelectItem value="students">{isAr ? 'الطلاب' : 'Students'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'جدولة (اختياري)' : 'Schedule (optional)'}</Label>
              <Input type="datetime-local" value={announcementForm.scheduled_at} onChange={e => setAnnouncementForm({ ...announcementForm, scheduled_at: e.target.value })} />
            </div>
            <Button onClick={handleCreateAnnouncement} className="w-full">{isAr ? 'إنشاء' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default TopBar;
