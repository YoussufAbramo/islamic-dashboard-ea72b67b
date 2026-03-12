import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Search, X, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { resolveAvatarUrl } from '@/lib/storage';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserEntry {
  userId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  role: 'teacher' | 'student';
}

const RECENT_KEY = 'impersonation_recent';
const MAX_RECENT = 5;

const getRecentUsers = (): UserEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
};

const addRecentUser = (user: UserEntry) => {
  const recent = getRecentUsers().filter(u => u.userId !== user.userId);
  recent.unshift(user);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const ImpersonationSwitcher = () => {
  const { role } = useAuth();
  const { startImpersonation, isImpersonating } = useImpersonation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentUsers, setRecentUsers] = useState<UserEntry[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SECURITY: Only render for admins
  if (role !== 'admin') return null;

  const fetchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      // Fetch teachers
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id, profiles:user_id(id, full_name, email, avatar_url)')
        .limit(50);

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('user_id, profiles:user_id(id, full_name, email, avatar_url)')
        .limit(50);

      const allUsers: UserEntry[] = [];

      teachers?.forEach((t: any) => {
        const p = t.profiles;
        if (p) allUsers.push({
          userId: p.id,
          fullName: p.full_name || '',
          email: p.email || null,
          avatarUrl: p.avatar_url || null,
          role: 'teacher',
        });
      });

      students?.forEach((s: any) => {
        const p = s.profiles;
        if (p) {
          // Don't add duplicates (a user could be in both tables)
          if (!allUsers.find(u => u.userId === p.id)) {
            allUsers.push({
              userId: p.id,
              fullName: p.full_name || '',
              email: p.email || null,
              avatarUrl: p.avatar_url || null,
              role: 'student',
            });
          }
        }
      });

      // Filter by search
      if (query.trim()) {
        const q = query.toLowerCase();
        setUsers(allUsers.filter(u =>
          u.fullName.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          u.userId.toLowerCase().includes(q)
        ));
      } else {
        setUsers(allUsers);
      }
    } catch (e) {
      console.error('Failed to fetch users for impersonation:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setRecentUsers(getRecentUsers());
      fetchUsers('');
    } else {
      setSearch('');
      setUsers([]);
    }
  }, [open, fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value), 300);
  };

  const handleSelectUser = async (user: UserEntry) => {
    await startImpersonation({
      userId: user.userId,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
    addRecentUser(user);
    setOpen(false);
    navigate('/dashboard');
    toast.success(isAr
      ? `تم التبديل إلى: ${user.fullName}`
      : `Now viewing as: ${user.fullName}`
    );
  };

  const teacherUsers = users.filter(u => u.role === 'teacher');
  const studentUsers = users.filter(u => u.role === 'student');

  const iconBtnClass = "rounded-full h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`${iconBtnClass} relative ${isImpersonating ? 'text-amber-600' : ''}`}
            >
              <UserCog className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{isAr ? 'تبديل المستخدم' : 'Switch User'}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{isAr ? 'تبديل المستخدم' : 'User Impersonation'}</span>
          </div>
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
              className="ps-8 h-8 text-sm"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full" onClick={() => handleSearchChange('')}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[360px]">
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Recent Users */}
              {!search && recentUsers.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 mb-1">
                    {isAr ? 'الأخيرة' : 'Recent'}
                  </p>
                  {recentUsers.map(u => (
                    <UserRow key={`recent-${u.userId}`} user={u} onClick={() => handleSelectUser(u)} isAr={isAr} />
                  ))}
                  <Separator className="my-1" />
                </div>
              )}

              {/* Teachers */}
              {teacherUsers.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 mb-1">
                    {isAr ? 'المعلمون' : 'Teachers'} ({teacherUsers.length})
                  </p>
                  {teacherUsers.map(u => (
                    <UserRow key={u.userId} user={u} onClick={() => handleSelectUser(u)} isAr={isAr} />
                  ))}
                </div>
              )}

              {/* Students */}
              {studentUsers.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 mb-1">
                    {isAr ? 'الطلاب' : 'Students'} ({studentUsers.length})
                  </p>
                  {studentUsers.map(u => (
                    <UserRow key={u.userId} user={u} onClick={() => handleSelectUser(u)} isAr={isAr} />
                  ))}
                </div>
              )}

              {!loading && users.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">
                  {isAr ? 'لا يوجد مستخدمون' : 'No users found'}
                </p>
              )}
            </>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

const UserRow = ({ user, onClick, isAr }: { user: UserEntry; onClick: () => void; isAr: boolean }) => {
  const [avatarSrc, setAvatarSrc] = useState('');

  useEffect(() => {
    if (user.avatarUrl) {
      resolveAvatarUrl(user.avatarUrl).then(setAvatarSrc);
    }
  }, [user.avatarUrl]);

  const initials = user.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
  const roleBadge = user.role === 'teacher'
    ? { label: isAr ? 'معلم' : 'Teacher', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' }
    : { label: isAr ? 'طالب' : 'Student', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-start hover:bg-muted transition-colors"
    >
      <Avatar className="h-8 w-8">
        {avatarSrc && <AvatarImage src={avatarSrc} />}
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.fullName || '-'}</p>
        {user.email && <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>}
      </div>
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${roleBadge.className}`}>
        {roleBadge.label}
      </Badge>
    </button>
  );
};

export default ImpersonationSwitcher;
