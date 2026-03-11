import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, CheckCheck, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '@/components/PageSkeleton';

const Notifications = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success(isAr ? 'تم تحديد الكل كمقروء' : 'All marked as read');
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleClick = (n: any) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filteredNotifications);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold shrink-0">{isAr ? 'الإشعارات' : 'Notifications'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-48 sm:w-64"
            />
          </div>
          {unreadCount > 0 && <Badge>{unreadCount} {isAr ? 'غير مقروء' : 'unread'}</Badge>}
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 me-1" />{isAr ? 'تحديد الكل كمقروء' : 'Mark All Read'}
          </Button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">
          {searchQuery ? (isAr ? 'لا توجد نتائج مطابقة' : 'No matching results') : (isAr ? 'لا توجد إشعارات' : 'No notifications')}
        </CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedItems.map(n => (
              <Card
                key={n.id}
                className={`cursor-pointer hover:shadow-md hover:border-primary/30 transition-all ${!n.is_read ? 'border-primary/40 bg-primary/5' : ''}`}
                onClick={() => handleClick(n)}
              >
                <CardContent className="py-4 flex items-start gap-3">
                  <div className={`p-2 rounded-full ${!n.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Bell className={`h-4 w-4 ${!n.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), 'PP')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    {n.link && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <ExternalLink className="h-3 w-3" />
                        <span>{isAr ? 'انتقال' : 'Go to page'}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}
    </div>
  );
};

export default Notifications;
