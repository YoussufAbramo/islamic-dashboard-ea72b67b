import { useLanguage } from '@/contexts/LanguageContext';
import { Signal } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

const CourseLevels = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'المستويات' : 'Levels'}</h1>
      <EmptyState
        icon={Signal}
        title={isAr ? 'لم يتم إنشاء أي مستويات بعد' : 'No levels created yet'}
        description={isAr ? 'تحديد مستويات الصعوبة للدورات' : 'Define difficulty levels for courses'}
      />
    </div>
  );
};

export default CourseLevels;
