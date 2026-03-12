import EmptyState from '@/components/EmptyState';
import { BookOpen } from 'lucide-react';

interface Props {
  isAr: boolean;
  isAdmin: boolean;
  onCreateClick: () => void;
}

const LibraryEmptyState = ({ isAr, isAdmin, onCreateClick }: Props) => (
  <EmptyState
    icon={BookOpen}
    title={isAr ? 'لا توجد كتب إلكترونية بعد' : 'No e-books yet'}
    description={isAr
      ? 'أضف كتبًا إلكترونية لبدء بناء مكتبتك الرقمية.'
      : 'Add e-books to start building your digital library.'}
    actionLabel={isAdmin ? (isAr ? 'إضافة كتاب' : 'Add E-book') : undefined}
    onAction={isAdmin ? onCreateClick : undefined}
  />
);

export default LibraryEmptyState;
