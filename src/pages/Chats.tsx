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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Ban, CheckCircle, Trash2, Plus, Search, ArrowDown, ArrowUp, Users, UserPlus, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { format } from 'date-fns';
import islamicBg from '@/assets/other/islamic-bg.jpg';
import { ChatSkeleton } from '@/components/PageSkeleton';

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
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ student_id: '', teacher_id: '', name: '', subscription_id: '', group_students: [] as string[], group_teachers: [] as string[] });
  const [createLoading, setCreateLoading] = useState(false);

  // Group members state
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [addMemberKey, setAddMemberKey] = useState(0);

  const fetchChats = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chats')
      .select('*, teachers:teacher_id(user_id, profiles:teachers_user_id_profiles_fkey(full_name)), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name))')
      .order('created_at', { ascending: false });
    setChats(data || []);
    setLoading(false);
  };

  const [senderRoles, setSenderRoles] = useState<Record<string, string>>({});

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles:chat_messages_sender_id_profiles_fkey(full_name)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    // Fetch roles for all unique senders
    const senderIds = [...new Set((data || []).map((m: any) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', senderIds);
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
      setSenderRoles(roleMap);
    }
  };

  const fetchGroupMembers = async (chatId: string) => {
    const { data } = await supabase
      .from('chat_members')
      .select('*, profiles:user_id(full_name)')
      .eq('chat_id', chatId);
    setGroupMembers(data || []);
  };

  const fetchFormData = async () => {
    const [s, te, subs] = await Promise.all([
      supabase.from('students').select('id, user_id, profiles:students_user_id_profiles_fkey(full_name)'),
      supabase.from('teachers').select('id, user_id, profiles:teachers_user_id_profiles_fkey(full_name)'),
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
      if (selectedChat.is_group) fetchGroupMembers(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
      // Mark chats as read
      localStorage.setItem('chat_last_check', new Date().toISOString());
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    if (selectedChat.is_suspended) { notifyError({ error: 'CHAT_SUSPENDED', isAr }); return; }
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

  const addGroupMember = async (userId: string, memberRole: string) => {
    // Check DB directly to avoid stale state issues
    const { data: existingRows } = await supabase
      .from('chat_members')
      .select('id')
      .eq('chat_id', selectedChat.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingRows) {
      toast.error(isAr ? 'هذا العضو موجود بالفعل' : 'This member already exists');
      setAddMemberKey(prev => prev + 1);
      return;
    }
    const { error } = await supabase.from('chat_members').insert({
      chat_id: selectedChat.id,
      user_id: userId,
      role: memberRole,
    });
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تمت إضافة العضو' : 'Member added');
    setAddMemberKey(prev => prev + 1);
    fetchGroupMembers(selectedChat.id);
  };

  const removeGroupMember = async (memberId: string) => {
    await supabase.from('chat_members').delete().eq('id', memberId);
    toast.success(isAr ? 'تمت إزالة العضو' : 'Member removed');
    fetchGroupMembers(selectedChat.id);
  };

  const handleCreateChat = async () => {
    if (chatType === 'direct') {
      if (!createForm.student_id && !createForm.teacher_id) {
        notifyError({ error: 'VAL_SELECT_USER', isAr });
        return;
      }
    } else {
      if (!createForm.name) {
        notifyError({ error: 'VAL_GROUP_NAME', isAr });
        return;
      }
    }

    setCreateLoading(true);
    const insertData: any = {
      is_group: chatType === 'group',
      name: chatType === 'group' ? createForm.name : null,
      subscription_id: chatType === 'group' && createForm.subscription_id ? createForm.subscription_id : null,
      student_id: chatType === 'direct' ? (createForm.student_id || null) : null,
      teacher_id: chatType === 'direct' ? (createForm.teacher_id || null) : null,
    };

    const { data: newChat, error } = await supabase.from('chats').insert(insertData).select().single();
    if (error) {
      notifyError({ error, isAr, rawMessage: error.message });
      setCreateLoading(false);
      return;
    }

    // For group chats, add selected members to chat_members
    if (chatType === 'group' && newChat) {
      const members: { chat_id: string; user_id: string; role: string }[] = [];
      createForm.group_students.forEach(sid => {
        const student = studentsList.find(s => s.id === sid);
        if (student) members.push({ chat_id: newChat.id, user_id: student.user_id, role: 'student' });
      });
      createForm.group_teachers.forEach(tid => {
        const teacher = teachersList.find(t => t.id === tid);
        if (teacher) members.push({ chat_id: newChat.id, user_id: teacher.user_id, role: 'teacher' });
      });
      if (members.length > 0) {
        await supabase.from('chat_members').insert(members);
      }
    }

    setCreateLoading(false);
    toast.success(isAr ? 'تم إنشاء المحادثة' : 'Chat created');
    setCreateOpen(false);
    setCreateForm({ student_id: '', teacher_id: '', name: '', subscription_id: '', group_students: [], group_teachers: [] });
    fetchChats();
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

  const toggleMultiSelect = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  if (loading) return <ChatSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('chats.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث في المحادثات...' : 'Search chats...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 w-48 sm:w-64 h-9" />
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
              {paginatedChats.map((chat) => {
                const lastCheck = localStorage.getItem(`chat_read_${chat.id}`) || '1970-01-01T00:00:00Z';
                const isUnread = chat.latest_message_at && new Date(chat.latest_message_at) > new Date(lastCheck);
                return (
                <div key={chat.id} className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedChat?.id === chat.id ? 'bg-muted' : ''} ${isUnread ? 'bg-primary/5 border-s-2 border-s-primary' : ''}`} onClick={() => { setSelectedChat(chat); localStorage.setItem(`chat_read_${chat.id}`, new Date().toISOString()); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`}>{getChatLabel(chat)}</p>
                      {chat.is_group && <Badge variant="outline" className="text-[10px] mt-1">{isAr ? 'مجموعة' : 'Group'}</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      {isUnread && <div className="h-2 w-2 rounded-full bg-primary" />}
                      {chat.is_suspended && <Badge variant="destructive" className="text-xs">{t('chats.suspended')}</Badge>}
                    </div>
                  </div>
                </div>
                );
              })}
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
              <CardHeader className="pb-2 flex-row items-center justify-between border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getChatLabel(selectedChat).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{getChatLabel(selectedChat)}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedChat.is_group
                        ? `${isAr ? 'مجموعة' : 'Group'} • ${groupMembers.length} ${isAr ? 'عضو' : 'members'}`
                        : (isAr ? 'محادثة مباشرة' : 'Direct Chat')}
                    </p>
                  </div>
                  {selectedChat.is_suspended && <Badge variant="destructive" className="text-xs">{t('chats.suspended')}</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {selectedChat.is_group && (
                    <Dialog onOpenChange={(open) => { if (open) { fetchFormData(); fetchGroupMembers(selectedChat.id); } }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {isAr ? 'الأعضاء' : 'Members'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>{isAr ? 'أعضاء المجموعة' : 'Group Members'}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          {/* Current Members from chat_members table */}
                          <div className="space-y-2">
                            {groupMembers.map(member => (
                              <div key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{(member.profiles?.full_name || '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{member.profiles?.full_name || member.user_id}</p>
                                    <p className="text-[10px] text-muted-foreground">{member.role === 'teacher' ? (isAr ? 'معلم' : 'Teacher') : (isAr ? 'طالب' : 'Student')}</p>
                                  </div>
                                </div>
                                {role === 'admin' && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeGroupMember(member.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {/* Legacy single teacher/student */}
                            {selectedChat.teachers?.profiles?.full_name && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedChat.teachers.profiles.full_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                <div><p className="text-sm font-medium">{selectedChat.teachers.profiles.full_name}</p><p className="text-[10px] text-muted-foreground">{isAr ? 'معلم (أساسي)' : 'Teacher (primary)'}</p></div>
                              </div>
                            )}
                            {selectedChat.students?.profiles?.full_name && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedChat.students.profiles.full_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                <div><p className="text-sm font-medium">{selectedChat.students.profiles.full_name}</p><p className="text-[10px] text-muted-foreground">{isAr ? 'طالب (أساسي)' : 'Student (primary)'}</p></div>
                              </div>
                            )}
                            {groupMembers.length === 0 && !selectedChat.teachers?.profiles?.full_name && !selectedChat.students?.profiles?.full_name && (
                              <p className="text-sm text-muted-foreground text-center py-2">{isAr ? 'لا يوجد أعضاء' : 'No members yet'}</p>
                            )}
                          </div>

                          {/* Add Members (admin only) */}
                          {role === 'admin' && (
                            <div className="border-t border-border pt-3 space-y-3">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><UserPlus className="h-3 w-3" />{isAr ? 'إضافة أعضاء' : 'Add Members'}</p>
                              <div className="space-y-1">
                                <Label className="text-xs">{isAr ? 'إضافة معلم' : 'Add Teacher'}</Label>
                                <Select key={`teacher-add-${addMemberKey}`} onValueChange={async (v) => {
                                  const teacher = teachersList.find(t => t.id === v);
                                  if (teacher) await addGroupMember(teacher.user_id, 'teacher');
                                }}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? 'اختر معلم...' : 'Select teacher...'} /></SelectTrigger>
                                  <SelectContent>
                                    {teachersList.filter(t => !groupMembers.some(m => m.user_id === t.user_id)).map(t => (
                                      <SelectItem key={t.id} value={t.id}>{t.profiles?.full_name || t.id}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{isAr ? 'إضافة طالب' : 'Add Student'}</Label>
                                <Select key={`student-add-${addMemberKey}`} onValueChange={async (v) => {
                                  const student = studentsList.find(s => s.id === v);
                                  if (student) await addGroupMember(student.user_id, 'student');
                                }}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? 'اختر طالب...' : 'Select student...'} /></SelectTrigger>
                                  <SelectContent>
                                    {studentsList.filter(s => !groupMembers.some(m => m.user_id === s.user_id)).map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name || s.id}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {role === 'admin' && (
                    <Button variant="outline" size="sm" onClick={toggleSuspend}>
                      {selectedChat.is_suspended ? <CheckCircle className="h-3 w-3 me-1" /> : <Ban className="h-3 w-3 me-1" />}
                      {selectedChat.is_suspended ? t('chats.unsuspend') : t('chats.suspend')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 relative">
                  <div className="absolute inset-0 opacity-15 dark:opacity-10" style={{ backgroundImage: `url(${islamicBg})`, backgroundSize: '400px 400px', backgroundRepeat: 'repeat' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />
                  <div className="space-y-3 p-4 min-h-full relative z-10">
                    {messages.map((msg, idx) => {
                      const isOwn = msg.sender_id === user?.id;
                      const initials = (msg.profiles?.full_name || '?').charAt(0).toUpperCase();
                      const senderRole = senderRoles[msg.sender_id] || '';
                      const roleColors: Record<string, string> = {
                        admin: 'bg-destructive/15 text-destructive border-destructive/20',
                        teacher: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
                        student: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                      };
                      const roleLabels: Record<string, string> = {
                        admin: isAr ? 'مشرف' : 'Admin',
                        teacher: isAr ? 'معلم' : 'Teacher',
                        student: isAr ? 'طالب' : 'Student',
                      };
                      const avatarColors: Record<string, string> = {
                        admin: 'bg-destructive/10 text-destructive',
                        teacher: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                        student: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      };
                      const msgDate = new Date(msg.created_at);
                      const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
                      const showDateSep = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
                      const today = new Date();
                      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
                      const dateLabel = msgDate.toDateString() === today.toDateString()
                        ? (isAr ? 'اليوم' : 'Today')
                        : msgDate.toDateString() === yesterday.toDateString()
                          ? (isAr ? 'أمس' : 'Yesterday')
                          : format(msgDate, 'dd MMM yyyy');
                      return (
                        <div key={msg.id}>
                          {showDateSep && (
                            <div className="flex items-center gap-3 my-3">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-[10px] text-muted-foreground bg-background/80 px-2.5 py-0.5 rounded-full border">{dateLabel}</span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}
                          <div className={`group flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {!isOwn && (
                              <Avatar className="h-6 w-6 shrink-0 ring-1 ring-background">
                                <AvatarFallback className={`text-[9px] font-semibold ${avatarColors[senderRole] || 'bg-primary/10 text-primary'}`}>{initials}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-[75%] rounded-xl text-xs ${msg.is_deleted ? 'bg-muted/60 italic text-muted-foreground px-2.5 py-1.5' : isOwn ? 'bg-primary text-primary-foreground px-2.5 py-1.5' : 'bg-card border border-border px-2.5 py-1.5'}`}>
                              {!isOwn && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="text-[10px] font-semibold">{msg.profiles?.full_name}</span>
                                  {senderRole && (
                                    <span className={`text-[8px] px-1 rounded-full border font-medium leading-3 ${roleColors[senderRole] || ''}`}>
                                      {roleLabels[senderRole] || senderRole}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-end gap-2">
                                <p className="leading-snug flex-1">{msg.message}</p>
                                <span className={`text-[8px] shrink-0 whitespace-nowrap ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>{format(msgDate, 'hh:mm a')}</span>
                              </div>
                            </div>
                            {(role === 'admin' || role === 'teacher') && !msg.is_deleted && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="min-w-[120px]">
                                  <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 text-xs" onClick={() => deleteMessage(msg.id)}>
                                    <Trash2 className="h-3 w-3" />
                                    {isAr ? 'حذف' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {isOwn && (
                              <Avatar className="h-6 w-6 shrink-0 ring-1 ring-background">
                                <AvatarFallback className={`text-[9px] font-semibold ${avatarColors[senderRole] || 'bg-primary/10 text-primary'}`}>{initials}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
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

      {/* Create Chat Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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
                  <Label>{isAr ? 'الطالب' : 'Student'}</Label>
                  <Select value={createForm.student_id} onValueChange={(v) => setCreateForm({ ...createForm, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر طالب' : 'Select student'} /></SelectTrigger>
                    <SelectContent>{studentsList.map((s) => <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name || s.id}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? 'المعلم' : 'Teacher'}</Label>
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
                  <Label>{isAr ? 'الاشتراك المرتبط (اختياري)' : 'Linked Subscription (optional)'}</Label>
                  <Select value={createForm.subscription_id} onValueChange={(v) => setCreateForm({ ...createForm, subscription_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر اشتراك' : 'Select subscription'} /></SelectTrigger>
                    <SelectContent>{subscriptionsList.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.students?.profiles?.full_name || ''} - {sub.courses?.title || ''}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Multi-select teachers */}
                <div>
                  <Label>{isAr ? 'المعلمون' : 'Teachers'}</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1 p-2 border rounded-md min-h-[40px]">
                    {teachersList.map(te => (
                      <button
                        key={te.id}
                        type="button"
                        onClick={() => setCreateForm(prev => ({ ...prev, group_teachers: toggleMultiSelect(prev.group_teachers, te.id) }))}
                        className={`px-2 py-1 rounded-md text-xs border transition-all ${createForm.group_teachers.includes(te.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'}`}
                      >
                        {te.profiles?.full_name || te.id}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Multi-select students */}
                <div>
                  <Label>{isAr ? 'الطلاب' : 'Students'}</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1 p-2 border rounded-md min-h-[40px]">
                    {studentsList.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCreateForm(prev => ({ ...prev, group_students: toggleMultiSelect(prev.group_students, s.id) }))}
                        className={`px-2 py-1 rounded-md text-xs border transition-all ${createForm.group_students.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'}`}
                      >
                        {s.profiles?.full_name || s.id}
                      </button>
                    ))}
                  </div>
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
