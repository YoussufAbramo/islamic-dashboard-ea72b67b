import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Chats = () => {
  const { t } = useLanguage();
  const { user, role } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*, teachers:teacher_id(user_id, profiles:user_id(full_name)), students:student_id(user_id, profiles:user_id(full_name))')
      .order('created_at', { ascending: false });
    setChats(data || []);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
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
    await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', messageId);
    fetchMessages(selectedChat.id);
    toast.success('Message deleted');
  };

  const toggleSuspend = async () => {
    const newStatus = !selectedChat.is_suspended;
    await supabase.from('chats').update({ is_suspended: newStatus }).eq('id', selectedChat.id);
    setSelectedChat({ ...selectedChat, is_suspended: newStatus });
    fetchChats();
    toast.success(newStatus ? t('chats.suspended') : t('chats.unsuspend'));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('chats.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Chat list */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('chats.title')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedChat?.id === chat.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{chat.teachers?.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{chat.students?.profiles?.full_name}</p>
                    </div>
                    {chat.is_suspended && <Badge variant="destructive" className="text-xs">{t('chats.suspended')}</Badge>}
                  </div>
                </div>
              ))}
              {chats.length === 0 && <p className="p-4 text-center text-muted-foreground text-sm">{t('common.noData')}</p>}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {selectedChat.teachers?.profiles?.full_name} ↔ {selectedChat.students?.profiles?.full_name}
                  </CardTitle>
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
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.filter(m => !m.is_deleted).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-2 rounded-lg text-sm ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-xs font-medium mb-1">{msg.profiles?.full_name}</p>
                          <p>{msg.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] opacity-70">{format(new Date(msg.created_at), 'HH:mm')}</span>
                            {role === 'admin' && (
                              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => deleteMessage(msg.id)}>
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.filter(m => !m.is_deleted).length === 0 && <p className="text-center text-muted-foreground text-sm">{t('chats.noMessages')}</p>}
                  </div>
                </ScrollArea>
                {!selectedChat.is_suspended && (
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      placeholder={t('chats.typeMessage')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
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
    </div>
  );
};

export default Chats;
