import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Props {
  ebooks: { id: string; created_at: string }[];
  loading: boolean;
  isAr: boolean;
}

const LibraryStatsCards = ({ ebooks, loading, isAr }: Props) => {
  const totalCount = ebooks.length;
  const thisMonth = ebooks.filter(e => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const latest = ebooks.length > 0
    ? format(new Date(ebooks.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b).created_at), 'PP')
    : '—';

  const stats = [
    { label: isAr ? 'إجمالي الكتب' : 'Total E-books', value: String(totalCount), icon: BookOpen, accent: 'text-primary' },
    { label: isAr ? 'أضيفت هذا الشهر' : 'Added This Month', value: String(thisMonth), icon: FileText, accent: 'text-green-500' },
    { label: isAr ? 'آخر إضافة' : 'Last Added', value: latest, icon: Calendar, accent: 'text-blue-500' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
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
