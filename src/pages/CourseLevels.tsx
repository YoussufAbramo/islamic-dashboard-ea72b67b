import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Signal } from 'lucide-react';

const CourseLevels = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'المستويات' : 'Levels'}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Signal className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{isAr ? 'مستويات الدورات' : 'Course Levels'}</CardTitle>
              <CardDescription>{isAr ? 'تحديد مستويات الصعوبة للدورات' : 'Define difficulty levels for courses'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{isAr ? 'لم يتم إنشاء أي مستويات بعد.' : 'No levels created yet.'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseLevels;
