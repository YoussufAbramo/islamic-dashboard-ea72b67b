import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getField } from '@/lib/landingDefaults';

interface CoursesSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const CoursesSection = ({ content, isAr }: CoursesSectionProps) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const maxDisplay = content?.max_display || 6;

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, title_ar, description, description_ar, image_url, skill_level')
      .eq('status', 'published')
      .limit(maxDisplay)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCourses(data); });
  }, [maxDisplay]);

  if (courses.length === 0) return null;

  return (
    <section id="courses" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('Courses', 'الدورات')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={isAr ? course.title_ar : course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <BookOpen className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                {course.skill_level && (
                  <Badge className="absolute top-3 end-3" variant="secondary">{course.skill_level}</Badge>
                )}
              </div>
              <CardContent className="pt-4">
                <h3 className="font-bold text-foreground mb-2 line-clamp-1">{isAr ? (course.title_ar || course.title) : course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{isAr ? (course.description_ar || course.description) : course.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/login')}>
                  {t('Learn More', 'اعرف المزيد')} <ChevronRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
