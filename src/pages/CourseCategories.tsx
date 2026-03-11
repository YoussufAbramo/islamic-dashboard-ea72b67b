import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderTree } from 'lucide-react';

const CourseCategories = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'التصنيفات' : 'Categories'}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{isAr ? 'تصنيفات الدورات' : 'Course Categories'}</CardTitle>
              <CardDescription>{isAr ? 'تنظيم الدورات حسب التصنيفات والموضوعات' : 'Organize courses by categories and topics'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{isAr ? 'لم يتم إنشاء أي تصنيفات بعد.' : 'No categories created yet.'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseCategories;
