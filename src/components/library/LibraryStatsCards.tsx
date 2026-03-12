import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, Download, Newspaper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  ebooks: { id: string; created_at: string }[];
  loading: boolean;
  isAr: boolean;
}

const LibraryStatsCards = ({ ebooks, loading, isAr }: Props) => {
  const [totalReaders, setTotalReaders] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      const [viewsRes, downloadsRes] = await Promise.all([
        supabase.from('ebook_views').select('id', { count: 'exact', head: true }),
        supabase.from('ebook_downloads').select('id', { count: 'exact', head: true }),
      ]);
      setTotalReaders(viewsRes.count ?? 0);
      setTotalDownloads(downloadsRes.count ?? 0);
      setStatsLoading(false);
    };
    fetchStats();
  }, [ebooks]);

  const totalCount = ebooks.length;
  const isLoading = loading || statsLoading;

  const stats = [
    { label: isAr ? 'إجمالي الكتب' : 'Total E-books', value: String(totalCount), icon: BookOpen, accent: 'text-primary' },
    { label: isAr ? 'إجمالي القراء' : 'Total Readers', value: String(totalReaders), icon: Users, accent: 'text-green-600 dark:text-green-400' },
    { label: isAr ? 'إجمالي التحميلات' : 'Total Downloads', value: String(totalDownloads), icon: Download, accent: 'text-blue-600 dark:text-blue-400' },
    { label: isAr ? 'الكتب المدونة' : 'Total Blogged E-books', value: '—', icon: Newspaper, accent: 'text-muted-foreground', disabled: true },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Card key={i} className={`hover:shadow-md transition-shadow ${s.disabled ? 'opacity-60' : ''}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.accent}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LibraryStatsCards;
