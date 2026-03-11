import { useLanguage } from '@/contexts/LanguageContext';
import { Route } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

const CourseTracks = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'المسارات التعليمية' : 'Course Tracks'}</h1>
      <EmptyState
        icon={Route}
        title={isAr ? 'لم يتم إنشاء أي مسارات بعد' : 'No tracks created yet'}
        description={isAr ? 'تنظيم الدورات في مسارات تعليمية متسلسلة' : 'Organize courses into sequential learning tracks'}
      />
    </div>
  );
};

export default CourseTracks;
