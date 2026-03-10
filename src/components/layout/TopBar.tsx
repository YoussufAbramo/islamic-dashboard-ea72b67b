import { Moon, Sun, Bell, Megaphone, Globe, Plus, CheckCheck, ExternalLink, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TopBar = () => {
  const { user, role } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [announcementDetailOpen, setAnnouncementDetailOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', title_ar: '', content: '', content_ar: '', target_audience: 'all', scheduled_at: '' });
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

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
    if (error) { toast.error(error.message); return; }
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

  const iconBtnClass = "rounded-full h-9 w-9";

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="rounded-full" />
        <div className="flex-1" />

        {/* Go to Landing Page - opens in new tab */}
        <Button variant="ghost" size="icon" className={iconBtnClass} onClick={() => window.open('/', '_blank')}>
          <Home className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className={iconBtnClass} onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
          <Globe className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className={iconBtnClass} onClick={toggleDark}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Announcements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={`${iconBtnClass} relative`}>
              <Megaphone className="h-4 w-4" />
              {announcements.length > 0 && <Badge className="absolute top-0 -end-0.5 h-4 min-w-[16px] p-0 text-[10px] flex items-center justify-center">{announcements.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">{isAr ? 'الإعلانات' : 'Announcements'}</span>
              <div className="flex gap-1">
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setAddAnnouncementOpen(true)}>
                    <Plus className="h-3 w-3" />
                  </Button>
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

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={`${iconBtnClass} relative`}>
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && <Badge className="absolute top-0 -end-0.5 h-4 min-w-[16px] p-0 text-[10px] flex items-center justify-center">{notifications.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">{isAr ? 'الإشعارات' : 'Notifications'}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={markAllNotificationsRead} title={isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}>
                <CheckCheck className="h-3 w-3" />
              </Button>
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
      </header>

      {/* Announcement Detail Dialog */}
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

      {/* Add Announcement Dialog */}
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
    </>
  );
};

export default TopBar;
