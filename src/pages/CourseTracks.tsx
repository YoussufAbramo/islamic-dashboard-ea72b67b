import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Route } from 'lucide-react';

const CourseTracks = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isAr ? 'المسارات التعليمية' : 'Course Tracks'}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Route className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{isAr ? 'المسارات التعليمية' : 'Course Tracks'}</CardTitle>
              <CardDescription>{isAr ? 'تنظيم الدورات في مسارات تعليمية متسلسلة' : 'Organize courses into sequential learning tracks'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{isAr ? 'لم يتم إنشاء أي مسارات بعد.' : 'No tracks created yet.'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseTracks;
