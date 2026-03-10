import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ShieldCheck } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';

const Admins = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [admins, setAdmins] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (!roles || roles.length === 0) { setAdmins([]); return; }
      const adminIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', adminIds);
      setAdmins(profiles || []);
    };
    fetchAdmins();
  }, []);

  const filtered = admins.filter(a =>
    (a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          {isAr ? 'المشرفون' : 'Admins'}
        </h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'المشرف' : 'Admin'}</TableHead>
              <TableHead>{isAr ? 'البريد الإلكتروني' : 'Email'}</TableHead>
              <TableHead>{isAr ? 'الهاتف' : 'Phone'}</TableHead>
              <TableHead>{isAr ? 'الدور' : 'Role'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(admin => (
              <TableRow key={admin.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={admin.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {admin.full_name?.charAt(0)?.toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{admin.full_name || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>{admin.email || '-'}</TableCell>
                <TableCell>{admin.phone || '-'}</TableCell>
                <TableCell><Badge>Admin</Badge></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{isAr ? 'لا يوجد مشرفون' : 'No admins found'}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
    </div>
  );
};

export default Admins;
