import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Ban, CheckCircle, Trash2, Plus, Search, ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import islamicBg from '@/assets/islamic-bg.jpg';

type SortOrder = 'newest' | 'oldest';

const Chats = () => {
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const isAr = language === 'ar';
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [createOpen, setCreateOpen] = useState(false);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ student_id: '', teacher_id: '', name: '', subscription_id: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*, teachers:teacher_id(user_id, profiles:teachers_user_id_profiles_fkey(full_name)), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name))')
      .order('created_at', { ascending: false });
    setChats(data || []);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles:chat_messages_sender_id_profiles_fkey(full_name)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const fetchFormData = async () => {
    const [s, te, subs] = await Promise.all([
      supabase.from('students').select('id, profiles:students_user_id_profiles_fkey(full_name)'),
      supabase.from('teachers').select('id, profiles:teachers_user_id_profiles_fkey(full_name)'),
      supabase.from('subscriptions').select('id, courses:course_id(title), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name))').eq('status', 'active'),
    ]);
    setStudentsList(s.data || []);
    setTeachersList(te.data || []);
    setSubscriptionsList(subs.data || []);
  };

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    if (selectedChat.is_suspended) { toast.error(t('chats.suspended')); return; }
    await supabase.from('chat_messages').insert({ chat_id: selectedChat.id, sender_id: user.id, message: newMessage });
    setNewMessage('');
    fetchMessages(selectedChat.id);
  };

  const deleteMessage = async (messageId: string) => {
    const deletedText = isAr
      ? `تم حذف هذه الرسالة بواسطة ${role === 'admin' ? 'المسؤول' : 'المعلم'}`
      : `This message was deleted by ${role === 'admin' ? 'admin' : 'teacher'}`;
    await supabase.from('chat_messages').update({ message: deletedText, is_deleted: true }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message: deletedText, is_deleted: true } : m));
    toast.success(isAr ? 'تم حذف الرسالة' : 'Message deleted');
  };

  const toggleSuspend = async () => {
    const newStatus = !selectedChat.is_suspended;
    await supabase.from('chats').update({ is_suspended: newStatus }).eq('id', selectedChat.id);
    setSelectedChat({ ...selectedChat, is_suspended: newStatus });
    fetchChats();
    toast.success(newStatus ? t('chats.suspended') : t('chats.unsuspend'));
  };

  const handleCreateChat = async () => {
    if (chatType === 'direct') {
      if (!createForm.student_id && !createForm.teacher_id) {
        toast.error(isAr ? 'يرجى اختيار مستخدم واحد على الأقل' : 'Please select at least one user');
        return;
      }
    } else {
      if (!createForm.name || !createForm.subscription_id) {
        toast.error(isAr ? 'يرجى إدخال اسم المجموعة واختيار الاشتراك' : 'Please enter group name and select subscription');
        return;
      }
    }

    setCreateLoading(true);
    const insertData: any = {
      is_group: chatType === 'group',
      name: chatType === 'group' ? createForm.name : null,
      subscription_id: chatType === 'group' ? createForm.subscription_id : null,
      student_id: createForm.student_id || null,
      teacher_id: createForm.teacher_id || null,
    };

    const { error } = await supabase.from('chats').insert(insertData);
    setCreateLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? 'تم إنشاء المحادثة' : 'Chat created');
      setCreateOpen(false);
      setCreateForm({ student_id: '', teacher_id: '', name: '', subscription_id: '' });
      fetchChats();
    }
  };

  const getChatLabel = (chat: any) => {
    if (chat.is_group && chat.name) return chat.name;
    const teacher = chat.teachers?.profiles?.full_name || '';
    const student = chat.students?.profiles?.full_name || '';
    return `${teacher}${teacher && student ? ' ↔ ' : ''}${student}` || (isAr ? 'محادثة' : 'Chat');
  };

  const filteredChats = useMemo(() => {
    let result = chats.filter(chat => {
      if (!searchQuery) return true;
      return getChatLabel(chat).toLowerCase().includes(searchQuery.toLowerCase());
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [chats, searchQuery, sortOrder]);

  const { currentPage, totalPages, paginatedItems: paginatedChats, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filteredChats);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('chats.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="gap-1 h-9"
          >
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث في المحادثات...' : 'Search chats...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-48 sm:w-64 h-9"
            />
          </div>
          {role === 'admin' && (
            <Button size="sm" className="h-9" onClick={() => { setCreateOpen(true); fetchFormData(); }}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'محادثة جديدة' : 'New Chat'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('chats.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {paginatedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedChat?.id === chat.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{getChatLabel(chat)}</p>
                      {chat.is_group && <Badge variant="outline" className="text-[10px] mt-1">{isAr ? 'مجموعة' : 'Group'}</Badge>}
                    </div>
                    {chat.is_suspended && <Badge variant="destructive" className="text-xs">{t('chats.suspended')}</Badge>}
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && (
                <p className="p-4 text-center text-muted-foreground text-sm">
                  {searchQuery ? (isAr ? 'لا توجد نتائج' : 'No results') : t('common.noData')}
                </p>
              )}
            </ScrollArea>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{getChatLabel(selectedChat)}</CardTitle>
                  {selectedChat.is_suspended && <Badge variant="destructive" className="text-xs mt-1">{t('chats.suspended')}</Badge>}
                </div>
                {role === 'admin' && (
                  <Button variant="outline" size="sm" onClick={toggleSuspend}>
                    {selectedChat.is_suspended ? <CheckCircle className="h-3 w-3 me-1" /> : <Ban className="h-3 w-3 me-1" />}
                    {selectedChat.is_suspended ? t('chats.unsuspend') : t('chats.suspend')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 relative">
                  <div className="absolute inset-0 opacity-15 dark:opacity-10" style={{ backgroundImage: `url(${islamicBg})`, backgroundSize: '400px 400px', backgroundRepeat: 'repeat' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />
                  <div className="space-y-3 p-4 min-h-full relative z-10">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      const initials = (msg.profiles?.full_name || '?').charAt(0).toUpperCase();
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] p-2 rounded-lg text-sm ${msg.is_deleted ? 'bg-muted/60 italic text-muted-foreground' : isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-xs font-medium mb-1">{msg.profiles?.full_name}</p>
                            <p>{msg.message}</p>
                            <div className="flex items-center justify-between mt-1 gap-2">
                              <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), 'HH:mm')}</span>
                              {(role === 'admin' || role === 'teacher') && !msg.is_deleted && (
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => deleteMessage(msg.id)}>
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {isOwn && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                    {messages.length === 0 && <p className="text-center text-muted-foreground text-sm">{t('chats.noMessages')}</p>}
                  </div>
                </ScrollArea>
                {!selectedChat.is_suspended && (
                  <div className="p-3 border-t flex gap-2">
                    <Input placeholder={t('chats.typeMessage')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                    <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">{t('chats.noMessages')}</p>
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'إنشاء محادثة جديدة' : 'Create New Chat'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isAr ? 'نوع المحادثة' : 'Chat Type'}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button type="button" onClick={() => setChatType('direct')} className={`p-3 rounded-lg border-2 text-sm transition-all ${chatType === 'direct' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  {isAr ? 'محادثة مباشرة' : '1-on-1 Chat'}
                </button>
                <button type="button" onClick={() => setChatType('group')} className={`p-3 rounded-lg border-2 text-sm transition-all ${chatType === 'group' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  {isAr ? 'مجموعة' : 'Group Chat'}
                </button>
              </div>
            </div>
            {chatType === 'direct' ? (
              <>
                <div>
                  <Label>{t('subscriptions.student')}</Label>
                  <Select value={createForm.student_id} onValueChange={(v) => setCreateForm({ ...createForm, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر طالب' : 'Select student'} /></SelectTrigger>
                    <SelectContent>{studentsList.map((s) => <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name || s.id}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('subscriptions.teacher')}</Label>
                  <Select value={createForm.teacher_id} onValueChange={(v) => setCreateForm({ ...createForm, teacher_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر معلم' : 'Select teacher'} /></SelectTrigger>
                    <SelectContent>{teachersList.map((te) => <SelectItem key={te.id} value={te.id}>{te.profiles?.full_name || te.id}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>{isAr ? 'اسم المجموعة' : 'Group Name'} *</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>{isAr ? 'الاشتراك المرتبط' : 'Linked Subscription'} *</Label>
                  <Select value={createForm.subscription_id} onValueChange={(v) => setCreateForm({ ...createForm, subscription_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر اشتراك' : 'Select subscription'} /></SelectTrigger>
                    <SelectContent>{subscriptionsList.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.students?.profiles?.full_name || ''} - {sub.courses?.title || ''}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            <Button onClick={handleCreateChat} disabled={createLoading} className="w-full">
              {createLoading ? t('common.loading') : (isAr ? 'إنشاء المحادثة' : 'Create Chat')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chats;
