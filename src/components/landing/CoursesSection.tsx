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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer border border-border/40 hover:border-primary/40 bg-card shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/login')}
            >
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={isAr ? course.title_ar : course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {course.skill_level && (
                  <Badge className="absolute top-3 end-3 text-[10px] px-2 py-0.5 bg-background/80 backdrop-blur-sm text-foreground border-0">{course.skill_level}</Badge>
                )}
                {/* Title on image */}
                <div className="absolute bottom-0 start-0 end-0 p-4">
                  <h3 className="font-bold text-white text-sm line-clamp-2 drop-shadow-md">{isAr ? (course.title_ar || course.title) : course.title}</h3>
                </div>
              </div>
              {/* Bottom */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{isAr ? (course.description_ar || course.description) : course.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-primary group-hover:underline underline-offset-2">
                    {t('Learn More', 'اعرف المزيد')}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-primary rtl:-scale-x-100 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
