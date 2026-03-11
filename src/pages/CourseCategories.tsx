import { useLanguage } from '@/contexts/LanguageContext';
import { FolderTree } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

const CourseCategories = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'التصنيفات' : 'Categories'}</h1>
      <EmptyState
        icon={FolderTree}
        title={isAr ? 'لم يتم إنشاء أي تصنيفات بعد' : 'No categories created yet'}
        description={isAr ? 'تنظيم الدورات حسب التصنيفات والموضوعات' : 'Organize courses by categories and topics'}
      />
    </div>
  );
};

export default CourseCategories;
