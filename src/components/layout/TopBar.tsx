import { Moon, Sun, Bell, Megaphone, Globe, LogOut, User, Plus, CheckCheck, Eye } from 'lucide-react';
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
  const { user, profile, signOut, role } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
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

  const handleLogout = async () => { await signOut(); navigate('/login'); };

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

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger />
        <div className="flex-1" />

        <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
          <Globe className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleDark}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Announcements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Megaphone className="h-4 w-4" />
              {announcements.length > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{announcements.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">{isAr ? 'الإعلانات' : 'Announcements'}</span>
              <div className="flex gap-1">
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddAnnouncementOpen(true)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            {announcements.length === 0 ? (
              <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
            ) : announcements.map((a) => (
              <DropdownMenuItem key={a.id} className="flex flex-col items-start">
                <span className="font-medium text-sm">{isAr && a.title_ar ? a.title_ar : a.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{isAr && a.content_ar ? a.content_ar : a.content}</span>
                {a.target_audience !== 'all' && <Badge variant="outline" className="mt-1 text-[10px]">{a.target_audience}</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{notifications.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">{isAr ? 'الإشعارات' : 'Notifications'}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllNotificationsRead} title={isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}>
                  <CheckCheck className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
            ) : notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start">
                <span className="font-medium text-sm">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="font-medium">{profile?.full_name || user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <User className="h-4 w-4 me-2" /> {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 me-2" /> {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

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
